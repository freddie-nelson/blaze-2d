import Object2D from "../object2d";
import validateZIndex from "../utils/validators";
import Bounds from "./bounds";

/**
 * Represents a rigidbody physics object in 2D world space.
 *
 * Rigidbodies can collide with any Z level terrain based on flags set.
 * They can also collide with other rigidbodies.
 */
export default class RigidBody extends Object2D {
  private terrainCollisionFlags: { [index: number]: boolean } = {};
  bounds: Bounds;
  gravity = 9.8;

  /**
   * Creates a {@link RigidBody}
   */
  constructor(bounds: Bounds, gravity = 9.8) {
    super();

    this.bounds = bounds;
    this.gravity = gravity;
  }

  /**
   * Sets wether or not the rigidbody should collide with the given terrain level.
   *
   * @throws When {@link validateZIndex} returns a string.
   *
   * @param zIndex The Z level of terrain
   * @param collides Wether or not to collide with the given terrain level
   */
  collidesWithTerrain(zIndex: number, collides: boolean) {
    const valid = validateZIndex(zIndex);
    if (valid !== true) throw new Error(valid);

    this.terrainCollisionFlags[zIndex] = collides;
  }
}
