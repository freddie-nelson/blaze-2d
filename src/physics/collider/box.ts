import { vec2 } from "gl-matrix";
import GJK from "../../gjk/gjk";
import Rect from "../../shapes/rect";
import Collider, { CollisionResult } from "./collider";
import MeshCollider from "./meshCollider";

/**
 * Represents a box in 2D space with a position and dimensions.
 */
export default class Box extends Rect implements MeshCollider {
  isMeshCollider: true = true;

  /**
   * Creates a new {@link Box} instance with a position and dimensions.
   *
   * @param width The width of the box
   * @param height The height of the box
   * @param position The box's position in world space
   */
  constructor(width: number, height: number, position?: vec2) {
    super(width, height, position);
  }

  /**
   * Checks if this box is colliding with another collider.
   *
   * @param c {@link Collider} to test collisions against
   * @returns {@link CollisionResult} with the results of the test
   */
  testCollision(c: Collider): CollisionResult {
    if (c.isMeshCollider) {
      return this.testMeshCollision(<MeshCollider>c);
    }

    return {
      a: vec2.create(),
      b: vec2.create(),
      normal: vec2.create(),
      depth: 0,
      hasCollision: false,
    };
  }

  /**
   * Checks if this box is colliding with another mesh collider.
   *
   * @param c {@link MeshCollider} to test collisions against
   * @returns {@link CollisionResult} with the results of the test
   */
  testMeshCollision(c: MeshCollider): CollisionResult {
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
   * Performs GJK collision between this collider and another.
   *
   * @param c The collider to check for collisions against
   * @returns Wether or not there is a collision
   */
  GJK(c: MeshCollider): boolean {
    return GJK(this, c);
  }

  /**
   * Calculates a support point on the minkowski difference in a given direction.
   *
   * @param c The collider to test against
   * @param direction The direction to use when calculating furthest points
   * @returns The support point in the given direction for the [Minkowski difference](https://en.wikipedia.org/wiki/Minkowski_addition)
   */
  supportPoint(c: MeshCollider, direction: vec2) {
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
   * Calculates the bounding points of the {@link Box} instance.
   *
   * **NOTE: The box's vertices are recalculated everytime this function is called.**
   *
   * @returns The bounding points of the box
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
