import { vec2 } from "gl-matrix";
import GJK from "../gjk";
import Collider, { CollisionResult } from "./collider";
import Circle from "../../shapes/circle";

/**
 * Represents a box in 2D space with a position and dimensions.
 */
export default class CircleCollider extends Circle implements Collider {
  /**
   * Creates a new {@link CircleCollider} instance with a centre and radius.
   *
   * @param radius The radius of the circle
   * @param centre The circle's position in world space
   */
  constructor(radius: number, centre?: vec2) {
    super(radius, centre);
  }

  /**
   * Checks if this box is colliding with another collider.
   *
   * @param c {@link Collider} to test collisions against
   * @returns {@link CollisionResult} with the results of the test
   */
  testCollision(c: Collider): CollisionResult {
    const res = {
      a: vec2.create(),
      b: vec2.create(),
      normal: vec2.create(),
      depth: 0,
      hasCollision: false,
    };

    res.hasCollision = this.GJK(c);
    if (!res.hasCollision) return res;

    return res;
  }

  /**
   * Performs GJK collision detection between this collider and another.
   *
   * @param c The collider to check for collisions against
   * @returns Wether or not there is a collision
   */
  GJK(c: Collider): boolean {
    return GJK(this, c);
  }

  /**
   * Calculates a support point on the minkowski difference in a given direction.
   *
   * @param c The collider to test against
   * @param direction The direction to use when calculating furthest points
   * @returns The support point in the given direction for the [Minkowski difference](https://en.wikipedia.org/wiki/Minkowski_addition)
   */
  supportPoint(c: Collider, direction: vec2) {
    const p = vec2.create();
    const reverse = vec2.create();
    vec2.scale(reverse, direction, -1);

    vec2.sub(p, this.findFurthestPoint(direction), c.findFurthestPoint(reverse));
    return p;
  }

  /**
   * Calculates the furthest point on the collider in a direction.
   *
   * @param direction The direction in which to calculate the furthest point
   * @returns The furthest point on the collider in the given direction
   */
  findFurthestPoint(direction: vec2) {
    // get point on circumference of unit circle at origin in the given direction
    const p = vec2.clone(direction);
    vec2.normalize(p, p);

    // scale unit circle to size of this circle and move to circle's position
    vec2.scale(p, p, this.getRadius());
    vec2.add(p, p, this.getPosition());

    return p;
  }
}
