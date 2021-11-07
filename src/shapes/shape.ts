import { vec2 } from "gl-matrix";
import Object2D from "../object2d";

/**
 * Represents an arbitrary shape in 2D world space.
 *
 * A shape is self contained and includes functions to render itself.
 */
export default abstract class Shape extends Object2D {
  protected width: number;
  protected height: number;

  constructor() {
    super();
  }

  /**
   * Renders the shape using the given webgl context.
   *
   * @param gl The webgl context to render to
   * @param position The x and y position to render the rectangle at
   * @param zIndex The z position of the rendered shape
   * @param scale The world cell size to clip space scale value
   */
  abstract render(gl: WebGL2RenderingContext, position: vec2, zIndex: number, scale: vec2): void;

  /**
   * Sets the shapes's width.
   *
   * @throws When the the provided width is <= 0
   *
   * @param width The shapes's new width
   */
  abstract setWidth(width: number): void;

  /**
   * Gets the shapes's width in world space units.
   *
   * @returns The shapes's width in world space
   */
  abstract getWidth(): number;

  /**
   * Sets the shapes's height.
   *
   * @throws When the the provided height is <= 0
   *
   * @param height The shapes's new height
   */
  abstract setHeight(height: number): void;

  /**
   * Gets the shapes's height in world space units.
   *
   * @returns The shapes's height in world space
   */
  abstract getHeight(): number;
}
