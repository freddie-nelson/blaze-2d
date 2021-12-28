import Constraint from "../../constraints/constraint";

export default function solveConstraint(constraint: Constraint, delta: number) {
  constraint.solve(delta);
}
