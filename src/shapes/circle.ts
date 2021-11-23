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
   * Renders the circle using the {@link Renderer}.
   *
   * @param position The x and y position to render the circle at
   * @param rotation The rotation to apply to the rendered circle
   * @param zIndex The z position of the rendered circle
   * @param scale The world cell size to clip space scale value
   */
  render(position: vec2, rotation: number, zIndex: number, scale: vec2) {
    Renderer.renderCircle(this, position, rotation, zIndex, scale);
  }

  /**
   * Calculates the circles's vertices in local space.
   *
   * @returns The circle's vertices
   */
  getVertices() {
    const base = this.getBaseVertices();
    const rotated = applyRotation(base, this.getPosition(), this.getRotation());
    const translated = applyTranslation(rotated, this.getPosition());

    const final: number[] = [];
    translated.forEach((v) => final.push(...v));

    return final;
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
    const tlbr = vec2.create();
    vec2.sub(tlbr, worldLocalRotated[1], worldLocalRotated[3]);

    // centre of the rectangle after translations
    const centre = vec2.create();
    vec2.scale(centre, tlbr, 0.5);
    vec2.add(centre, centre, worldLocalRotated[3]);

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
   * These vertices are the base vertices for a quad, scaled to the radius of the circle.
   *
   * @returns The circle's base vertices
   */
  private getBaseVertices() {
    const base = [
      baseVertices.bl,
      this.vertexScale(baseVertices.br, [this.width, 1]),
      this.vertexScale(baseVertices.tr, [this.width, this.height]),
      this.vertexScale(baseVertices.tl, [1, this.height]),
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
   * Sets the circle's radius by setting the `width` and `height` to `radius`.
   *
   * @throws When the provided radius is < 0
   *
   * @param radius The circle's new radius
   */
  setRadius(radius: number) {
    if (radius < 0) throw new Error("Circle: Radius cannot be < 0.");

    this.radius = radius;
    this.width = radius * 2;
    this.height = radius * 2;
  }

  /**
   * Gets the radius of the circle.
   *
   * @returns The radius of the circle
   */
  getRadius() {
    return this.radius;
  }

  /**
   * Sets the circle's width.
   *
   * Is equivalent to setting the circle's diameter.
   *
   * The circle's radius will be set to half of the given diameter.
   *
   * @throws When the provided diameter is < 0
   *
   * @param diameter The circle's new diameter
   */
  setWidth(diameter: number) {
    if (diameter < 0) throw new Error("Circle: Diameter cannot be < 0.");

    this.width = diameter;
    this.height = diameter;
    this.radius = diameter / 2;
  }

  /**
   * Gets the radius of the circle.
   *
   * @returns The radius of the circle
   */
  getWidth() {
    return this.width;
  }

  /**
   * Sets the circle's height.
   *
   * Is equivalent to setting the circle's diameter.
   *
   * The circle's radius will be set to half of the given diameter.
   *
   * @throws When the provided diameter is < 0
   *
   * @param diameter The circle's new diameter
   */
  setHeight(diameter: number) {
    if (diameter < 0) throw new Error("Circle: Diameter cannot be < 0.");

    this.width = diameter;
    this.height = diameter;
    this.radius = diameter / 2;
  }

  /**
   * Gets the height of the circle.
   *
   * This is equivalent to the diameter of the circle.
   *
   * @returns The height of the circle
   */
  getHeight() {
    return this.height;
  }
}
