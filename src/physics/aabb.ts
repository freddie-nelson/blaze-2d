import { vec2 } from "gl-matrix";
import Shape from "../shapes/shape";
import Collider from "./collider/collider";

/**
 * Represents an axis aligned bounding box in 2D world space.
 *
 * A minimum (bottom left) and maximum (top right) vertex is used to represent the {@link AABB}.
 */
export default class AABB {
  min: vec2;
  max: vec2;

  /**
   * Creates a {@link AABB} that bounds the vertices of the given collider.
   *
   * @param c The collider to create AABB from
   */
  constructor(c: Collider);

  /**
   * Creates a {@link AABB} with the given minimum and and maximum vertices.
   *
   * @param min The minimum vertex (bottom left)
   * @param max The maximum vertex (top right)
   */
  constructor(min: vec2, max: vec2);

  constructor(min: Collider | vec2, max?: vec2) {
    if (min instanceof Collider) {
      this.setMinMaxFromCollider(min);
    } else {
      this.min = min;
      this.max = max;
    }
  }

  setMinMaxFromCollider(c: Collider) {
    const vertices = c.getVertices();

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    // find min and max points
    for (let i = 0; i < vertices.length; i++) {
      const p = vertices[i];

      // x coord
      if (i % 2 === 0) {
        if (p < minX) minX = p;
        if (p > maxX) maxX = p;
      } else {
        // y coord
        if (p < minY) minY = p;
        if (p > maxY) maxY = p;
      }
    }

    this.min = vec2.fromValues(minX, minY);
    this.max = vec2.fromValues(maxX, maxY);
  }
}
