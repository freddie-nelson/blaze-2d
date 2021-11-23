import RigidBody from "../rigidbody";
import Space from "./space";

/**
 * Represents an infinite space containing {@link RigidBody}s.
 *
 * Can be used to update objects dynamics.
 */
export default class DynamicsSpace extends Space<RigidBody> {
  /**
   * Creates a {@link DynamicsSpace} instance.
   */
  constructor() {
    super();
  }

  /**
   * Steps the dynamics of every object in the space forward by the given delta time.
   *
   * @param delta The time since the last frame
   */
  step(delta: number) {}
}
