import Constraint from "../../constraints/constraint";

export default function preSolveConstraint(constraint: Constraint) {
  constraint.preSolve();
}
