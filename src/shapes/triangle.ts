import { vec2 } from "gl-matrix";
import Renderer from "../renderer/renderer";
import { applyRotation, applyTranslation } from "../utils/vectors";
import Shape from "./shape";

// vertices for a triangle
const baseVertices = {
  tc: vec2.fromValues(0.5, 1),
  bl: vec2.fromValues(0, 0),
  br: vec2.fromValues(1, 0),
};

const indices = new Uint16Array([0, 1, 2]);

const uvs = new Float32Array([0, 0, 1, 0, 0.5, 1]);

/**
 * Represents a triangle in 2D space with a width and height.
 */
export default class Triangle extends Shape {
  private height: number;
  private width: number;

  /**
   * Creates a new {@link Triangle} instance with dimensions, position and rotation.
   *
   * @param width The width of the triangle (x size)
   * @param height The height of the triangle (y size)
   * @param position The triangle's position in world space, default is [0, 0]
   * @param rotation The triangle's rotation, default is 0.
   */
  constructor(width: number, height: number, position?: vec2, rotation?: number) {
    super();
    if (position) this.setPosition(position);
    if (rotation) this.setRotation(rotation);

    this.width = width;
    this.height = height;
  }

  /**
   * Calculates the triangle's vertices relative to the provided origin in world space.
   *
   * @param origin The origin to calculate the vertices relative to, should be a world position
   * @param rotation An optional world space rotation to apply to the vertices
   * @param returnVecs Wether or not to return the vertices as vec2s or raw numbers
   * @returns The triangle's vertices relative to the provided origin in world space
   */
  getVerticesWorld(origin: vec2, rotation?: number, returnVecs = false) {
    const base = this.getBaseVertices();

    const world = applyTranslation(base, origin);
    const worldLocal = applyTranslation(world, this.getPosition());
    const worldLocalRotated = rotation ? applyRotation(worldLocal, origin, rotation) : worldLocal;

    // vector to get from tc vertex to bc
    // worldLocalRotated[2] is tc
    const tcbc = vec2.sub(
      vec2.create(),
      vec2.fromValues(worldLocalRotated[2][0], worldLocalRotated[0][1]),
      worldLocalRotated[2]
    );

    // centre of the triangle after translations
    // TODO: Could change centre calculation to Midpoint formula
    const centre = vec2.scaleAndAdd(vec2.create(), worldLocalRotated[2], tcbc, 0.5);

    const worldLocalRotatedLocalRot = applyRotation(worldLocalRotated, centre, this.getRotation());
    // const worldLocalTransRot = worldLocalTranslation;

    if (returnVecs) return worldLocalRotatedLocalRot;

    const final: number[] = [];
    worldLocalRotatedLocalRot.forEach((v) => final.push(...v));

    return final;
  }

  /**
   * Calculates the base vertices of the triangle.
   *
   * These are the vertices for a triangle scaled to the width and height of the {@link Triangle} instance.
   *
   * @returns The triangles base vertices
   */
  getBaseVertices() {
    const base = [
      baseVertices.bl,
      vec2.multiply(vec2.create(), baseVertices.br, vec2.fromValues(this.width, 1)),
      vec2.multiply(vec2.create(), baseVertices.tc, vec2.fromValues(this.width, this.height)),
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
   * Gets the triangle's vertex indices for drawing using element arrays.
   *
   * @param offset An offset to apply to each index
   * @returns The triangle's vertex indices with the given offset added to each index
   */
  getIndices(offset = 0) {
    return indices.map((i) => i + offset);
  }

  /**
   * Calculates the triangles's UV coords to be used for texture rendering.
   *
   * @returns the triangle's UV coords
   */
  getUVCoords() {
    return uvs;
  }

  /**
   * Sets the triangle's width.
   *
   * @throws When the the provided width is < 0
   *
   * @param width The triangle's new width
   */
  setWidth(width: number) {
    if (width < 0) throw new Error("Triangle: Width cannot be < 0.");

    this.width = width;
  }

  /**
   * Gets the triangle's width in world space units.
   *
   * @returns The triangle's width in world space
   */
  getWidth() {
    return this.width;
  }

  /**
   * Sets the triangle's height.
   *
   * @throws When the the provided height is < 0
   *
   * @param height The triangle's new height
   */
  setHeight(height: number) {
    if (height < 0) throw new Error("Triangle: Width cannot be < 0.");

    this.height = height;
  }

  /**
   * Gets the triangle's height in world space units.
   *
   * @returns The triangle's height in world space
   */
  getHeight() {
    return this.height;
  }
}
