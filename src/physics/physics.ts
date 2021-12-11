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
  r: 255,
  g: 0,
  b: 0,
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

/**
 * Handles physics updates for all bodies in the system.
 *
 * As a general rule the physics system should be added to Blaze's fixed update loop.
 *
 * Raycasting can only check against objects in the phsyics engine's collisions space.
 */
export default class Physics implements System {
  // config
  static CACHED_CONTACTS_TOLERANCE = 0.0005;
  static RESTITUTION_THRESHOLD = 1;

  static VELOCITY_ITERATIONS = 8;
  static ACUMMULATE_IMPULSE = true;
  static WARM_IMPULSE = true;

  static POSITION_ITERATIONS = 8;
  static POSITION_SLOP = 0.015;
  static POSITION_DAMPING = 1;
  static POSITION_WARMING = 0.9;

  debug = false;

  private gravity = vec2.fromValues(0, -9.8);

  // spaces
  dynamicsSpace = new DynamicsSpace(this.gravity);
  collisionsSpace = new CollisionsSpace(this.gravity);

  /**
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
    this.collisionsSpace.addSolver("positionImpulse", solvePositionImpulse, Physics.POSITION_ITERATIONS);

    this.collisionsSpace.addSolver("impulse", solveImpulse, Physics.VELOCITY_ITERATIONS);
    this.collisionsSpace.addSolver("position", applyPositionImpulse, 1);
  }

  update(delta: number) {
    // step bodies
    // order is very important
    this.collisionsSpace.broadphase();
    this.collisionsSpace.obtainManifolds(delta);

    // integrate forces
    this.dynamicsSpace.solve("forces", delta);

    // pre steps
    this.collisionsSpace.solve("preStepImpulse", delta);

    // solve position impulse
    this.collisionsSpace.setSolverIterations("positionImpulse", Physics.POSITION_ITERATIONS);
    this.collisionsSpace.solve("positionImpulse", delta);

    // solve collisions
    this.collisionsSpace.setSolverIterations("impulse", Physics.VELOCITY_ITERATIONS);
    this.collisionsSpace.solve("impulse", delta);

    // integrate velocities
    this.dynamicsSpace.solve("velocity", delta);

    // apply position impulse
    this.collisionsSpace.solve("position", delta);

    // clear forces
    this.dynamicsSpace.solve("reset", delta);

    // fire collision and trigger events
    this.collisionsSpace.fireEvents();

    if (this.debug) this.drawDebug();
  }

  drawDebug() {
    for (const obj of this.dynamicsSpace.objects) {
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
