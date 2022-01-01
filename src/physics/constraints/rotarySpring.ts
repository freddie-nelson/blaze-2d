import { vec2 } from "gl-matrix";
import { cross2DWithScalar } from "../../utils/vectors";
import CollisionObject from "../collisionObject";
import Constraint, { ConstraintOptions } from "./constraint";

interface RotarySpringConstraintOptions extends ConstraintOptions {
  angle: number;
  stiffness: number;
  damping: number;
}

/**
 * Represents a damped rotary spring joint between two {@link CollisionObject}s or
 * a {@link CollisionObject} and itself.
 *
 * This joint will aim to maintain the provided angle between the 2 bodies.
 *
 * When the joint only consists of one body it will aim to keep that bodies rotation at the specified angle.
 *
 * Setting anchor points for this constraint will have no affect.
 */
export default class RotarySpringConstraint extends Constraint {
  angle: number;
  stiffness: number;
  damping: number;

  inertiaSum: number;
  targetWrn: number;
  wCoef: number;
  jAcc: number;

  /**
   * Creates a new {@link RotarySpringConstraint} between two bodies.
   *
   * @param a The first body
   * @param b The second body
   * @param angle The resting angle of the spring
   * @param stiffness The stiffness of the spring
   * @param damping The damping of the spring
   */
  constructor(a: CollisionObject, b: CollisionObject, angle: number, stiffness: number, damping?: number);

  /**
   * Creates a new {@link SpringConstraint} with the given options.
   *
   * @param opts The constraint options
   */
  constructor(opts: RotarySpringConstraintOptions);

  /**
   * Creates a new {@link RotarySpringConstraint} between a body and a point.
   *
   * @param a The body to constrain
   * @param angle The resting angle of the spring.
   * @param stiffness The stiffness of the spring
   * @param damping The damping of the spring
   */
  constructor(a: CollisionObject, angle: number, stiffness: number, damping?: number);

  constructor(
    a: CollisionObject | RotarySpringConstraintOptions,
    b?: CollisionObject | number,
    angle?: number,
    stiffness?: number,
    damping = 0,
  ) {
    if (a instanceof CollisionObject && b instanceof CollisionObject) {
      // constraint between two bodies
      super(a, b);

      this.angle = angle;
      this.stiffness = stiffness;
      this.damping = damping;
    } else if (a instanceof CollisionObject) {
      // constraint with single body
      super(a, vec2.create());

      this.angle = <number>b;
      this.stiffness = angle;
      this.damping = stiffness;
    } else {
      // constraint from options
      super(a);

      this.angle = a.angle;
      this.stiffness = a.stiffness;
      this.damping = a.damping;
    }
  }

  /**
   * Prepares the spring for solving.
   *
   * @param dt The time since the last update
   */
  preSolve(dt: number) {
    const invInertia = this.a.getInverseInertia() + (this.isBodyToPoint() ? 0 : this.b.getInverseInertia());
    this.inertiaSum = 1 / invInertia;

    this.wCoef = 1 - Math.exp(this.damping * dt * invInertia);
    this.targetWrn = 0;

    // apply spring torque
    const jSpring = this.calcTorque() * dt;
    this.jAcc = jSpring;

    this.a.angularVelocity -= jSpring * this.a.getInverseInertia();
    if (!this.isBodyToPoint()) this.b.angularVelocity += jSpring * this.b.getInverseInertia();
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
    // compute relative velocity
    const wrn = this.a.angularVelocity - (this.isBodyToPoint() ? 0 : this.b.angularVelocity);

    // compute velocity loss from drag
    const wDamp = (this.targetWrn - wrn) * this.wCoef;
    this.targetWrn = wrn + wDamp;

    const jDamp = wDamp * this.inertiaSum;
    this.jAcc += jDamp;

    this.a.angularVelocity -= jDamp * this.a.getInverseInertia();
    if (!this.isBodyToPoint()) this.b.angularVelocity += jDamp * this.b.getInverseInertia();
  }

  postSolve() {}

  /**
   * Calculates the torque required to correct the spring.
   *
   * @returns The torque required to correct the spring
   */
  private calcTorque() {
    const relativeAngle = this.a.getRotation() - (this.isBodyToPoint() ? 0 : this.b.getRotation());

    return (relativeAngle - this.angle) * this.stiffness;
  }
}
