import { vec2 } from "gl-matrix";
import { cross2DWithScalar } from "../../utils/vectors";
import CollisionObject from "../collisionObject";
import Constraint, { ConstraintOptions } from "./constraint";

interface DistanceConstraintOptions extends ConstraintOptions {
  length: number;
  stiffness: number;
  angularStiffness: number;
}

export default class DistanceConstraint extends Constraint {
  length: number;
  stiffness: number;
  angularStiffness: number;

  /**
   * Creates a new {@link DistanceConstraint} between two bodies.
   *
   * @param a The first body
   * @param b The second body
   * @param length The distance to maintain between the two bodies
   * @param stiffness The stiffness of the constraint
   * @param angularStiffness The angular stiffness of the constraint
   */
  constructor(a: CollisionObject, b: CollisionObject, length: number, stiffness: number, angularStiffness?: number);

  /**
   * Creates a new {@link Constraint} with the given options.
   *
   * @param opts The constraint options
   */
  constructor(opts: DistanceConstraintOptions);

  /**
   * Creates a new {@link Constraint} between a body and a point.
   *
   * @param a The body to constrain
   * @param point A point in world space
   * @param length The distance to maintain between the body and point.
   * @param stiffness The stiffness of the constraint
   * @param angularStiffness The angular stiffness of the constraint
   */
  constructor(a: CollisionObject, point: vec2, length: number, stiffness: number, angularStiffness?: number);

  constructor(
    a: CollisionObject | DistanceConstraintOptions,
    b?: CollisionObject | vec2,
    length?: number,
    stiffness?: number,
    angularStiffness = 0,
  ) {
    if (a instanceof CollisionObject && b instanceof CollisionObject) {
      // constraint between two bodies
      super(a, b);

      this.length = length;
      this.stiffness = stiffness;
      this.angularStiffness = angularStiffness;
    } else if (a instanceof CollisionObject) {
      // constraint between body and point
      super(a, <vec2>b);

      this.length = length;
      this.stiffness = stiffness;
      this.angularStiffness = angularStiffness;
    } else {
      // constraint from options
      super(a);

      this.length = a.length;
      this.stiffness = a.stiffness;
      this.angularStiffness = a.angularStiffness;
    }
  }

  /**
   * Solves the distance constraint with Gauss-Siedel method.
   *
   * @see [MatterJS Constraint](https://github.com/liabru/matter-js/blob/master/src/constraint/Constraint.js)
   * @see [Dyn4j Distance Constraint](https://dyn4j.org/2010/09/distance-constraint/)
   * @see [Constraints and Solvers](https://research.ncl.ac.uk/game/mastersdegree/gametechnologies/physicstutorials/8constraintsandsolvers/Physics%20-%20Constraints%20and%20Solvers.pdf)
   *
   * @param dt The time since the last update
   */
  solve(dt: number) {
    const pointA = this.pointA;
    const pointB = this.isBodyToPoint() ? this.point : this.pointB;

    // rotate points with bodies
    if (!this.a.isStatic) {
      vec2.rotate(pointA, pointA, vec2.create(), this.a.getRotation() - this.rotA);
      this.rotA = this.a.getRotation();
    }

    if (!this.isBodyToPoint() && !this.b.isStatic) {
      vec2.rotate(pointB, pointB, vec2.create(), this.b.getRotation() - this.rotB);
      this.rotB = this.b.getRotation();
    }

    // console.log(pointA, pointB);

    const pointAWorld = vec2.add(vec2.create(), this.a.getPosition(), pointA);
    const pointBWorld = this.isBodyToPoint() ? pointB : vec2.add(vec2.create(), this.b.getPosition(), pointB);

    const axis = vec2.sub(vec2.create(), pointBWorld, pointAWorld);
    const currLen = vec2.len(axis);
    const unitAxis = vec2.normalize(vec2.create(), axis);

    // calculate relative velocity in the axis, we want to remove this.
    const relVel = this.calculateRelativeVelocity(pointA, pointB);
    const relVelAxis = vec2.dot(unitAxis, relVel);

    const relDist = currLen - this.length;

    // calculate impulse to solve
    const remove = relVelAxis + relDist / dt;
    const impulse = remove / (this.a.getInverseMass() + (this.isBodyToPoint() ? 0 : this.b.getInverseMass()));

    // generate impulse vector
    const I = vec2.scale(vec2.create(), unitAxis, impulse * this.stiffness);

    // apply impulse
    if (!this.a.isStatic) {
      this.a.applyImpulse(I, pointA);
      vec2.add(this.aImpulse, this.aImpulse, I);
    }
    if (!this.isBodyToPoint() && !this.b.isStatic) {
      const bImpulse = vec2.negate(vec2.create(), I);

      this.b.applyImpulse(bImpulse, pointB);
      vec2.add(this.bImpulse, this.bImpulse, bImpulse);
    }
  }

  /**
   * Calculate the relative velocity of the constraint.
   *
   * @param pointA The anchor point on body a
   * @param pointB The anchor point on body b
   * @returns The relative velocity between body a and b or body a and the anchor point
   */
  private calculateRelativeVelocity(pointA: vec2, pointB: vec2) {
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
}
