import Constraint from "../../constraints/constraint";

export default function postSolveConstraint(constraint: Constraint) {
  constraint.postSolve();
}
