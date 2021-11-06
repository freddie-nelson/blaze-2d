import { vec2 } from "gl-matrix";
import Rect from "../shapes/rect";

/**
 * Represents a box in 3D space with a position and dimensions.
 */
export default class Box extends Rect {
  /**
   * Creates a new {@link Box} instance with a position and dimensions.
   *
   * @param position The box's position in world space
   * @param width The width of the box
   * @param height The height of the box
   */
  constructor(position: vec2, width: number, height: number) {
    super(width, height, position);
  }

  /**
   * Calculates the bounding points of the {@link Box} instance.
   *
   * **NOTE: The box's vertices are recalculated everytime this function is called.**
   *
   * @returns The bounding points of the box
   */
  getPoints() {
    const vertices = this.getVerticesWorld(this.getPosition());

    const points: vec2[] = [];
    for (let i = 1; i < vertices.length - 1; i += 2) {
      points.push(vec2.fromValues(vertices[i - 1], vertices[i]));
    }

    return points;
  }
}
