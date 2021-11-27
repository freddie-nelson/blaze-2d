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

/**
 * Handles all physics updates for bodies in the system.
 *
 * As a general rule the physics system should be added after the {@link World} system.
 */
export default class Physics implements System {
  debug = false;
  private gravity = vec2.fromValues(0, -9.8);

  // spaces
  collisionsSpace = new CollisionsSpace();
  dynamicsSpace = new DynamicsSpace(this.gravity);

  /**
   *
   * @param gravity The gravitional force applied to objects in the system
   */
  constructor(gravity?: vec2) {
    if (gravity) this.setGravity(gravity);

    // add default solvers
    this.collisionsSpace.addSolver(solvePositionCollisions);
    this.collisionsSpace.addSolver(solveImpulse);

    this.dynamicsSpace.addSolver(solveGravity);
    this.dynamicsSpace.addSolver(solveVelocity);
    this.dynamicsSpace.addSolver(solvePositionDynamics);
    this.dynamicsSpace.addSolver(resetForce);
  }

  update(delta: number) {
    this.collisionsSpace.step(delta);
    this.dynamicsSpace.step(delta);
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
