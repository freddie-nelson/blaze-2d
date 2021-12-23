import { vec2 } from "gl-matrix";
import Logger from "../logger";
import LineCollider from "./collider/line";
import Physics from "./physics";

/**
 * Represents a ray that can be used for raycasting.
 *
 * A {@link Ray} is really a {@link LineCollider} with a weight of `Physics.G_CONF.POINT_SIZE`.
 */
export default class Ray extends LineCollider {
  private direction: vec2;
  private length: number;

  /**
   * Create a {@link Ray}.
   *
   * @param origin The ray's starting position
   * @param direction The direction of the ray
   * @param length The length of the ray
   */
  constructor(origin: vec2, direction: vec2, length: number) {
    if (length === Infinity) throw Logger.error("Ray", "Ray length cannot be Infinity.");

    super(origin, direction, length, Physics.G_CONF.POINT_SIZE);

    this.direction = direction;
    this.length = length;
  }

  /**
   * Gets the direction of the ray.
   *
   * @returns The direction of the ray
   */
  getDirection() {
    return this.direction;
  }

  /**
   * Gets the length of the ray.
   *
   * @returns The length of the ray
   */
  getLength() {
    return this.length;
  }
}
