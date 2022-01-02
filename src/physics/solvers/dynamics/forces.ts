import { vec2 } from "gl-matrix";
import RigidBody from "../../rigidbody";

const force = vec2.create();

export default function solveForces(obj: RigidBody, delta: number, gravity: vec2) {
  if (obj.getInverseMass() === 0 || !obj.isDynamic) return;

  vec2.scaleAndAdd(force, obj.force, gravity, obj.getMass());
  vec2.scale(force, force, obj.getInverseMass());

  let torque = obj.torque * obj.getInverseInertia();

  if (obj.lockXAxis) force[0] = 0;
  if (obj.lockYAxis) force[1] = 0;
  if (obj.lockRotation) torque = 0;

  vec2.scaleAndAdd(obj.velocity, obj.velocity, force, delta / 2);
  obj.angularVelocity += torque * (delta / 2);
}
