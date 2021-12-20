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
}

/**
 * Handles physics for bodies added to the engine.
 *
 * Raycasting can only check against objects in the phsyics engine's collisions space.
 *
 * At the start of each `update` call the static `G_CONF` variable is set to the instances `CONFIG` variable.
 * This allows for easy access to the physics config from other parts of the physics system.
 */
export default class Physics {
  static G_CONF: PhysicsConfig;

  CONFIG: PhysicsConfig = {
    CACHED_CONTACTS_TOLERANCE: 0.0005,
    RESTITUTION_THRESHOLD: 1,

    VELOCITY_ITERATIONS: 8,
    ACUMMULATE_IMPULSE: true,
    WARM_IMPULSE: true,
    POSITION_ITERATIONS: 4,
    POSITION_SLOP: 0.015,
    POSITION_DAMPING: 0.9,
    POSITION_WARMING: 0.8,
    POSITION_SCALE: 0.08,

    EPA_TOLERANCE: 0.005,
    EPA_MAX_ITERATIONS: 16,
  };

  private gravity = vec2.fromValues(0, -9.8);

  // spaces
  dynamicsSpace = new DynamicsSpace(this.gravity);
  collisionsSpace = new CollisionsSpace(this.gravity);

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
   * The time in ms that the last dynamics solving steps took.
   */
  dynamicsTime = 0;

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
  }

  update(delta: number) {
    this.physicsTime = performance.now();

    // set physics config
    Physics.G_CONF = this.CONFIG;

    // step bodies
    // order is very important

    // broadphase
    this.broadphaseTime = performance.now();
    this.collisionsSpace.broadphase();
    this.broadphaseTime = performance.now() - this.broadphaseTime;

    // narrow pahse
    this.narrowphaseTime = performance.now();
    this.collisionsSpace.obtainManifolds(delta);
    this.narrowphaseTime = performance.now() - this.narrowphaseTime;

    // integrate forces
    const forceTimer = performance.now();
    this.dynamicsSpace.solve("forces", delta);
    this.dynamicsTime = performance.now() - forceTimer;

    this.collisionSolveTime = performance.now();

    // pre steps
    this.collisionsSpace.solve("preStepImpulse", delta);

    // solve position impulse
    this.collisionsSpace.setSolverIterations("positionImpulse", this.CONFIG.POSITION_ITERATIONS);
    this.collisionsSpace.solve("positionImpulse", delta);

    // solve collisions
    this.collisionsSpace.setSolverIterations("impulse", this.CONFIG.VELOCITY_ITERATIONS);
    this.collisionsSpace.solve("impulse", delta);

    this.collisionSolveTime = performance.now() - this.collisionSolveTime;

    // integrate velocities
    const velocityTimer = performance.now();
    this.dynamicsSpace.solve("velocity", delta);
    this.dynamicsTime += performance.now() - velocityTimer;

    // apply position impulse
    const positionTimer = performance.now();
    this.collisionsSpace.solve("position", delta);
    this.collisionSolveTime += performance.now() - positionTimer;

    // clear forces
    this.dynamicsSpace.solve("reset", delta);

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
