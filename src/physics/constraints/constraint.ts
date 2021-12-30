import { vec2 } from "gl-matrix";
import { cross2D, cross2DWithScalar } from "../../utils/vectors";
import CollisionObject from "../collisionObject";
import Physics from "../physics";

export interface ConstraintOptions {
  a: CollisionObject;
  anchorA: vec2;

  b: CollisionObject;
  anchorB: vec2;
}

/**
 * Represents a distance constraint between two bodies or a body and a point.
 *
 * The constraint points are in local space of their body.
 *
 * If the constraint is between a body and a point then the given point is in world space.
 */
export default abstract class Constraint {
  a: CollisionObject;
  anchorA = vec2.create();
  rotA = 0;
  aImpulse = vec2.create();

  b: CollisionObject;
  anchorB = vec2.create();
  rotB = 0;
  bImpulse = vec2.create();

  point: vec2;

  /**
   * Creates a new {@link Constraint} between two bodies.
   *
   * @param a The first body
   * @param b The second body
   */
  constructor(a: CollisionObject, b: CollisionObject);

  /**
   * Creates a new {@link Constraint} with the given options.
   *
   * @param opts The constraint options
   */
  constructor(opts: ConstraintOptions);

  /**
   * Creates a new {@link Constraint} between a body and a point.
   *
   * @param a The body to constrain
   * @param point A point in world space
   */
  constructor(a: CollisionObject, point: vec2);

  constructor(a: CollisionObject | ConstraintOptions, b?: CollisionObject | vec2) {
    if (a instanceof CollisionObject && b instanceof CollisionObject) {
      // constraint between two bodies
      this.a = a;
      this.b = b;
    } else if (a instanceof CollisionObject) {
      // constraint between body and point
      this.a = a;
      this.point = <vec2>b;
    } else {
      // constraint from options
      this.a = a.a;
      this.b = a.b;
      this.anchorA = a.anchorA;
      this.anchorB = a.anchorB;
    }

    this.rotA = this.a.getRotation();
    if (this.b) this.rotB = this.b.getRotation();
  }

  /**
   * Prepares for constraint solving by applying accumulated impulses.
   */
  preSolve(dt: number) {
    if (!this.a.isStatic) {
      vec2.scaleAndAdd(this.a.velocity, this.a.velocity, this.aImpulse, this.a.getInverseMass());
    }

    if (this.b && !this.b.isStatic) {
      vec2.scaleAndAdd(this.b.velocity, this.b.velocity, this.bImpulse, this.b.getInverseMass());
    }
  }

  /**
   * Solves the constraint.
   *
   * @param dt The time since the last update
   */
  abstract solve(dt: number): void;

  /**
   * Warms the constraint impulses.
   */
  postSolve(dt: number) {
    vec2.scale(this.aImpulse, this.aImpulse, Physics.G_CONF.CONSTRAINT_WARMING);
    vec2.scale(this.bImpulse, this.bImpulse, Physics.G_CONF.CONSTRAINT_WARMING);
  }

  /**
   * Determines wether or not the constraint is between a body and a point.
   *
   * @returns Wether or not the constraint is between a body and a point.
   */
  isBodyToPoint() {
    return !this.b;
  }

  protected applyImpulses(impulse: number, direction: vec2) {
    const anchorA = this.anchorA;
    const anchorB = this.isBodyToPoint() ? this.point : this.anchorB;

    if (!this.a.isStatic) {
      this.a.applyImpulse(vec2.scale(vec2.create(), direction, -impulse), anchorA);
    }

    if (!this.isBodyToPoint() && !this.b.isStatic) {
      this.b.applyImpulse(vec2.scale(vec2.create(), direction, impulse), anchorB);
    }
  }

  /**
   * Updates the constraint's anchor points to match the rotations of their bodies.
   */
  protected updateAnchors() {
    const anchorA = this.anchorA;
    const anchorB = this.isBodyToPoint() ? this.point : this.anchorB;

    // rotate points with bodies
    if (!this.a.isStatic) {
      vec2.rotate(anchorA, anchorA, vec2.create(), this.a.getRotation() - this.rotA);
      this.rotA = this.a.getRotation();
    }

    if (!this.isBodyToPoint() && !this.b.isStatic) {
      vec2.rotate(anchorB, anchorB, vec2.create(), this.b.getRotation() - this.rotB);
      this.rotB = this.b.getRotation();
    }
  }

  /**
   * Calculate the relative velocity of the bodies in the constraint.
   *
   * @param pointA The anchor point on body a
   * @param pointB The anchor point on body b
   * @returns The relative velocity between body a and b or body a and the anchor point
   */
  protected calculateRelativeVelocity(pointA: vec2, pointB: vec2) {
    const angularCrossPointA = cross2DWithScalar(vec2.create(), pointA, this.a.angularVelocity);
    const angularCrossPointB = cross2DWithScalar(
      vec2.create(),
      pointB,
      this.isBodyToPoint() ? 0 : -this.b.angularVelocity,
    );

    const velA = vec2.add(vec2.create(), this.a.velocity, angularCrossPointA);
    const velB = vec2.add(vec2.create(), this.isBodyToPoint() ? vec2.create() : this.b.velocity, angularCrossPointB);
    return vec2.sub(vec2.create(), velB, velA);
  }

  protected kScalarBody(body: CollisionObject, r: vec2, n: vec2) {
    const rcn = cross2D(r, n);
    return body.getInverseMass() + body.getInverseInertia() * rcn * rcn;
  }

  protected kScalar(n: vec2) {
    const val =
      this.kScalarBody(this.a, this.anchorA, n) +
      (this.isBodyToPoint() ? 0 : this.kScalarBody(this.b, this.anchorB, n));

    return val;
  }
}
