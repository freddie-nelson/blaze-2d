import Constraint from "../../constraints/constraint";

export default function preSolveConstraint(constraint: Constraint, delta: number) {
  constraint.preSolve(delta);
}
