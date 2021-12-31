import { mat2, vec2 } from "gl-matrix";
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

  b: CollisionObject;
  anchorB = vec2.create();
  rotB = 0;

  point: vec2;

  errorBias = Math.pow(0.9, 60);
  maxBias = Infinity;

  maxForce = Infinity;

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
   * Prepares for constraint solving.
   *
   * @param dt The time since the last update
   */
  abstract preSolve(dt: number): void;

  /**
   * Solves the constraint.
   *
   * @param dt The time since the last update
   */
  abstract solve(dt: number): void;

  /**
   * Performs post solve operations.
   *
   * @param dt The time since the last update
   */
  abstract postSolve(dt: number): void;

  /**
   * Determines wether or not the constraint is between a body and a point.
   *
   * @returns Wether or not the constraint is between a body and a point.
   */
  isBodyToPoint() {
    return !this.b;
  }

  protected applyImpulses(impulse: number, direction: vec2): void;

  protected applyImpulses(impulse: vec2): void;

  protected applyImpulses(impulse: number | vec2, direction?: vec2) {
    const anchorA = this.anchorA;
    const anchorB = this.isBodyToPoint() ? this.point : this.anchorB;

    if (typeof impulse === "number") {
      if (!this.a.isStatic) {
        this.a.applyImpulse(vec2.scale(vec2.create(), direction, -impulse), anchorA);
      }

      if (!this.isBodyToPoint() && !this.b.isStatic) {
        this.b.applyImpulse(vec2.scale(vec2.create(), direction, impulse), anchorB);
      }
    } else {
      if (!this.a.isStatic) {
        this.a.applyImpulse(vec2.negate(vec2.create(), impulse), anchorA);
      }

      if (!this.isBodyToPoint() && !this.b.isStatic) {
        this.b.applyImpulse(impulse, anchorB);
      }
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

    const velA = vec2.sub(vec2.create(), this.a.velocity, angularCrossPointA);
    const velB = vec2.add(vec2.create(), this.isBodyToPoint() ? vec2.create() : this.b.velocity, angularCrossPointB);
    return vec2.sub(vec2.create(), velB, velA);
  }

  /**
   * Calculates the velocity bias coefficient.
   *
   * @param dt The time since the last update
   */
  protected biasCoef(dt: number) {
    return 1 - Math.pow(this.errorBias, dt);
  }

  /**
   * Computes the k scalar value for the given body.
   *
   * @param body The body to calculate for
   * @param r The anchor point on the body
   * @param n The constraint's delta normal
   * @returns The k scalar value for the given body
   */
  protected kScalarBody(body: CollisionObject, r: vec2, n: vec2) {
    const rcn = cross2D(r, n);
    return body.getInverseMass() + body.getInverseInertia() * rcn * rcn;
  }

  /**
   * Computes the k scalar value for the constraint.
   *
   * @param n The constraint's delta normal
   * @returns The k scalar value for the constraint
   */
  protected kScalar(n: vec2) {
    const val =
      this.kScalarBody(this.a, this.anchorA, n) +
      (this.isBodyToPoint() ? 0 : this.kScalarBody(this.b, this.anchorB, n));

    return val;
  }

  /**
   * Computes the k tensor matrix for the constraint.
   *
   * @see [Chipmunk2D kTensor](https://github.com/slembcke/Chipmunk2D/blob/master/include/chipmunk/chipmunk_private.h#L229)
   *
   * @returns k tensor matrix
   */
  protected kTensor() {
    const r1 = this.anchorA;
    const r2 = this.isBodyToPoint() ? this.point : this.anchorB;
    const invMass = this.a.getInverseMass() + (this.isBodyToPoint() ? 0 : this.b.getInverseMass());

    // start with Identity * invMass
    const k = mat2.identity(mat2.create());
    mat2.multiplyScalar(k, k, invMass);

    // add the influence from r1
    const aInvInertia = this.a.getInverseInertia();
    const r1xsq = r1[0] * r1[0] * aInvInertia;
    const r1ysq = r1[1] * r1[1] * aInvInertia;
    const r1nxy = -r1[0] * r1[1] * aInvInertia;

    k[0] += r1ysq;
    k[2] += r1nxy;
    k[1] += r1nxy;
    k[3] += r1xsq;

    // add the influence from r2
    const bInvInertia = this.isBodyToPoint() ? 0 : this.b.getInverseInertia();
    const r2xsq = r2[0] * r2[0] * bInvInertia;
    const r2ysq = r2[1] * r2[1] * bInvInertia;
    const r2nxy = -r2[0] * r2[1] * bInvInertia;

    k[0] += r2ysq;
    k[2] += r2nxy;
    k[1] += r2nxy;
    k[3] += r2xsq;

    // invert
    mat2.invert(k, k);

    return k;
  }
}
