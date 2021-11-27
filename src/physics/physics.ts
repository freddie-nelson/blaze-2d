import { vec2 } from "gl-matrix";
import { System } from "../system";
import CollisionObject from "./collisionObject";
import RigidBody from "./rigidbody";
import solveImpulse from "./solvers/collision/impulse";
import solvePositionCollisions from "./solvers/collision/position";
import solveGravity from "./solvers/dynamics/gravity";
import solveVelocity from "./solvers/dynamics/velocity";
import solvePositionDynamics from "./solvers/dynamics/position";
import CollisionsSpace from "./spaces/collisions";
import DynamicsSpace from "./spaces/dynamics";
import resetForce from "./solvers/dynamics/resetForce";
import positionalCorrection from "./solvers/collision/positionalCorrection";
import Space from "./spaces/space";
import { DynamicsSolver } from "./solvers/solver";

/**
 * Handles all physics updates for bodies in the system.
 *
 * As a general rule the physics system should be added after the {@link World} system.
 *
 * Solvers added to the physics system are executed after all other spaces in the system have been updated.
 */
export default class Physics extends Space<undefined, DynamicsSolver> implements System {
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
    super();

    if (gravity) this.setGravity(gravity);

    // add default solvers
    this.dynamicsSpace.addSolver(solveGravity, 1);
    this.dynamicsSpace.addSolver(solveVelocity, 1);
    this.dynamicsSpace.addSolver(solvePositionDynamics, 1);

    this.collisionsSpace.addSolver(solveImpulse, 2);
    this.collisionsSpace.addSolver(positionalCorrection, 1);

    this.addSolver(resetForce, 1);
  }

  update(delta: number) {
    // step spaces
    // dynamics space should be updated before collisions
    this.dynamicsSpace.step(delta);
    this.collisionsSpace.step(delta);

    this.step(delta);
  }

  step(delta: number) {
    for (const obj of this.dynamicsSpace.objects) {
      for (const s of this.solvers) {
        s.cb(obj, delta, this.gravity);
      }
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
