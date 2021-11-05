import { vec3 } from "gl-matrix";
import Plane from "./plane";

/**
 * Represents a box in 3D space with a position and dimensions.
 */
export default class Box {
  position: vec3;
  width: number;
  height: number;
  depth: number;

  /**
   * Creates a new {@link Box} instance with a position and dimensions.
   *
   * @param position The box's position in world space
   * @param width The width of the box (x size)
   * @param height The height of the box (y size)
   * @param depth The depth of the box (z size)
   */
  constructor(position: vec3, width: number, height: number, depth: number) {
    this.position = position;
    this.width = width;
    this.height = height;
    this.depth = depth;
  }

  /**
   * Calculates the vertices of the {@link Box} instance.
   *
   * **NOTE: The box's vertices are recalculated everytime this function is called.**
   *
   * @returns The vertices of the box
   */
  getPoints() {
    const points = [];
    points.push(vec3.fromValues(this.position[0], this.position[1], this.position[2]));
    points.push(vec3.fromValues(this.position[0] + this.width, this.position[1], this.position[2]));
    points.push(vec3.fromValues(this.position[0], this.position[1], this.position[2] + this.width));
    points.push(
      vec3.fromValues(this.position[0] + this.width, this.position[1], this.position[2] + this.width)
    );
    points.push(vec3.fromValues(this.position[0], this.position[1] + this.height, this.position[2]));
    points.push(
      vec3.fromValues(this.position[0] + this.width, this.position[1] + this.height, this.position[2])
    );
    points.push(
      vec3.fromValues(this.position[0], this.position[1] + this.height, this.position[2] + this.width)
    );
    points.push(
      vec3.fromValues(
        this.position[0] + this.width,
        this.position[1] + this.height,
        this.position[2] + this.width
      )
    );

    return points;
  }
}
