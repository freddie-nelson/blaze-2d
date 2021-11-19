import { vec2 } from "gl-matrix";
import Renderer from "../renderer/renderer";
import { applyRotation, applyTranslation } from "../utils/vectors";
import Shape from "./shape";

// vertices for a rect
const baseVertices = {
  tl: vec2.fromValues(0, 1),
  tr: vec2.fromValues(1, 1),
  bl: vec2.fromValues(0, 0),
  br: vec2.fromValues(1, 0),
};

const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);

const uvs = new Float32Array([0, 1, 1, 1, 1, 0, 0, 0]);

/**
 * Represents a Cuboid in 3D space with a width, height and depth.
 */
export default class Rect extends Shape {
  /**
   * Creates a new {@link Rect} instance with dimensions, position and rotation.
   *
   * @param width The width of the cuboid (x size)
   * @param height The height of the cuboid (y size)
   * @param position The rects position in world space, default is [0, 0]
   * @param rotation The rects rotation, default is 0.
   */
  constructor(width: number, height: number, position?: vec2, rotation?: number) {
    super();
    if (position) this.setPosition(position);
    if (rotation) this.setRotation(rotation);

    this.width = width;
    this.height = height;
  }

  /**
   * Renders the rectangle using the {@link Renderer}.
   *
   * @param position The x and y position to render the rectangle at
   * @param zIndex The z position of the rendered rectangle
   * @param scale The world cell size to clip space scale value
   */
  render(position: vec2, rotation: number, zIndex: number, scale: vec2) {
    Renderer.renderRect(this, position, rotation, zIndex, scale);
  }

  /**
   * Calculates the center point of the rectangle, with an origin point added to it.
   *
   * Rectangle rotations are not taken into account.
   *
   * @param origin The origin in world space to get the center relative to.
   */
  getCenter(origin = baseVertices.bl) {
    const center = vec2.fromValues(this.width / 2, this.height / 2);
    vec2.add(center, center, this.getPosition());
    vec2.add(center, center, origin);
    return center;
  }

  /**
   * Calculates the rect's vertices in local space.
   *
   * @param translate Wether or not to apply the rectangle's position to the vertex positions.
   *
   * @returns The rects vertices
   */
  getVertices(translate = false) {
    const base = this.getBaseVertices();
    const rotated = applyRotation(base, this.getCenter(), this.getRotation());
    const translated = !translate ? rotated : applyTranslation(rotated, this.getPosition());

    const final: number[] = [];
    translated.forEach((v) => final.push(...v));

    return final;
  }

  /**
   * Calculates the rect's vertices relative to the provided origin in world space.
   *
   * @param origin The origin to calculate the vertices relative to, should be a world position
   * @param rotation An optional world space rotation to apply to the vertices
   * @returns The rect's vertices relative to the provided origin in world space
   */
  getVerticesWorld(origin: vec2, rotation?: number) {
    const base = this.getBaseVertices();

    // move origin so that rect is positioned around origin relative to its center
    const movedOrigin = vec2.fromValues(origin[0] - this.width / 2, origin[1] - this.height / 2);

    const world = applyTranslation(base, movedOrigin);
    const worldRotated = rotation ? applyRotation(world, origin, rotation) : world;

    const worldLocalTranslation = applyTranslation(worldRotated, this.getPosition());
    // const worldLocalTranslation = worldRotated;

    // vector to get from tl vertex to br vertex
    const tlbr = vec2.create();
    vec2.sub(tlbr, worldLocalTranslation[1], worldLocalTranslation[3]);

    // center of the rectangle after translations
    const center = vec2.create();
    vec2.scale(center, tlbr, 0.5);
    vec2.add(center, center, worldLocalTranslation[3]);

    const worldLocalTransRot = applyRotation(worldLocalTranslation, center, this.getRotation());
    // const worldLocalTransRot = worldLocalTranslation;

    const final: number[] = [];
    worldLocalTransRot.forEach((v) => final.push(...v));

    return final;
  }

  /**
   * Calculates the rect's vertices relative to the provided origin in world space.
   *
   * @param origin The origin to calculate the vertices relative to, should be a world position
   * @param scale The vector to scale the world space vertices by to obtain clip space values
   * @param rotation An optional rotation to apply to the vertices
   * @returns The rect's vertices relative to the provided origin in clip space
   */
  getVerticesClipSpace(origin: vec2, scale: vec2, rotation?: number) {
    const world = this.getVerticesWorld(origin, rotation);

    return world.map((v, i) => {
      if (i % 2 === 0) return v * scale[0];
      else return v * scale[1];
    });
  }

  /**
   * Calculates the base vertices of the rectangle.
   *
   * These vertices are the base vertices for a quad, scaled to the width and height of the rectangle.
   *
   * @returns The rectangles base vertices
   */
  private getBaseVertices() {
    return [
      baseVertices.bl,
      this.vertexScale(baseVertices.br, [this.width, 1]),
      this.vertexScale(baseVertices.tr, [this.width, this.height]),
      this.vertexScale(baseVertices.tl, [1, this.height]),
    ];
  }

  /**
   * Gets the rect's vertex indices for drawing using element arrays.
   *
   * @param offset An offset to apply to each index
   * @returns The rect's vertex indices with the given offset added to each index
   */
  getIndices(offset = 0) {
    return indices.map((i) => i + offset);
  }

  /**
   * Calculates the rects's UV coords to be used for texture rendering.
   *
   * @returns the rect's UV coords
   */
  getUVCoords() {
    return uvs;
  }

  /**
   * Scales the first vector by the components in the second vector, returning the resultant vector.
   *
   * @param v1 The first vector
   * @param v2 The second vector
   * @returns A new vector with the scaled components
   */
  private vertexScale(v1: vec2, v2: vec2): vec2 {
    return [v1[0] * v2[0], v1[1] * v2[1]];
  }

  /**
   * Sets the rectangle's width.
   *
   * @throws When the the provided width is <= 0
   *
   * @param width The rectangle's new width
   */
  setWidth(width: number) {
    if (width <= 0) throw new Error("Rect: Width cannot be <= 0.");

    this.width = width;
  }

  /**
   * Gets the rectangle's width in world space units.
   *
   * @returns The rectangle's width in world space
   */
  getWidth() {
    return this.width;
  }

  /**
   * Sets the rectangle's height.
   *
   * @throws When the the provided height is <= 0
   *
   * @param height The rectangle's new height
   */
  setHeight(height: number) {
    if (height <= 0) throw new Error("Rect: Width cannot be <= 0.");

    this.height = height;
  }

  /**
   * Gets the rectangle's height in world space units.
   *
   * @returns The rectangle's height in world space
   */
  getHeight() {
    return this.height;
  }
}
