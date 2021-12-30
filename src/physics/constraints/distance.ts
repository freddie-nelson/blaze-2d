import { vec2 } from "gl-matrix";
import ConsolePane from "../../editor/panes/consolePane";
import { cross2DWithScalar } from "../../utils/vectors";
import CollisionObject from "../collisionObject";
import Constraint, { ConstraintOptions } from "./constraint";

interface DistanceConstraintOptions extends ConstraintOptions {
  length: number;
  // stiffness: number;
  // damping: number;
}

/**
 * Represents a distance/pin joint between two {@link CollisionObject}s or
 * a {@link CollisionObject} and a point.
 *
 * This constraint will maintain a set distance between the two anchor points.
 */
export default class DistanceConstraint extends Constraint {
  length: number;

  nDelta: vec2;
  nMass: number;
  jnAcc: number;

  /**
   * Creates a new {@link DistanceConstraint} between two bodies.
   *
   * @param a The first body
   * @param b The second body
   * @param length The distance to maintain between the bodies
   */
  constructor(a: CollisionObject, b: CollisionObject, length: number);

  /**
   * Creates a new {@link Constraint} with the given options.
   *
   * @param opts The constraint options
   */
  constructor(opts: DistanceConstraintOptions);

  /**
   * Creates a new {@link DistanceConstraint} between a body and a point.
   *
   * @param a The body to constrain
   * @param point A point in world space
   * @param length The distance to maintain between the body and point.
   */
  constructor(a: CollisionObject, point: vec2, length: number);

  constructor(a: CollisionObject | DistanceConstraintOptions, b?: CollisionObject | vec2, length?: number) {
    if (a instanceof CollisionObject && b instanceof CollisionObject) {
      // constraint between two bodies
      super(a, b);

      this.length = length;
    } else if (a instanceof CollisionObject) {
      // constraint between body and point
      super(a, <vec2>b);

      this.length = length;
    } else {
      // constraint from options
      super(a);

      this.length = a.length;
    }

    this.jnAcc = 0;
  }

  preSolve(dt: number) {
    this.updateAnchors();

    const anchorA = this.anchorA;
    const anchorB = this.isBodyToPoint() ? this.point : this.anchorB;

    const anchorAWorld = vec2.add(vec2.create(), this.a.getPosition(), anchorA);
    const anchorBWorld = this.isBodyToPoint() ? anchorB : vec2.add(vec2.create(), this.b.getPosition(), anchorB);

    const delta = vec2.sub(vec2.create(), anchorBWorld, anchorAWorld);
    const length = vec2.len(delta);

    this.nDelta = vec2.scale(vec2.create(), delta, 1 / (length ? length : Infinity));

    // calculate mass normal
    const k = this.kScalar(this.nDelta);
    this.nMass = 1 / k;

    // calculate bias velocity
    this.bias = Math.max(-this.maxBias, Math.min(-this.biasCoef(dt) * ((length - this.length) / dt), this.maxBias));
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
    const vrn = vec2.dot(relVel, this.nDelta);

    const jnMax = this.maxForce * dt;

    // compute normal impulse
    let jn = (this.bias - vrn) * this.nMass;
    const jnOld = this.jnAcc;

    this.jnAcc = Math.max(-jnMax, Math.min(jnOld + jn, jnMax));
    jn = this.jnAcc - jnOld;

    this.applyImpulses(jn, this.nDelta);
  }

  /**
   * Applies the cached impulse.
   */
  postSolve() {
    // this.applyImpulses(this.jnAcc * 0.1, this.nDelta);
  }
}
