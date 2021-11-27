import { vec2 } from "gl-matrix";
import RigidBody from "../rigidbody";
import { DynamicsSolver } from "../solvers/solver";
import Space from "./space";

/**
 * Represents an infinite space containing {@link RigidBody}s.
 *
 * Can be used to update objects dynamics.
 */
export default class DynamicsSpace extends Space<RigidBody, DynamicsSolver> {
  gravity: vec2;

  /**
   * Creates a {@link DynamicsSpace} instance.
   */
  constructor(gravity: vec2) {
    super();

    this.gravity = vec2.clone(gravity);
  }

  /**
   * Steps the dynamics of every object in the space forward by the given delta time.
   *
   * @param delta The time since the last frame
   */
  step(delta: number) {
    for (const obj of this.objects) {
      for (const s of this.solvers) {
        s(obj, delta, this.gravity);
      }
    }
  }
}
