import { vec2 } from "gl-matrix";
import RigidBody from "../../rigidbody";

export default function solveForces(obj: RigidBody, delta: number, gravity: vec2) {
  if (obj.getInverseMass() === 0 || !obj.isDynamic) return;

  const force = vec2.scaleAndAdd(vec2.create(), gravity, obj.force, obj.getInverseMass());
  const torque = obj.torque * obj.getInverseInertia();

  vec2.scaleAndAdd(obj.velocity, obj.velocity, force, delta / 2);
  obj.angularVelocity += torque * (delta / 2);
}
