import { vec2 } from "gl-matrix";
import Object2D from "../object2d";

// vertices for a rect
const baseVertices = {
  tl: vec2.fromValues(0, 1),
  tr: vec2.fromValues(1, 1),
  bl: vec2.fromValues(0, 0),
  br: vec2.fromValues(1, 0),
};

/**
 * Represents a Cuboid in 3D space with a width, height and depth.
 */
export default class Rect extends Object2D {
  private width: number;
  private height: number;

  /**
   * Creates a new {@link Rect} instance with dimensions, position and rotation.
   *
   * @param width The width of the cuboid (x size)
   * @param height The height of the cuboid (y size)
   * @param position The rects position in world space, default is [0, 0]
   * @param rotation The rects rotation, default is 0.
   */
  constructor(width: number, height: number, position?: vec2, rotation?: number) {
    super();
    if (position) this.setPosition(position);
    if (rotation) this.setRotation(rotation);

    this.width = width;
    this.height = height;
  }

  /**
   * Calculates the rect's vertices.
   *
   * @returns The rects vertices
   */
  getVertices() {
    const noRot = [
      this.vertexAdd(baseVertices.tl, [0, this.height]),
      this.vertexAdd(baseVertices.tr, [this.width, this.height]),
      this.vertexAdd(baseVertices.br, [this.width, 0]),
      baseVertices.bl,
    ];

    const rotatedVec = vec2.create();
    const rotated = noRot.map((v) => {
      vec2.rotate(rotatedVec, v, noRot[noRot.length - 1], this.getRotation());
      return [...rotatedVec];
    });

    return [...rotated[0], ...rotated[1], ...rotated[2], ...rotated[3]];
  }

  /**
   * Calculates the rect's vertices relative to the provided origin in world space.
   *
   * @param origin The origin to calculate the vertices relative to, should be a world position.
   * @returns The rect's vertices relative to the provided origin in world space.
   */
  getVerticesWorld(origin: vec2) {
    const vertices = this.getVertices();

    return {
      vertices: vertices.map((v, i) => {
        if (i % 2 === 0) return v + origin[0];
        else if (i % 2 === 1) return v + origin[1];
      }),
    };
  }

  /**
   * Adds the components of v1 and v2 and returns the resulting vector.
   *
   * @param v1 The first vector
   * @param v2 The second vector
   * @returns A new vector with the added components
   */
  private vertexAdd(v1: vec2, v2: vec2): vec2 {
    return [v1[0] + v2[0], v1[1] + v2[1]];
  }
}
