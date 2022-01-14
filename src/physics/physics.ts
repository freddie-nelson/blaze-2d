import { vec2 } from "gl-matrix";
import { System } from "../system";
import CollisionObject from "./collisionObject";
import RigidBody from "./rigidbody";
import solveImpulse from "./solvers/collision/impulse";
import solveVelocity from "./solvers/dynamics/velocity";
import CollisionsSpace from "./spaces/collisions";
import DynamicsSpace from "./spaces/dynamics";
import resetForce from "./solvers/dynamics/resetForce";
import solveForces from "./solvers/dynamics/forces";
import Texture from "../texture/texture";
import Color, { RGBAColor } from "../utils/color";
import Circle from "../shapes/circle";
import preStepImpulse from "./solvers/collision/preStepImpulse";
import solvePositionImpulse from "./solvers/collision/positionImpulse";
import applyPositionImpulse from "./solvers/collision/applyPositionImpulse";
import CircleCollider from "./collider/circle";
import GJK from "./gjk";
import Ray from "./ray";
import ConstraintSpace from "./spaces/constraints";
import preSolveConstraint from "./solvers/constraint/pre";
import solveConstraint from "./solvers/constraint/solve";
import postSolveConstraint from "./solvers/constraint/post";
import Constraint from "./constraints/constraint";
import Fluid from "./fluid/fluid";
import TimeStep from "../timestep";

const debugRGBA: RGBAColor = {
  r: 0,
  g: 220,
  b: 255,
  a: 0.2,
};
const debugTexture = new Texture(new Color(debugRGBA));

const contactRGBA: RGBAColor = {
  r: 0,
  g: 255,
  b: 0,
  a: 0.5,
};
const contactTexture = new Texture(new Color(contactRGBA));

const refRGBA: RGBAColor = {
  r: 0,
  g: 0,
  b: 255,
  a: 0.5,
};
const refTexture = new Texture(new Color(refRGBA));

const incRGBA: RGBAColor = {
  r: 255,
  g: 0,
  b: 0,
  a: 0.5,
};
const incTexture = new Texture(new Color(incRGBA));

export interface PhysicsConfig {
  POINT_SIZE: number;
  CACHED_CONTACTS_TOLERANCE: number;
  RESTITUTION_THRESHOLD: number;

  VELOCITY_ITERATIONS: number;
  ACUMMULATE_IMPULSE: boolean;
  WARM_IMPULSE: boolean;

  POSITION_ITERATIONS: number;
  POSITION_SLOP: number;
  POSITION_DAMPING: number;
  POSITION_WARMING: number;
  POSITION_SCALE: number;

  EPA_TOLERANCE: number;
  EPA_MAX_ITERATIONS: number;

  CONSTRAINT_ITERATIONS: number;
}

const defaultConfig: PhysicsConfig = {
  POINT_SIZE: 0.000001,
  CACHED_CONTACTS_TOLERANCE: 0.0008,
  RESTITUTION_THRESHOLD: 1,

  VELOCITY_ITERATIONS: 8,
  ACUMMULATE_IMPULSE: true,
  WARM_IMPULSE: true,

  POSITION_ITERATIONS: 4,
  POSITION_SLOP: 0.015,
  POSITION_DAMPING: 0.7,
  POSITION_WARMING: 0.8,
  POSITION_SCALE: 0.1,

  EPA_TOLERANCE: 0.005,
  EPA_MAX_ITERATIONS: 16,

  CONSTRAINT_ITERATIONS: 2,
};

/**
 * Handles physics for bodies added to the engine.
 *
 * Raycasting can only check against objects in the phsyics engine's collisions space.
 *
 * At the start of each `update` call the static `G_CONF` variable is set to the instances `CONFIG` variable.
 * This allows for easy access to the physics config from other parts of the physics system.
 */
export default class Physics implements System {
  static G_CONF = { ...defaultConfig };

  CONFIG = { ...defaultConfig };

  private gravity = vec2.fromValues(0, -9.8);

  // spaces
  dynamicsSpace = new DynamicsSpace(this.gravity);
  collisionsSpace = new CollisionsSpace(this.gravity);
  constraintSpace = new ConstraintSpace();

  fluids: Fluid[] = [];

  /**
   * The amount of time in ms that the last physics step took.
   */
  physicsTime = 0;

  /**
   * The time in ms that the last broadphase collision detection step took.
   */
  broadphaseTime = 0;

  /**
   * The time in ms that the last narrowphase collision detection step took.
   */
  narrowphaseTime = 0;

  /**
   * The time in ms that the last collision solving steps took.
   */
  collisionSolveTime = 0;

  /**
   * The time in ms that the last constraint solving steps took.
   */
  constraintTime = 0;

  /**
   * The time in ms that the last dynamics solving steps took.
   */
  dynamicsTime = 0;

  /**
   * The time in ms that the last fluid solving steps took.
   */
  fluidTime = 0;

  /**
   * Enable/disable debug tools.
   */
  debug = false;

