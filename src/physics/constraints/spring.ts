import { vec2 } from "gl-matrix";
import { cross2DWithScalar } from "../../utils/vectors";
import CollisionObject from "../collisionObject";
import Constraint, { ConstraintOptions } from "./constraint";

interface SpringConstraintOptions extends ConstraintOptions {
  length: number;
  stiffness: number;
  damping: number;
}

/**
 * Represents a damped spring joint between two {@link CollisionObject}s or
 * a {@link CollisionObject} and a point.
 */
export default class SpringConstraint extends Constraint {
  length: number;
  stiffness: number;
  angularStiffness: number;
  damping: number;

  nDelta: vec2;
  nMass: number;
  targetVrn: number;
  vCoef: number;
  jAcc: number;

  /**
   * Creates a new {@link SpringConstraint} between two bodies.
   *
   * @param a The first body
   * @param b The second body
   * @param length The resting length of the spring
   * @param stiffness The stiffness of the spring
   * @param damping The damping of the spring
   */
  constructor(a: CollisionObject, b: CollisionObject, length: number, stiffness: number, damping?: number);

  /**
   * Creates a new {@link SpringConstraint} with the given options.
   *
   * @param opts The constraint options
   */
  constructor(opts: SpringConstraintOptions);

  /**
   * Creates a new {@link SpringConstraint} between a body and a point.
   *
   * @param a The body to constrain
   * @param point A point in world space
   * @param length The resting length of the spring.
   * @param stiffness The stiffness of the spring
   * @param damping The damping of the spring
   */
  constructor(a: CollisionObject, point: vec2, length: number, stiffness: number, damping?: number);

  constructor(
    a: CollisionObject | SpringConstraintOptions,
    b?: CollisionObject | vec2,
    length?: number,
    stiffness?: number,
    damping = 0,
  ) {
    if (a instanceof CollisionObject && b instanceof CollisionObject) {
      // constraint between two bodies
      super(a, b);

      this.length = length;
      this.stiffness = stiffness;
      this.damping = damping;
    } else if (a instanceof CollisionObject) {
      // constraint between body and point
      super(a, <vec2>b);

      this.length = length;
      this.stiffness = stiffness;
      this.damping = damping;
    } else {
      // constraint from options
      super(a);

      this.length = a.length;
      this.stiffness = a.stiffness;
      this.damping = a.damping;
    }
  }

  /**
   * Updates the constraints anchors and prepares for solving.
   *
   * @param dt The time since the last update
   */
  preSolve(dt: number) {
    this.updateAnchors();

    const anchorA = this.anchorA;
    const anchorB = this.isBodyToPoint() ? this.point : this.anchorB;

    const anchorAWorld = vec2.add(vec2.create(), this.a.getPosition(), anchorA);
    const anchorBWorld = this.isBodyToPoint() ? anchorB : vec2.add(vec2.create(), this.b.getPosition(), anchorB);

    const delta = vec2.sub(vec2.create(), anchorBWorld, anchorAWorld);
    const length = vec2.len(delta);
    this.nDelta = vec2.normalize(vec2.create(), delta);

    const k = this.kScalar(this.nDelta);
    this.nMass = 1 / k;

    this.targetVrn = 0;
    this.vCoef = 1 - Math.exp(-this.damping * dt * k);

    // apply spring force
    const fSpring = this.calcForce(length);
    const jSpring = (this.jAcc = fSpring * dt);

    this.applyImpulses(jSpring, this.nDelta);
  }

  /**
   * Applies the spring forces to the attached bodies.
   *
   * @see [Chipmunk2D Damped Spring](https://github.com/slembcke/Chipmunk2D/blob/master/src/cpDampedSpring.c)
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

    // compute velocity loss from drag
    const vDamp = (this.targetVrn - vrn) * this.vCoef;
    this.targetVrn = vrn + vDamp;

    const jDamp = vDamp * this.nMass;
    this.jAcc += jDamp;

    this.applyImpulses(jDamp, this.nDelta);
  }

  postSolve() {}

  private calcForce(length: number) {
    return (this.length - length) * this.stiffness;
  }
}
