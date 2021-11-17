import { System } from "../system";
import RigidBody from "./rigidbody";

export default class Physics implements System {
  private bodies: RigidBody[] = [];

  gravity = 9.8;

  constructor(gravity: number = 9.8) {
    this.gravity = gravity;
  }

  update(delta: number) {}

  /**
   * Gets all bodies being tracked by the physics system.
   *
   * @returns All bodies in the physics system
   */
  getBodies() {
    return this.bodies;
  }

  /**
   *Removes all bodies from the physics system.
   */
  clearBodies() {
    this.bodies.length = 0;
  }

  /**
   * Adds a body to the physics system.
   *
   * @param body The body to add
   */
  addBody(body: RigidBody) {
    this.bodies.push(body);
  }

  /**
   * Removes a body from the physics system.
   *
   * @param body The body to remove
   * @returns Wether or not the body was removed
   */
  removeBody(body: RigidBody) {
    const i = this.bodies.findIndex((b) => b === body);
    if (i === -1) return false;

    this.bodies.splice(i, 1);
    return true;
  }
}
