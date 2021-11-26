import PhysicsObject from "../object";
import RigidBody from "../rigidbody";
import { DynamicsSolver } from "../solvers/solver";
import Space from "./space";

/**
 * Represents an infinite space containing {@link PhysicsObject}s.
 *
 * Can be used to update objects dynamics.
 */
export default class DynamicsSpace extends Space<PhysicsObject, DynamicsSolver> {
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
