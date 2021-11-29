import { vec2 } from "gl-matrix";
import RigidBody from "../../rigidbody";
import solveForces from "./forces";

export default function solveVelocity(obj: RigidBody, delta: number, gravity: vec2) {
  if (obj.getInverseMass() === 0) return;

  // vec2.scale(obj.velocity, obj.velocity, 1 - obj.linearDamping);
  // obj.angularVelocity *= 1 - obj.angularDamping;

  obj.translate(vec2.scale(vec2.create(), obj.velocity, delta));
  obj.rotate(obj.angularVelocity * delta);

  solveForces(obj, delta, gravity);
}
