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
 * Represents a Cuboid in 3D space with a width, height and depth.
 */
export default class Triangle extends Shape {
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
   * Renders the triangle using the {@link Renderer}.
   *
   * @param position The x and y position to render the triangle at
   * @param rotation The rotation to apply to the rendered triangle
   * @param zIndex The z position of the rendered triangle
   */
  render(position?: vec2, rotation?: number, zIndex?: number) {
    Renderer.queueShape(this, position, rotation, zIndex);
  }

  /**
   * Calculates the triangle's vertices in local space.
   *
   * @param translate Wether or not to apply the triangle's position to the vertex positions.
   *
   * @returns The triangles vertices
   */
  getVertices(translate = true) {
    const base = this.getBaseVertices();
    const rotated = applyRotation(base, this.getPosition(), this.getRotation());
    const translated = !translate ? rotated : applyTranslation(rotated, this.getPosition());

    const final: number[] = [];
    translated.forEach((v) => final.push(...v));

    return final;
  }

  /**
   * Calculates the triangle's vertices relative to the provided origin in world space.
   *
   * @param origin The origin to calculate the vertices relative to, should be a world position
   * @param rotation An optional world space rotation to apply to the vertices
   * @returns The triangle's vertices relative to the provided origin in world space
   */
  getVerticesWorld(origin: vec2, rotation?: number) {
    const base = this.getBaseVertices();

    const world = applyTranslation(base, origin);
    const worldLocal = applyTranslation(world, this.getPosition());
    const worldLocalRotated = rotation ? applyRotation(worldLocal, origin, rotation) : worldLocal;

    // const worldLocalTranslation = worldRotated;

    // vector to get from tl vertex to br
    const tl = vec2.fromValues(worldLocalRotated[0][0], worldLocalRotated[2][1]);
    const tlbr = vec2.create();
    vec2.sub(tlbr, worldLocalRotated[1], tl);

    // centre of the triangle after translations
    const centre = vec2.create();
    vec2.scale(centre, tlbr, 0.5);
    vec2.add(centre, centre, tl);

    const worldLocalRotatedLocalRot = applyRotation(worldLocalRotated, centre, this.getRotation());
    // const worldLocalTransRot = worldLocalTranslation;

    const final: number[] = [];
    worldLocalRotatedLocalRot.forEach((v) => final.push(...v));

    return final;
  }

  /**
   * Calculates the triangle's vertices relative to the provided origin in world space.
   *
   * @param origin The origin to calculate the vertices relative to, should be a world position
   * @param scale The vector to scale the world space vertices by to obtain clip space values
   * @param rotation An optional rotation to apply to the vertices
   * @returns The triangle's vertices relative to the provided origin in clip space
   */
  getVerticesClipSpace(origin: vec2, scale: vec2, rotation?: number) {
    const world = this.getVerticesWorld(origin, rotation);

    return world.map((v, i) => {
      if (i % 2 === 0) return v * scale[0];
      else return v * scale[1];
    });
  }

  /**
   * Calculates the base vertices of the triangle.
   *
   * These vertices are the base vertices for a quad, scaled to the width and height of the triangle.
   *
   * @returns The triangles base vertices
   */
  private getBaseVertices() {
    const base = [
      baseVertices.bl,
      this.vertexScale(baseVertices.br, [this.width, 1]),
      this.vertexScale(baseVertices.tc, [this.width, this.height]),
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
