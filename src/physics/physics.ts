import { vec2 } from "gl-matrix";
import { System } from "../system";
import CollisionObject from "./collisionObject";
import RigidBody from "./rigidbody";
import solveImpulse from "./solvers/collision/impulse";
import solveVelocity from "./solvers/dynamics/velocity";
import CollisionsSpace from "./spaces/collisions";
import DynamicsSpace from "./spaces/dynamics";
import resetForce from "./solvers/dynamics/resetForce";
import positionalCorrection from "./solvers/collision/positionalCorrection";
import Space from "./spaces/space";
import { DynamicsSolver } from "./solvers/solver";
import solveForces from "./solvers/dynamics/forces";

/**
 * Handles all physics updates for bodies in the system.
 *
 * As a general rule the physics system should be added after the {@link World} system.
 *
 * Solvers added to the physics system are executed after all other spaces in the system have been updated.
 */
export default class Physics implements System {
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

    this.collisionsSpace.addSolver("impulse", solveImpulse, 20);
    this.collisionsSpace.addSolver("position", positionalCorrection, 1);
  }

  update(delta: number) {
    // step bodies
    // order is very important
    this.collisionsSpace.obtainManifolds(delta);

    // integrate forces
    this.dynamicsSpace.solve("forces", delta);

    // solve collisions
    this.collisionsSpace.solve("impulse");

    // integrate velocities
    this.dynamicsSpace.solve("velocity", delta);

    // correct positions
    this.collisionsSpace.solve("position");

    // clear forces
    this.dynamicsSpace.solve("reset", delta);

    // fire collision and trigger events
    this.collisionsSpace.fireEvents();
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
