import { vec2 } from "gl-matrix";
import GJK from "../gjk";
import Collider, { CollisionResult } from "./collider";
import EPA from "../epa";
import Triangle from "../../shapes/triangle";

/**
 * Represents a triangle collider in 2D world space with a position and dimensions.
 */
export default class TriangleCollider extends Triangle implements Collider {
  /**
   * Creates a new {@link TriangleCollider} instance with a position and dimensions.
   *
   * @param width The width of the box
   * @param height The height of the box
   * @param position The box's position in world space
   */
  constructor(width: number, height: number, position?: vec2) {
    super(width, height, position);
  }

  /**
   * Checks if this triangle collider is colliding with another collider.
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
    const points = this.getPoints();
    let max: vec2;
    let maxDist = -Infinity;

    for (const p of points) {
      const dist = vec2.dot(p, direction);
      if (dist > maxDist) {
        maxDist = dist;
        max = p;
      }
    }

    return max;
  }

  /**
   * Calculates the furthest point on the collider in a direction and it's neighbouring vertices on the collider.
   *
   * @param direction The direction in which to calculate the furthest point
   * @returns The furthest point on the collider in the given direction and its left and right neighbours
   */
  findFurthestNeighbours(direction: vec2) {
    const points = this.getPoints();
    let max = 0;
    let maxDist = -Infinity;

    for (let i = max; i < points.length; i++) {
      const p = points[i];
      const dist = vec2.dot(p, direction);

      if (dist > maxDist) {
        maxDist = dist;
        max = i;
      }
    }

    return {
      furthest: points[max],
      left: points[max + 1 >= points.length ? 0 : max + 1],
      right: points[max - 1 < 0 ? points.length - 1 : max - 1],
    };
  }

  /**
   * Calculates the bounding points of the {@link TriangleCollider} instance.
   *
   * **NOTE: The triangle's vertices are recalculated everytime this function is called.**
   *
   * @returns The bounding points of the triangle
   */
  getPoints() {
    const vertices = this.getVerticesWorld(vec2.create());

    const points: vec2[] = [];
    for (let i = 1; i < vertices.length; i += 2) {
      points.push(vec2.fromValues(vertices[i - 1], vertices[i]));
    }

    return points;
  }
}
