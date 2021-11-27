import { vec2 } from "gl-matrix";
import RigidBody from "../../rigidbody";

export default function solvePosition(obj: RigidBody, delta: number) {
  obj.translate(vec2.scale(vec2.create(), obj.velocity, delta));
  obj.rotate(obj.angularVelocity * delta);
}