  /**
   * Create an {@link Physics} instance.
   *
   * @param gravity The gravitional force applied to objects in the system
   */
  constructor(gravity?: vec2) {
    if (gravity) this.setGravity(gravity);

    // add default solvers
    this.dynamicsSpace.addSolver("forces", solveForces, 1);
    this.dynamicsSpace.addSolver("velocity", solveVelocity, 1);
    this.dynamicsSpace.addSolver("reset", resetForce, 1);

    this.collisionsSpace.addSolver("preStepImpulse", preStepImpulse, 1);
    this.collisionsSpace.addSolver("positionImpulse", solvePositionImpulse, this.CONFIG.POSITION_ITERATIONS);

    this.collisionsSpace.addSolver("impulse", solveImpulse, this.CONFIG.VELOCITY_ITERATIONS);
    this.collisionsSpace.addSolver("position", applyPositionImpulse, 1);

    this.constraintSpace.addSolver("pre", preSolveConstraint, 1);
    this.constraintSpace.addSolver("solve", solveConstraint, this.CONFIG.CONSTRAINT_ITERATIONS);
    this.constraintSpace.addSolver("post", postSolveConstraint, 1);
  }

  /**
   * Steps the physics world forward by the given delta time.
   *
   * Order of updates is very important.
   *
   * @param ts The {@link TimeStep} for this update.
   */
  update(ts: TimeStep) {
    this.physicsTime = performance.now();

    // set physics config
    Physics.G_CONF = this.CONFIG;

    // step fluids
    this.fluidTime = performance.now();
    for (const f of this.fluids) {
      f.update(ts.dt);
    }
    this.fluidTime = performance.now() - this.fluidTime;

    // step bodies
    // broadphase
    this.broadphaseTime = performance.now();
    this.collisionsSpace.broadphase();
    this.broadphaseTime = performance.now() - this.broadphaseTime;

    // narrow pahse
    this.narrowphaseTime = performance.now();
    this.collisionsSpace.obtainManifolds(ts.dt);
    this.narrowphaseTime = performance.now() - this.narrowphaseTime;

    // integrate forces
    const forceTimer = performance.now();
    this.dynamicsSpace.solve("forces", ts.dt);
    this.dynamicsTime = performance.now() - forceTimer;

    // solve collisions
    this.collisionSolveTime = performance.now();

    // pre steps
    this.collisionsSpace.solve("preStepImpulse", ts.dt);

    // solve position impulse
    this.collisionsSpace.setSolverIterations("positionImpulse", this.CONFIG.POSITION_ITERATIONS);
    this.collisionsSpace.solve("positionImpulse", ts.dt);

    // apply position impulse
    this.collisionsSpace.solve("position", ts.dt);

    // solve collision impulse
    this.collisionsSpace.setSolverIterations("impulse", this.CONFIG.VELOCITY_ITERATIONS);
    this.collisionsSpace.solve("impulse", ts.dt);

    this.collisionSolveTime = performance.now() - this.collisionSolveTime;

    // solve constraints
    this.constraintTime = performance.now();

    this.constraintSpace.solve("pre", ts.dt);

    this.constraintSpace.setSolverIterations("solve", this.CONFIG.CONSTRAINT_ITERATIONS);
    this.constraintSpace.solve("solve", ts.dt);

    this.constraintSpace.solve("post", ts.dt);

    this.constraintTime = performance.now() - this.constraintTime;

    // integrate velocities
    const velocityTimer = performance.now();
    this.dynamicsSpace.solve("velocity", ts.dt);
    this.dynamicsTime += performance.now() - velocityTimer;

    // clear forces
    this.dynamicsSpace.solve("reset", ts.dt);

    // fire collision and trigger events
    this.collisionsSpace.fireEvents();

    // debug
    if (this.debug) this.drawDebug();

    // calculate physics time
    this.physicsTime = performance.now() - this.physicsTime;
  }

  drawDebug() {
    for (const obj of this.collisionsSpace.objects) {
      // draw entity bounding boxes (colliders)
      obj.collider.texture = debugTexture;
      obj.collider.render();
    }

    for (const m of this.collisionsSpace.collisionManifolds) {
      // draw contact points
      for (const p of m.contactPoints) {
        const circle = new Circle(0.1, p.point);
        circle.texture = contactTexture;
        circle.render();
      }

      // for (let i = 0; i < m.edges.length; i++) {
      //   // incident edge is red, reference edge is blue
      //   const e = m.edges[i];
      //   let texture = i === 0 ? incTexture : refTexture;

      //   const circle = new Circle(0.1, e.p0);
      //   circle.texture = texture;
      //   circle.render();

      //   const circle2 = new Circle(0.1, e.p1);
      //   circle2.texture = texture;
      //   circle2.render();
      // }
    }
  }

