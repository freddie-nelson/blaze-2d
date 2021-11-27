import RigidBody from "../../rigidbody";

export default function resetForce(obj: RigidBody) {
  obj.force[0] = 0;
  obj.force[1] = 0;
  obj.torque = 0;
}
