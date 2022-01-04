import { vec2 } from "gl-matrix";
import Logger from "../logger";
import RectCollider from "../physics/collider/rect";

/**
 * Represents a {@link Camera}'s viewable area and can be used to perform culling.
 */
export default class Viewport {
  private originalWidth: number;
  private originalHeight: number;

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

    this.originalWidth = width;
    this.originalHeight = height;

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
   * Checks wether the provided rectangle collider is contained within the viewport.
   *
   * TODO: Change this to use physics collision system so it works with more than just RectCollider
   *
   * @param rect The rect to check
   * @returns Wether or not the box is withing the viewport
   */
  containsRectCollider(rect: RectCollider, worldToPixelScale: vec2) {
    return true;
    // const points = box.getPoints();
    // const maxDistX = this.width / 2;
    // const maxDistY = this.height / 2;

    // for (const p of points) {
    //   const distX = Math.abs(p[0] - this.centre[0]) * worldToPixelScale[0];
    //   const distY = Math.abs(p[1] - this.centre[1]) * worldToPixelScale[1];

    //   if (distX < maxDistX && distY < maxDistY) return true;
    // }

    // return false;
  }

  /**
   * Sets the viewport's width.
   *
   * @throws When width is <= 0
   *
   * @param width The viewport's new width
   */
  setWidth(width: number): void {
    if (width <= 0) return void Logger.error("Viewport", "Width cannot be <= 0.");

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
  setHeight(height: number): void {
    if (height <= 0) return void Logger.error("Viewport", "Height cannot be <= 0.");

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
   * Gets the width the viewport was given when constructed.
   *
   * @returns The viewport's original width
   */
  getOriginalWidth() {
    return this.originalWidth;
  }

  /**
   * Gets the height the viewport was given when constructed.
   *
   * @returns The viewport's original height
   */
  getOriginalHeight() {
    return this.originalHeight;
  }
}
