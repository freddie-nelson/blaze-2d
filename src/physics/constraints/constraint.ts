import { vec2 } from "gl-matrix";
import { cross2DWithScalar } from "../../utils/vectors";
import CollisionObject from "../collisionObject";
import Physics from "../physics";

export interface ConstraintOptions {
  a: CollisionObject;
  pointA: vec2;

  b: CollisionObject;
  pointB: vec2;
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
  pointA = vec2.create();
  rotA = 0;
  aImpulse = vec2.create();

  b: CollisionObject;
  pointB = vec2.create();
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
      this.pointA = a.pointA;
      this.pointB = a.pointB;
    }

    this.rotA = this.a.getRotation();
    if (this.b) this.rotB = this.b.getRotation();
  }

  /**
   * Prepares for constraint solving by applying accumulated impulses.
   */
  preSolve() {
    if (!this.a.isStatic) {
      this.a.applyImpulse(this.aImpulse, this.pointA);
    }

    if (this.b && !this.b.isStatic) {
      this.b.applyImpulse(this.bImpulse, this.pointB);
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
  postSolve() {
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
}
