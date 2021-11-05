import { vec2 } from "gl-matrix";

/**
 * Represents a {@link Camera}'s viewable area and can be used to perform culling.
 */
export default class Viewport {
  private width: number;
  private height: number;

  private right: number;
  private left: number;
  private top: number;
  private bottom: number;

  /**
   * Creates a {@link Viewport} instance.
   *
   * @param center The center of the viewport in world space
   * @param width The width of the viewport in world space
   * @param height The height of the viewport in world space
   */
  constructor(center: vec2, width: number, height: number) {
    this.width = width;
    this.height = height;
    this.update(center);
  }

  /**
   * Calculates the viewports bounds around a given center.
   *
   * @param center The center of the viewport
   */
  update(center: vec2) {
    this.right = center[0] + this.width / 2;
    this.left = center[0] - this.width / 2;
    this.top = center[1] + this.height / 2;
    this.bottom = center[1] - this.height / 2;
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
      right: this.right,
      left: this.left,
      top: this.top,
      bottom: this.bottom,
    };
  }
}