  /**
   * Point pick objects.
   *
   * **NOTE: Picking only checks objects in the {@link CollisionsSpace}.**
   *
   * @param point The point to pick objects at
   */
  pick(point: vec2): CollisionObject[] {
    const picked: CollisionObject[] = [];
    const aabbs = this.collisionsSpace.aabbTree.pick(point);

    const pointCollider = new CircleCollider(this.CONFIG.POINT_SIZE, point);

    for (const aabb of aabbs) {
      const obj = aabb.obj;
      if (!obj) continue;

      const res = GJK(obj.collider, pointCollider);
      if (res.collision) picked.push(obj);
    }

    return picked;
  }

  /**
   * raycast objects.
   *
   * **NOTE: Raycast only checks objects in the {@link CollisionsSpace}.**
   *
   * @param ray The ray to cast
   */
  raycast(ray: Ray): CollisionObject[] {
    const result: CollisionObject[] = [];
    const aabbs = this.collisionsSpace.aabbTree.raycast(ray);

    for (const aabb of aabbs) {
      const obj = aabb.obj;
      if (!obj) continue;

      const res = GJK(obj.collider, ray);
      if (res.collision) result.push(obj);
    }

    return result;
  }

  /**
   * Adds a {@link CollisionObject} to the world's collisions space.
   *
   * @param c The collision object to add
   */
  addCollisionObj(c: CollisionObject) {
    this.collisionsSpace.addObject(c);
  }

  /**
   * Adds a {@link RigidBody} to the world's dynamics space.
   *
   * @param obj The object to add
   */
  addDynamicsObj(obj: RigidBody) {
    this.dynamicsSpace.addObject(obj);
  }

  /**
   * Adds a {@link Rigidbody} to the world's dynamics and collisions spaces.
   *
   * @param body The body to add
   */
  addBody(body: RigidBody) {
    this.addCollisionObj(body);
    this.addDynamicsObj(body);
  }

  /**
   * Adds the given bodies to the world's dynamics and collisions spaces.
   *
   * @param bodies The bodies to add
   */
  addBodies(...bodies: RigidBody[]) {
    for (const body of bodies) {
      this.addBody(body);
    }
  }

  /**
   * Removes a {@link CollisionObject} from the world's collisions space.
   *
   * @param c The collision object to remove
   */
  removeCollisionObj(c: CollisionObject) {
    this.collisionsSpace.removeObject(c);
  }

  /**
   * Removes a {@link RigidBody} from the world's dynamics space.
   *
   * @param obj The object to remove
   */
  removeDynamicsObj(obj: RigidBody) {
    this.dynamicsSpace.removeObject(obj);
  }

  /**
   * Removes a {@link Rigidbody} from the world's dynamics and collisions spaces.
   *
   * @param body The body to remove
   */
  removeBody(body: RigidBody) {
    this.removeCollisionObj(body);
    this.removeDynamicsObj(body);
  }

  /**
   * Removes the given bodies from the world's dynamics and collision spaces.
   *
   * @param bodies The bodies to remove
   */
  removeBodies(...bodies: RigidBody[]) {
    for (const body of bodies) {
      this.removeBody(body);
    }
  }

  /**
   * Removes all bodies from the world's dynamics and collision spaces.
   */
  removeAllBodies() {
    this.dynamicsSpace.getObjects().length = 0;
    this.collisionsSpace.getObjects().length = 0;
  }

  /**
   * Adds a {@link Constraint} to the world's constraint space.
   *
   * @param constraint The constraint to add
   */
  addConstraint(constraint: Constraint) {
    this.constraintSpace.addObject(constraint);
  }

  /**
   * Removes a {@link Constraint} from the world's constraint space.
   *
   * @param constraint The constraint to remove
   */
  removeConstraint(constraint: Constraint) {
    this.constraintSpace.removeObject(constraint);
  }

  /**
   * Removes all constraints from the world.
   */
  removeAllConstraints() {
    this.constraintSpace.getObjects().length = 0;
  }

  /**
   * Adds the given fluid to the physics world.
   *
   * @param fluid The fluid to add
   */
  addFluid(fluid: Fluid) {
    this.fluids.push(fluid);
    fluid.physics = this;

    for (const p of fluid.particles) {
      this.addCollisionObj(p);
    }
  }

  /**
   * Removes the given fluid from the physics world.
   *
   * @param fluid The fluid to remove
   */
  removeFluid(fluid: Fluid) {
    const i = this.fluids.findIndex((f) => f === fluid);
    if (i === -1) return;

    this.fluids.splice(i, 1);
    this.removeBodies(...fluid.particles);
  }

  /**
   * Removes all fluids from the world.
   */
  removeAllFluids() {
    for (const fluid of this.fluids) {
      this.removeFluid(fluid);
    }
  }

  /**
   * Sets the gravity to use in the physics world.
   *
   * @param gravity The new gravity to use
   */
  setGravity(gravity: vec2) {
    this.gravity = vec2.clone(gravity);
    this.dynamicsSpace.gravity = vec2.clone(gravity);
    this.collisionsSpace.gravity = vec2.clone(gravity);
  }

  /**
   * Gets the gravity vector the physics world is using.
   *
   * @returns The gravity in use
   */
  getGravity() {
    return this.gravity;
  }
}
