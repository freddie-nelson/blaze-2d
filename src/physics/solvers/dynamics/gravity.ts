import { vec2 } from "gl-matrix";
import RigidBody from "../../rigidbody";

export default function solveGravity(obj: RigidBody, delta: number, gravity: vec2) {
  if (!gravity) return;

  obj.applyForce(vec2.scale(vec2.create(), gravity, obj.getMass()));
  // console.log(obj.force);
}
