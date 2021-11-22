import { vec2 } from "gl-matrix";
import Rect from "../../shapes/rect";
import Collider, { CollisionResult } from "./collider";

/**
 * Represents a box in 2D space with a position and dimensions.
 */
export default class Box extends Rect implements Collider {
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
   * Checks if the Box is colliding with the provided {@link Bounds} object.
   *
   * @param b Another bounds object to check collisions against
   * @returns An {@link CollisionResult} if there is a collision, false otherwise
   */
  collidingWith(b: Collider): false | CollisionResult {
    return false;
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
