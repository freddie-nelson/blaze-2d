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
   * Executes a solver on every object in the space.
   *
   * @param id The id of the solver to execute
   */
  solve(id: string, delta: number) {
    const solver = this.solvers[id];

    for (let i = 0; i < solver.iterations; i++) {
      for (const obj of this.objects) {
        solver.cb(obj, delta, obj.takesGravity ? this.gravity : obj.gravity);
      }
    }
  }
}
