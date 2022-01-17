import { vec2 } from "gl-matrix";
import RigidBody from "../../rigidbody";

const force = vec2.create();
const airFriction = vec2.create();

export default function solveForces(obj: RigidBody, delta: number, gravity: vec2) {
  if (obj.getInverseMass() === 0 || !obj.isDynamic) return;

  const halfDelta = delta / 2;

  // gravity
  vec2.scaleAndAdd(force, obj.force, gravity, obj.getMass());

  // scale force for mass of object
  vec2.scale(force, force, obj.getInverseMass());

  // air resistance
  if (obj.airFriction !== 0) {
    const vel = vec2.len(obj.velocity);
    vec2.scale(airFriction, obj.velocity, -obj.airFriction * vel * halfDelta);
    vec2.add(force, force, airFriction);
  }

  // compute torque
  let torque = obj.torque * obj.getInverseInertia();

  if (obj.lockXAxis) force[0] = 0;
  if (obj.lockYAxis) force[1] = 0;
  if (obj.lockRotation) torque = 0;

  vec2.scaleAndAdd(obj.velocity, obj.velocity, force, halfDelta);

  obj.angularVelocity += torque * halfDelta;
  obj.angularVelocity *= 1 - obj.angularDamping;
}
