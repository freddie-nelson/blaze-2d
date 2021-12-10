import { vec2 } from "gl-matrix";
import Object2D from "../object2d";
import Renderer from "../renderer/renderer";
import Texture from "../texture/texture";
import Color from "../utils/color";
import { applyRotation, applyTranslation } from "../utils/vectors";

const defaultTexture = new Texture(new Color("gray"));

/**
 * Represents an arbitrary shape in 2D world space.
 *
 * A shape is self contained and includes functions to render itself.
 */
export default abstract class Shape extends Object2D {
  // protected height: number;
  // protected width: number;
  texture = defaultTexture;

  constructor() {
    super();
  }

  /**
   * Renders the shape using the {@link Renderer}.
   *
   * @param position The x and y position to render the shape at
   * @param rotation The rotation to apply to the rendered shape
   * @param zIndex The z position of the rendered shape
   */
  render(position?: vec2, rotation?: number, zIndex?: number) {
    Renderer.queueShape(this, position, rotation, zIndex);
  }

  /**
   * Calculates the shape's UV coords to be used for texture rendering.
   *
   * @returns the shape's UV coords
   */
  abstract getUVCoords(): Float32Array;

  /**
   * Calculates the shape's vertices in local space.
   *
   * @returns The shape's vertices
   */
  getVertices() {
    const base = this.getBaseVertices();
    const translated = applyTranslation(base, this.getPosition());
    const rotated = applyRotation(translated, this.getPosition(), this.getRotation());

    const final: number[] = [];
    rotated.forEach((v) => final.push(...v));

    return final;
  }

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
   * Calculates the base vertices of the shape.
   *
   * These are the vertices for the type of shape at unit size, scaled to the shape's dimensions.
   *
   * @returns The shape's vertices
   */
  abstract getBaseVertices(): vec2[];

  /**
   * Gets the shape's vertex indices for drawing using element arrays.
   *
   * @param offset An offset to apply to each index
   * @returns The shape's vertex indices with the given offset added to each index
   */
  abstract getIndices(offset?: number): Uint16Array;
}
