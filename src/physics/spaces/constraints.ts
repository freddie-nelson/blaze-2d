import Constraint from "../constraints/constraint";
import { ConstraintSolver } from "../solvers/solver";
import Space from "./space";

/**
 * Contains {@link Constraint}s involving {@link CollisionObject}s.
 */
export default class ConstraintSpace extends Space<Constraint, ConstraintSolver> {
  /**
   * Executes a solver on every object in the space.
   *
   * @param id The id of the solver to execute
   */
  solve(id: string, delta: number) {
    const solver = this.solvers[id];

    for (let i = 0; i < solver.iterations; i++) {
      for (const obj of this.objects) {
        solver.cb(obj, delta);
      }
    }
  }
}
