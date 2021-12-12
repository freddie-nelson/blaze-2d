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
  private height: number;
  private width: number;

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
   * Calculates the rect's vertices relative to the provided origin in world space.
   *
   * @param origin The origin to calculate the vertices relative to, should be a world position
   * @param rotation An optional world space rotation to apply to the vertices
   * @param returnVecs Wether or not to return the vertices as vec2s or raw numbers
   * @returns The rect's vertices relative to the provided origin in world space
   */
  getVerticesWorld(origin: vec2, rotation?: number, returnVecs = false) {
    const base = this.getBaseVertices();

    const world = applyTranslation(base, origin);
    const worldLocal = applyTranslation(world, this.getPosition());
    const worldLocalRotated = rotation ? applyRotation(worldLocal, origin, rotation) : worldLocal;

    // const worldLocalTranslation = worldRotated;

    // vector to get from tl vertex to br vertex
    const tlbr = vec2.sub(vec2.create(), worldLocalRotated[1], worldLocalRotated[3]);

    // centre of the rectangle after translations
    const centre = vec2.scaleAndAdd(vec2.create(), worldLocalRotated[3], tlbr, 0.5);

    const worldLocalRotatedLocalRot = applyRotation(worldLocalRotated, centre, this.getRotation());
    // const worldLocalTransRot = worldLocalTranslation;

    if (returnVecs) return worldLocalRotatedLocalRot;

    const final: number[] = [];
    worldLocalRotatedLocalRot.forEach((v) => final.push(...v));

    return final;
  }

  /**
   * Calculates the base vertices of the rectangle.
   *
   * These vertices are the base vertices for a quad, scaled to the width and height of the {@link Rectangle} instance.
   *
   * @returns The rectangles base vertices
   */
  getBaseVertices() {
    const base = [
      baseVertices.bl,
      vec2.multiply(vec2.create(), baseVertices.br, vec2.fromValues(this.width, 1)),
      vec2.multiply(vec2.create(), baseVertices.tr, vec2.fromValues(this.width, this.height)),
      vec2.multiply(vec2.create(), baseVertices.tl, vec2.fromValues(1, this.height)),
    ];

    const temp = vec2.create();
    const offset = vec2.fromValues(this.width / 2, this.height / 2);

    const centred = base.map((v) => {
      vec2.sub(temp, v, offset);
      return vec2.clone(temp);
    });

    return centred;
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
   * Sets the rectangle's width.
   *
   * @throws When the the provided width is < 0
   *
   * @param width The rectangle's new width
   */
  setWidth(width: number) {
    if (width < 0) throw new Error("Rect: Width cannot be < 0.");

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
   * @throws When the the provided height is < 0
   *
   * @param height The rectangle's new height
   */
  setHeight(height: number) {
    if (height < 0) throw new Error("Rect: Width cannot be < 0.");

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
