import { vec2 } from "gl-matrix";
import GJK from "../../gjk/gjk";
import Collider from "./collider";

export default abstract class MeshCollider extends Collider {
  abstract isMeshCollider: true;

  /**
   * Calculates a support point on the minkowski difference in a given direction.
   *
   * @param c The collider to test against
   * @param direction The direction to use when calculating furthest points
   * @returns The support point in the given direction for the [Minkowski difference](https://en.wikipedia.org/wiki/Minkowski_addition)
   */
  abstract supportPoint(c: MeshCollider, direction: vec2): vec2;

  /**
   * Calculates the furthest point on the collider in a direction.
   *
   * @param direction The direction in which to calculate the furthest point
   * @returns The furthest point on the collider in the given direction
   */
  abstract findFurthestPoint(direction: vec2): vec2;

  /**
   * Performs GJK collision between this collider and another.
   *
   * @param c The collider to check for collisions against
   * @returns Wether or not there is a collision
   */
  abstract GJK(c: MeshCollider): boolean;
}
