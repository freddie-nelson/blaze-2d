import { vec2 } from "gl-matrix";
import GJK from "../gjk";
import Collider, { CollisionResult } from "./collider";
import Circle from "../../shapes/circle";
import EPA from "../epa";

/**
 * Represents a circle collider in 2D world space with a position and dimensions.
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
    const res: CollisionResult = {
      normal: undefined,
      depth: undefined,
      hasCollision: false,
    };

    const gjkRes = GJK(this, c);
    if (!gjkRes.collision) return res;

    res.hasCollision = true;
    const epaRes = EPA(gjkRes.simplex, this, c);

    res.normal = epaRes.normal;
    res.depth = epaRes.depth;

    return res;
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

  /**
   * Calculates the furthest point on the collider in a direction and it's neighbouring vertices on the collider.
   *
   * @param direction The direction in which to calculate the furthest point
   * @returns The furthest point on the collider in the given direction and its left and right neighbours
   */
  findFurthestNeighbours(direction: vec2) {
    const p = this.findFurthestPoint(direction);

    return {
      furthest: p,
      left: vec2.rotate(vec2.create(), p, this.getPosition(), -Math.PI / 45),
      right: vec2.rotate(vec2.create(), p, this.getPosition(), Math.PI / 45),
    };
  }
}
