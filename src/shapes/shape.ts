import { vec2 } from "gl-matrix";
import Camera from "../camera/camera";
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
   * @param returnVecs Wether or not to return the vertices as vec2s or raw numbers
   * @returns The shape's vertices relative to the provided origin in world space
   */
  abstract getVerticesWorld(origin: vec2, rotation?: number, returnVecs?: boolean): number[] | vec2[];

  /**
   * Calculates the shape's vertices relative to the provided origin in world space.
   *
   * @param origin The origin to calculate the vertices relative to, should be a world position
   * @param scale The vector to scale the world space vertices by to obtain clip space values
   * @param rotation An optional rotation to apply to the vertices
   * @param camera An optional camera to get vertices relative to
   * @returns The shape's vertices relative to the provided origin in clip space
   */
  getVerticesClipSpace(origin: vec2, scale: vec2, rotation?: number, camera?: Camera) {
    const pos = camera ? vec2.sub(vec2.create(), origin, camera.getPosition()) : origin;
    let world = <vec2[]>this.getVerticesWorld(pos, rotation, true);

    if (camera) world = applyRotation(world, vec2.create(), camera.getRotation());

    const final: number[] = [];
    world.forEach((v) => final.push(...v));

    return final.map((v, i) => {
      if (i % 2 === 0) return v * scale[0];
      else return v * scale[1];
    });
  }

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

  private cachedPoints = {
    points: <vec2[]>[],
    pos: vec2.fromValues(-Infinity, Infinity),
    posSlop: 0.00001,
    rotation: Infinity,
    rotationSlop: 0.001,
  };

  private posDiff = vec2.create();

  /**
   * Calculates the bounding points of the {@link Shape} instance.
   *
   * **NOTE: The shape's vertices are recalculated every time this function is called.**
   *
   * @returns The bounding points of the box
   */
  getPoints() {
    // return cached points if they are valid
    if (
      vec2.sqrLen(vec2.sub(this.posDiff, this.getPosition(), this.cachedPoints.pos)) <=
        this.cachedPoints.posSlop &&
      Math.abs(this.getRotation() - this.cachedPoints.rotation) <= this.cachedPoints.rotationSlop
    ) {
      // console.log("using cached points");
      return this.cachedPoints.points;
    }

    const vertices = <number[]>this.getVerticesWorld(vec2.create());

    const points: vec2[] = [];
    for (let i = 1; i < vertices.length; i += 2) {
      points.push(vec2.fromValues(vertices[i - 1], vertices[i]));
    }

    // cache points
    this.cachedPoints.points = points;
    vec2.copy(this.cachedPoints.pos, this.getPosition());
    this.cachedPoints.rotation = this.getRotation();

    return points;
  }
}
