import { vec2 } from "gl-matrix";
import { System } from "../system";
import CollisionObject from "./collisionObject";
import PhysicsObject from "./object";
import RigidBody from "./rigidbody";
import CollisionsSpace from "./spaces/collisions";
import DynamicsSpace from "./spaces/dynamics";

/**
 * Handles all physics updates for bodies in the system.
 *
 * As a general rule the physics system should be added after the {@link World} system.
 */
export default class Physics implements System {
  debug = false;
  gravity = vec2.fromValues(0, -9.8);

  // spaces
  collisionsSpace = new CollisionsSpace();
  dynamicsSpace = new DynamicsSpace();

  /**
   *
   * @param gravity The gravitional force applied to objects in the system
   */
  constructor(gravity?: vec2) {
    if (this.gravity) this.gravity = gravity;
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
   * Adds a {@link PhysicsObject} to the world's dynamics space.
   *
   * @param obj The object to add
   */
  addDynamicsObj(obj: PhysicsObject) {
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
}
