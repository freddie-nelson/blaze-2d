import { mat2, vec2 } from "gl-matrix";
import ConsolePane from "../../editor/panes/consolePane";
import { cross2DWithScalar } from "../../utils/vectors";
import CollisionObject from "../collisionObject";
import Constraint, { ConstraintOptions } from "./constraint";

interface PivotConstraintOptions extends ConstraintOptions {
  point: vec2;
}

/**
 * Represents a pivot joint between two {@link CollisionObject}s or
 * a {@link CollisionObject} and a point.
 *
 * This constraint will keep the object's joined together by their anchor points at the given point.
 */
export default class PivotConstraint extends Constraint {
  bias: vec2;
  jAcc: vec2;
  k: mat2;

  /**
   * Creates a new {@link PivotConstraint} between two bodies.
   *
   * @param a The first body
   * @param b The second body
   * @param point The point to join the bodies at in world space
   */
  constructor(a: CollisionObject, b: CollisionObject, point: vec2);

  /**
   * Creates a new {@link PivotConstraint} with the given options.
   *
   * @param opts The constraint options
   */
  constructor(opts: PivotConstraintOptions);

  /**
   * Creates a new {@link PivotConstraint} between a body and a point.
   *
   * @param a The body to constrain
   * @param point A point in world space
   */
  constructor(a: CollisionObject, point: vec2);

  constructor(a: CollisionObject | PivotConstraintOptions, b?: CollisionObject | vec2, point?: vec2) {
    if (a instanceof CollisionObject && b instanceof CollisionObject) {
      // constraint between two bodies
      super(a, b);

      this.point = point;
    } else if (a instanceof CollisionObject) {
      // constraint between body and point
      super(a, <vec2>b);
    } else {
      // constraint from options
      super(a);

      this.point = a.point;
    }

    this.jAcc = vec2.create();
  }

  preSolve(dt: number) {
    this.updateAnchors();

    const anchorA = this.anchorA;
    const anchorB = this.isBodyToPoint() ? this.point : this.anchorB;

    const anchorAWorld = vec2.add(vec2.create(), this.a.getPosition(), anchorA);
    const anchorBWorld = this.isBodyToPoint() ? anchorB : vec2.add(vec2.create(), this.b.getPosition(), anchorB);

    const delta = vec2.sub(vec2.create(), anchorBWorld, anchorAWorld);
    this.k = this.kTensor();

    // calculate bias velocity
    const bias = vec2.scale(vec2.create(), delta, -this.biasCoef(dt) / dt);
    vec2.min(bias, bias, vec2.fromValues(this.maxBias, this.maxBias));
    vec2.max(bias, bias, vec2.fromValues(-this.maxBias, -this.maxBias));

    this.bias = bias;
  }

  /**
   * Computes and applies the impulse to keep the bodies at the joint's length.
   *
   * @see [Chipmunk2D Pin Joint](https://github.com/slembcke/Chipmunk2D/blob/master/src/cpPinJoint.c)
   * @see [MatterJS Constraint](https://github.com/liabru/matter-js/blob/master/src/constraint/Constraint.js)
   * @see [Dyn4j Distance Constraint](https://dyn4j.org/2010/09/distance-constraint/)
   * @see [Constraints and Solvers](https://research.ncl.ac.uk/game/mastersdegree/gametechnologies/physicstutorials/8constraintsandsolvers/Physics%20-%20Constraints%20and%20Solvers.pdf)
   *
   * @param dt The time since the last update
   */
  solve(dt: number) {
    const anchorA = this.anchorA;
    const anchorB = this.isBodyToPoint() ? this.point : this.anchorB;

    // compute relative velocity
    const relVel = this.calculateRelativeVelocity(anchorA, anchorB);

    // compute normal impulse
    const j = vec2.transformMat2(vec2.create(), vec2.sub(vec2.create(), this.bias, relVel), this.k);
    const jOld = vec2.clone(this.jAcc);

    const maxForce = this.maxForce * dt;
    vec2.add(this.jAcc, this.jAcc, j);
    vec2.min(this.jAcc, this.jAcc, vec2.fromValues(maxForce, maxForce));
    vec2.max(this.jAcc, this.jAcc, vec2.fromValues(-maxForce, -maxForce));

    vec2.sub(j, this.jAcc, jOld);

    this.applyImpulses(j);
  }

  /**
   * Applies the cached impulse.
   */
  postSolve() {
    // this.applyImpulses(this.jnAcc * 0.0001, this.nDelta);
  }
}
