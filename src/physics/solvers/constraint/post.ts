import Constraint from "../../constraints/constraint";

export default function postSolveConstraint(constraint: Constraint, delta: number) {
  constraint.postSolve(delta);
}
