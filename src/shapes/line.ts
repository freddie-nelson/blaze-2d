import { vec2 } from "gl-matrix";
import { midpoint } from "../utils/vectors";
import Rect from "./rect";

/**
 * Represents a line in 2D space.
 *
 * Can have textures and varying line thickness as a {@link Line} is really just a wrapper around {@link Rect}.
 *
 * Using `setWidth`, `setHeight`, `setRotation` or `setPosition` on a {@link Line} may lead to unexpected behaviour.
 */
export default class Line extends Rect {
  private start: vec2;
  private end: vec2;
  private weight: number;

  /**
   * Create a {@link Line} with a start and end point.
   *
   * All values are in world space, including weight.
   *
   * @param start The start point of the line
   * @param end The end point of the line
   * @param weight The weight of the line's stroke (thickness)
   */
  constructor(start: vec2, end: vec2, weight: number);

  constructor(start: vec2, direction: vec2, length: number, weight: number);

  constructor(start: vec2, angle: number, length: number, weight: number);

  constructor(v1: vec2, v2: vec2 | number, n1: number, n2?: number) {
    super(0, 0);

    // determine which constructor to use
    if (typeof v2 === "number") {
      this.createFromAngle(v1, v2, n1, n2);
    } else if (n2 === undefined) {
      this.createFromStartEnd(v1, v2, n1);
    } else {
      this.createFromDirection(v1, v2, n1, n2);
    }
  }

  private createFromStartEnd(start: vec2, end: vec2, weight: number) {
    this.start = vec2.clone(start);
    this.end = vec2.clone(end);
    this.weight = weight;

    const mid = midpoint(vec2.create(), start, end);
    const rot = Math.atan2(end[1] - start[1], end[0] - start[0]);
    const dist = vec2.dist(start, end);

    this.setPosition(mid);
    this.setRotation(rot);
    this.setHeight(weight);
    this.setWidth(dist);
  }

  private createFromDirection(start: vec2, direction: vec2, length: number, weight: number) {
    const end = vec2.scaleAndAdd(vec2.create(), start, direction, length);

    this.createFromStartEnd(start, end, weight);
  }

  private createFromAngle(start: vec2, angle: number, length: number, weight: number) {
    const dir = vec2.fromValues(0, 1);
    vec2.rotate(dir, dir, vec2.create(), angle);

    this.createFromDirection(start, dir, length, weight);
  }

  /**
   * Sets the weight of the line (thickness).
   *
   * @param weight The new weight of the line
   */
  setWeight(weight: number) {
    if (weight < 0) throw new Error("Line: Weight cannot be < 0.");

    this.weight = weight;
    this.setHeight(weight);
  }

  /**
   * Gets the weight of the line (thickness).
   *
   * @returns The stroke weight of the line
   */
  getWeight() {
    return this.weight;
  }

  /**
   * Sets the starting point of the line.
   *
   * @param start The new starting point of the line
   */
  setStart(start: vec2) {
    this.createFromStartEnd(start, this.end, this.weight);
  }

  /**
   * Gets the point at which the line begins.
   *
   * @returns The start point of the line
   */
  getStart() {
    return this.start;
  }

  /**
   * Sets the end point of the line.
   *
   * @param end The new end point of the line
   */
  setEnd(end: vec2) {
    this.createFromStartEnd(this.start, end, this.weight);
  }

  /**
   * Gets the point at which the line ends.
   *
   * @returns The end point of the line
   */
  getEnd() {
    return this.end;
  }
}
