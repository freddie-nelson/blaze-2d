import { vec2 } from "gl-matrix";
import Shape from "../../shapes/shape";
import Collider from "../collider/collider";
import CollisionObject from "../collisionObject";
import Ray from "../ray";

/**
 * Represents an axis aligned bounding box in 2D world space.
 *
 * A minimum (bottom left) and maximum (top right) vertex is used to represent the {@link AABB}.
 */
export default class AABB {
  min: vec2;
  max: vec2;

  margin: number;

  /**
   * A {@link CollisionObject} that is bound by the {@link AABB}.
   */
  obj: CollisionObject;

  /**
   * Creates a {@link AABB} with the given minimum and and maximum vertices.
   *
   * @param min The minimum vertex (bottom left)
   * @param max The maximum vertex (top right)
   */
  constructor(min: vec2, max: vec2);

  /**
   * Creates an {@link AABB} which contains both `a` and `b`, the created {@link AABB} is the union of `a` and `b` plus the `margin`.
   *
   * @param a An {@link AABB}
   * @param b An {@link AABB}
   * @param margin A margin to add to the min and max of the created AABB
   */
  constructor(a: AABB, b: AABB, margin: number);

  /**
   * Creates a {@link AABB} that bounds the vertices of the given object's collider.
   *
   * @param obj {@link CollisionObject} to create AABB from
   * @param margin A margin to add to the new min and max points
   */
  constructor(obj: CollisionObject, margin: number);

  constructor(min: CollisionObject | vec2 | AABB, max?: vec2 | number | AABB, margin?: number) {
    if (min instanceof CollisionObject) {
      this.setMinMaxFromCollisionObj(min, <number>max);
    } else if (margin !== undefined) {
      this.union(<AABB>min, <AABB>max, margin);
    } else {
      this.min = <vec2>min;
      this.max = <vec2>max;
    }
  }

  /**
   * Sets the AABB's min and max so that the AABB contains the object's collider.
   *
   * @param obj The {@link CollisionObject} to bound
   * @param margin A margin to add to the new min and max points
   */
  setMinMaxFromCollisionObj(obj: CollisionObject, margin: number) {
    this.margin = margin;
    this.obj = obj;

    const c = obj.collider;
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

    this.min = vec2.fromValues(minX - margin, minY - margin);
    this.max = vec2.fromValues(maxX + margin, maxY + margin);
  }

  /**
   * Sets the AABB's min and max to the union of `a` and `b`.
   *
   * @param a An {@link AABB}
   * @param b An {@link AABB}
   * @param margin A margin to add to the new min and max points
   */
  union(a: AABB, b: AABB, margin = 0) {
    const minX = a.min[0] < b.min[0] ? a.min[0] : b.min[0];
    const maxX = a.max[0] > b.max[0] ? a.max[0] : b.max[0];
    const minY = a.min[1] < b.min[1] ? a.min[1] : b.min[1];
    const maxY = a.max[1] > b.max[1] ? a.max[1] : b.max[1];

    this.margin = margin;
    this.min = vec2.fromValues(minX - margin, minY - margin);
    this.max = vec2.fromValues(maxX + margin, maxY + margin);
  }

  /**
   * Computes the area of the {@link AABB}.
   *
   * @returns The area of the {@link AABB}
   */
  area() {
    const width = Math.abs(this.max[0] - this.min[0]);
    const height = Math.abs(this.max[1] - this.min[1]);

    return width * height;
  }

  /**
   * Determines wether or not this {@link AABB} intersects with the given {@link AABB}.
   *
   * @param b The {@link AABB} to check for intersection against
   */
  intersects(b: AABB): boolean;

  /**
   * Determines wether or not the given point intersects with this {@link AABB}.
   *
   * @param point The point to check for intersection
   */
  intersects(point: vec2): boolean;

  /**
   * Determines wether or not the given ray intersects with this {@link AABB}.
   *
   * @param ray The ray to check for intersection
   */
  intersects(ray: Ray): boolean;

  intersects(b: AABB | vec2 | Ray) {
    if (b instanceof AABB) {
      return this.max[0] > b.min[0] && this.min[0] < b.max[0] && this.max[1] > b.min[1] && this.min[1] < b.max[1];
    } else if (b instanceof Ray) {
      const v0 = b.getStart();
      const v1 = b.getEnd();

      let fLow = 0;
      let fHigh = 1;

      let res = this.clipLine(0, v0, v1, fLow, fHigh);
      if (!res) return false;
      else {
        fLow = res.fLow;
        fHigh = res.fHigh;
      }

      res = this.clipLine(1, v0, v1, fLow, fHigh);
      if (!res) return false;
      else {
        fLow = res.fLow;
        fHigh = res.fHigh;
      }

      return true;
    } else {
      return this.max[0] >= b[0] && this.min[0] <= b[0] && this.max[1] >= b[1] && this.min[1] <= b[1];
    }
  }

  /**
   * Determines wether or not the given {@link AABB} is contained within this {@link AABB}.
   *
   * @param b The {@link AABB} to check
   */
  contains(b: AABB) {
    return this.min[0] <= b.min[0] && this.max[0] >= b.max[0] && this.min[1] <= b.min[1] && this.max[1] >= b.max[1];
  }

  /**
   * Clips a line based on the {@link AABB}'s min and max to determine if the line intersects with the AABB.
   *
   * @param dim The dimension to clip in (0 = x, 1 = y)
   * @param v0 The line's start point
   * @param v1 The line's end point
   * @param fLow The current fLow
   * @param fHigh The current fHigh
   * @returns false when no intersection possible, otherwise new fLow and fHigh
   */
  private clipLine(dim: number, v0: vec2, v1: vec2, fLow: number, fHigh: number) {
    let fDimLow = (this.min[dim] - v0[dim]) / (v1[dim] - v0[dim]);
    let fDimHigh = (this.max[dim] - v0[dim]) / (v1[dim] - v0[dim]);

    if (fDimHigh < fDimLow) {
      let temp = fDimLow;
      fDimLow = fDimHigh;
      fDimHigh = temp;
    }

    if (fDimHigh < fLow) return false;

    if (fDimLow > fHigh) return false;

    const newFLow = Math.max(fDimLow, fLow);
    const newFHigh = Math.min(fDimHigh, fHigh);

    if (newFLow > newFHigh) return false;

    return {
      fLow: newFLow,
      fHigh: newFHigh,
    };
  }
}
