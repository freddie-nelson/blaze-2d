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
   * @param position The x and y position to render the shape at
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
   * Sets the shape's width.
   *
   * @throws When the the provided width is <= 0
   *
   * @param width The shape's new width
   */
  abstract setWidth(width: number): void;

  /**
   * Gets the shape's width in world space units.
   *
   * @returns The shape's width in world space
   */
  abstract getWidth(): number;

  /**
   * Sets the shape's height.
   *
   * @throws When the the provided height is <= 0
   *
   * @param height The shape's new height
   */
  abstract setHeight(height: number): void;

  /**
   * Gets the shape's height in world space units.
   *
   * @returns The shape's height in world space
   */
  abstract getHeight(): number;

  /**
   * Calculates the center point of the shape, with an origin point added to it.
   *
   * @param origin The origin in world space to get the center relative to.
   */
  abstract getCenter(origin?: vec2): vec2;

  /**
   * Calculates the shape's vertices in local space.
   *
   * @returns The shapes vertices
   */
  abstract getVertices(): number[];

  /**
   * Calculates the shape's vertices relative to the provided origin in world space.
   *
   * @param origin The origin to calculate the vertices relative to, should be a world position
   * @param rotation An optional world space rotation to apply to the vertices
   * @returns The shape's vertices relative to the provided origin in world space
   */
  abstract getVerticesWorld(origin: vec2, rotation?: number): number[];

  /**
   * Calculates the shape's vertices relative to the provided origin in world space.
   *
   * @param origin The origin to calculate the vertices relative to, should be a world position
   * @param scale The vector to scale the world space vertices by to obtain clip space values
   * @param rotation An optional rotation to apply to the vertices
   * @returns The shape's vertices relative to the provided origin in clip space
   */
  abstract getVerticesClipSpace(origin: vec2, scale: vec2, rotation?: number): number[];

  /**
   * Gets the shape's vertex indices for drawing using element arrays.
   *
   * @param offset An offset to apply to each index
   * @returns The shape's vertex indices with the given offset added to each index
   */
  abstract getIndices(offset: number): Uint16Array;
}
