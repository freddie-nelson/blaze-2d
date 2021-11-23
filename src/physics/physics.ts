import { vec2 } from "gl-matrix";
import { System } from "../system";
import CollisionsSpace from "./spaces/collisions";
import DynamicsSpace from "./spaces/dynamics";

/**
 * Handles all physics updates for bodies in the system.
 *
 * As a general rule the physics system should be added before the {@link World} system.
 */
export default class Physics implements System {
  debug = false;
  gravity = vec2.fromValues(0, -9.8);

  // spaces
  collisionsSpace = new CollisionsSpace();
  dynamicsSpace = new DynamicsSpace();

  /**
   *
   * @param gravity The gravitional force applied to objects in the system
   */
  constructor(gravity?: vec2) {
    if (this.gravity) this.gravity = gravity;
  }

  update(delta: number) {
    this.collisionsSpace.step(delta);
    this.dynamicsSpace.step(delta);
  }
}
