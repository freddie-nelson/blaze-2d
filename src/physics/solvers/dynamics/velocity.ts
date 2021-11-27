import { vec2 } from "gl-matrix";
import RigidBody from "../../rigidbody";

const ITERATIONS = 1;

export default function solveVelocity(obj: RigidBody, delta: number) {
  for (let i = 0; i < ITERATIONS; i++) {
    vec2.scaleAndAdd(obj.velocity, obj.velocity, obj.force, delta * obj.getInverseMass());
    obj.angularVelocity += obj.torque * delta * obj.getInertia();
  }
}
