import { vec2 } from "gl-matrix";
import RigidBody from "../../rigidbody";
import solveForces from "./forces";

export default function solveVelocity(obj: RigidBody, delta: number, gravity: vec2) {
  if (obj.getInverseMass() === 0 || !obj.isDynamic) return;

  // vec2.scale(obj.velocity, obj.velocity, 1 - obj.linearDamping);
  // obj.angularVelocity *= 1 - obj.angularDamping;

  if (obj.lockXAxis) obj.velocity[0] = 0;
  if (obj.lockYAxis) obj.velocity[1] = 0;
  if (obj.lockRotation) obj.angularVelocity = 0;

  obj.translate(vec2.scale(vec2.create(), obj.velocity, delta));
  obj.rotate(obj.angularVelocity * delta);

  solveForces(obj, delta, gravity);
}
