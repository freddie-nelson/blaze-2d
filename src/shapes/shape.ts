import { vec2 } from "gl-matrix";
import Object2D from "../object2d";
import Texture from "../texture/texture";
import Color from "../utils/color";

const defaultTexture = new Texture(new Color("gray"));

/**
 * Represents an arbitrary shape in 2D world space.
 *
 * A shape is self contained and includes functions to render itself.
 */
export default abstract class Shape extends Object2D {
  protected width: number;
  protected height: number;
  texture = defaultTexture;

  constructor() {
    super();
  }

  /**
   * Renders the shape using the {@link Renderer}.
   *
   * @param position The x and y position to render the rectangle at
   * @param zIndex The z position of the rendered shape
   * @param scale The world cell size to clip space scale value
   */
  abstract render(position: vec2, rotation: number, zIndex: number, scale: vec2): void;

  /**
   * Calculates the shape's UV coords to be used for texture rendering.
   *
   * @returns the shape's UV coords
   */
  abstract getUVCoords(): Float32Array;

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
