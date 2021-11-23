import { vec2 } from "gl-matrix";
import Box from "../physics/collider/box";

/**
 * Represents a {@link Camera}'s viewable area and can be used to perform culling.
 */
export default class Viewport {
  private width: number;
  private height: number;
  private centre: vec2;

  /**
   * Creates a {@link Viewport} instance.
   *
   * @param centre The centre of the viewport in world space
   * @param width The width of the viewport in world space
   * @param height The height of the viewport in world space
   */
  constructor(centre: vec2, width: number, height: number) {
    this.width = width;
    this.height = height;
    this.update(centre);
  }

  /**
   * Calculates the viewports bounds around a given centre.
   *
   * @param centre The centre of the viewport
   */
  update(centre: vec2) {
    this.centre = centre;
  }

  /**
   * Checks wether the provided box is contained within the viewport.
   *
   * TODO: Change this to use physics collision system so it works with more than just Box
   *
   * @param box The box to check
   * @returns Wether or not the box is withing the viewport
   */
  containsBox(box: Box, worldToPixelScale: vec2) {
    const points = box.getPoints();
    const maxDistX = this.width / 2;
    const maxDistY = this.height / 2;

    for (const p of points) {
      const distX = Math.abs(p[0] - this.centre[0]) * worldToPixelScale[0];
      const distY = Math.abs(p[1] - this.centre[1]) * worldToPixelScale[1];

      if (distX < maxDistX && distY < maxDistY) return true;
    }

    return false;
  }

  /**
   * Sets the viewport's width.
   *
   * @throws When width is <= 0
   *
   * @param width The viewport's new width
   */
  setWidth(width: number) {
    if (width <= 0) throw new Error("Viewport: Width cannot be <= 0.");

    this.width = width;
  }

  /**
   * Gets the viewport's width.
   *
   * @returns The viewport's width
   */
  getWidth() {
    return this.width;
  }

  /**
   * Sets the viewport's height.
   *
   * @throws When height is <= 0
   *
   * @param height The viewport's new height
   */
  setHeight(height: number) {
    if (height <= 0) throw new Error("Viewport: Height cannot be <= 0.");

    this.height = height;
  }

  /**
   * Gets the viewport's height.
   *
   * @returns The viewport's height
   */
  getHeight() {
    return this.height;
  }

  /**
   * Gets the viewport's boundaries in world space.
   *
   * @returns An object containing the viewport's right, left, top and bottom boundary
   */
  getBoundaries() {
    return {
      right: this.centre[0] + this.width / 2,
      left: this.centre[0] - this.width / 2,
      top: this.centre[1] + this.height / 2,
      bottom: this.centre[1] - this.height / 2,
    };
  }
}
