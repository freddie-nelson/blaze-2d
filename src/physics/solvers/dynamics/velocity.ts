import { vec2 } from "gl-matrix";
import RigidBody from "../../rigidbody";

export default function solveVelocity(obj: RigidBody, delta: number) {
  vec2.scaleAndAdd(obj.velocity, obj.velocity, obj.force, delta * obj.getInverseMass());
  obj.angularVelocity += obj.torque * delta * obj.getInertia();
}
