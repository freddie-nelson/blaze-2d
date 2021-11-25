import { vec2 } from "gl-matrix";
import Shape from "../../shapes/shape";
import PhysicsObject from "../object";
import MeshCollider from "./meshCollider";

/**
 * Describes a collision between two {@link Collider}s (A and B).
 *
 * @field `a` The furthest point on collider **A** inside collider **B**
 * @field `b` The furthest point on collider **B** inside collider **A**
 * @field `normal` vector `b - a` normalised
 * @field `depth` The length of the vector `b - a`
 * @field `hasCollision` Wether or not the A and B are colliding
 */
export interface CollisionResult {
  a: vec2;
  b: vec2;
  normal: vec2;
  depth: number;
  hasCollision: boolean;
}

export default abstract class Collider extends Shape {
  /**
   * Checks if this collider is colliding with another collider.
   *
   * @param c {@link Collider} to test collisions against
   * @returns {@link CollisionResult} with the results of the test
   */
  abstract testCollision(c: Collider): CollisionResult;

  /**
   * Calculates a support point on the minkowski difference in a given direction.
   *
   * @param c The collider to test against
   * @param direction The direction to use when calculating furthest points
   * @returns The support point in the given direction for the [Minkowski difference](https://en.wikipedia.org/wiki/Minkowski_addition)
   */
  abstract supportPoint(c: Collider, direction: vec2): vec2;

  /**
   * Calculates the furthest point on the collider in a direction.
   *
   * @param direction The direction in which to calculate the furthest point
   * @returns The furthest point on the collider in the given direction
   */
  abstract findFurthestPoint(direction: vec2): vec2;
}
