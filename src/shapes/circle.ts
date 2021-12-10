import { vec2 } from "gl-matrix";
import Renderer from "../renderer/renderer";
import { applyRotation, applyTranslation } from "../utils/vectors";
import Shape from "./shape";

// vertices for a
const baseVertices = {
  tl: vec2.fromValues(0, 1),
  tr: vec2.fromValues(1, 1),
  bl: vec2.fromValues(0, 0),
  br: vec2.fromValues(1, 0),
};

const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);

const uvs = new Float32Array([0, 1, 1, 1, 1, 0, 0, 0]);

/**
 * Represents a circle in 2D space with a radius and centre.
 */
export default class Circle extends Shape {
  private radius: number;

  /**
   * Creates a new {@link Circle} instance with a radius, position and rotation.
   *
   * @param radius The radius of the circle
   * @param centre The circle's centre in world space, default is [0, 0]
   * @param rotation The circle's rotation, default is 0.
   */
  constructor(radius: number, centre?: vec2, rotation?: number) {
    super();
    if (centre) this.setPosition(centre);
    if (rotation) this.setRotation(rotation);

    this.setRadius(radius);
  }

  /**
   * Calculates the circle's vertices relative to the provided origin in world space.
   *
   * @param origin The origin to calculate the vertices relative to, should be a world position
   * @param rotation An optional world space rotation to apply to the vertices
   * @returns The circle's vertices relative to the provided origin in world space
   */
  getVerticesWorld(origin: vec2, rotation?: number) {
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

    const final: number[] = [];
    worldLocalRotatedLocalRot.forEach((v) => final.push(...v));

    return final;
  }

  /**
   * Calculates the circle's vertices relative to the provided origin in world space.
   *
   * @param origin The origin to calculate the vertices relative to, should be a world position
   * @param scale The vector to scale the world space vertices by to obtain clip space values
   * @param rotation An optional rotation to apply to the vertices
   * @returns The circle's vertices relative to the provided origin in clip space
   */
  getVerticesClipSpace(origin: vec2, scale: vec2, rotation?: number) {
    const world = this.getVerticesWorld(origin, rotation);

    return world.map((v, i) => {
      if (i % 2 === 0) return v * scale[0];
      else return v * scale[1];
    });
  }

  /**
   * Calculates the base vertices of the circle.
   *
   * These vertices are the base vertices for a quad, scaled to the diameter of the {@link Circle} instance.
   *
   * @returns The circle's base vertices
   */
  getBaseVertices() {
    const diameter = this.radius * 2;
    const base = [
      baseVertices.bl,
      this.vertexScale(baseVertices.br, [diameter, 1]),
      this.vertexScale(baseVertices.tr, [diameter, diameter]),
      this.vertexScale(baseVertices.tl, [1, diameter]),
    ];

    const temp = vec2.create();
    const offset = vec2.fromValues(this.radius, this.radius);

    const centred = base.map((v) => {
      vec2.sub(temp, v, offset);
      return vec2.clone(temp);
    });

    return centred;
  }

  /**
   * Gets the circle's vertex indices for drawing using element arrays.
   *
   * @param offset An offset to apply to each index
   * @returns The circle's vertex indices with the given offset added to each index
   */
  getIndices(offset = 0) {
    return indices.map((i) => i + offset);
  }

  /**
   * Calculates the circle's UV coords to be used for texture rendering.
   *
   * @returns the circle's UV coords
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
   * Sets the circle's radius.
   *
   * @throws When the provided radius is < 0
   *
   * @param radius The circle's new radius
   */
  setRadius(radius: number) {
    if (radius < 0) throw new Error("Circle: Radius cannot be < 0.");

    this.radius = radius;
  }

  /**
   * Gets the radius of the circle.
   *
   * @returns The radius of the circle
   */
  getRadius() {
    return this.radius;
  }
}
