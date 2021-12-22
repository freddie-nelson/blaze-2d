import { vec2 } from "gl-matrix";
import Collider from "./collider/collider";
import CollisionObject from "./collisionObject";

/**
 * Represents a rigidbody physics object in 2D world space.
 *
 * Rigidbodies can collide with any Z level of terrain based on flags set.
 * They can also collide with other rigidbodies.
 */
export default class RigidBody extends CollisionObject {
  /**
   * Wether the body has dynamics or not.
   */
  isDynamic = true;

  /**
   * Creates a {@link RigidBody} with a collider, mass and restitution (bounciness).
   *
   * @param collider The collider of the object
   * @param mass The mass of the object
   * @param restitution The restitution of the object (bounciness)
   */
  constructor(collider: Collider, mass?: number, restitution?: number) {
    super(collider, mass, restitution);
  }

  /**
   * Sets all the events that can be used in `listeners`.
   */
  protected setupEvents() {
    super.setupEvents();
  }
}
