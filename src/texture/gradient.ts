import Logger from "../logger";
import Color from "../utils/color";
import Texture from "./texture";

export enum GradientType {
  LINEAR,
  RADIAL,
}

export enum GradientDirection {
  RIGHT_TO_LEFT,
  LEFT_TO_RIGHT,
  TOP_TO_BOTTOM,
  BOTTOM_TO_TOP,
  BR_TO_TL,
  BL_TO_TR,
}

/**
 * Represents a color stop on the canvas gradient.
 *
 * @field `offset` Where the stop is along the gradient (between 0 and 1).
 * @field `color` The color at the stop
 */
export interface ColorStop {
  offset: number;
  color: Color;
}

/**
 * Represents a texture with a gradient as it's image.
 */
export default class GradientTexture extends Texture {
  stops: ColorStop[];
  resolution = 50;
  type = GradientType.LINEAR;
  direction = GradientDirection.LEFT_TO_RIGHT;

  private static canvas = document.createElement("canvas");
  private static ctx = GradientTexture.canvas.getContext("2d");

  /**
   * Creates a {@link GradientTexture}.
   *
   * Before use the texture must be refreshed, this is done by calling the `refresh()` method on the texture.
   *
   * @param type The type of gradient (linear, radial, etc)
   * @param dir The direction fo the gradient
   * @param resolution The quality of the gradient
   * @param stops The color stops in the gradient
   */
  constructor(type: GradientType, dir: GradientDirection, resolution: number, ...stops: ColorStop[]) {
    super();

    if (stops.length === 0) throw Logger.error("GradientTexture", "Must have at least one color stop.");
    this.color = stops[0].color;

    this.type = type;
    this.direction = dir;
    this.resolution = resolution;
    this.stops = stops;
  }

  /**
   * Regenerates the gradient image.
   *
   * @returns A promise which is resolved when the gradient has been loaded into the texture's image.
   */
  refresh() {
    const g = this.createGradient();

    // reset canvas
    GradientTexture.canvas.width = g.width;
    GradientTexture.canvas.height = g.height;
    GradientTexture.ctx.clearRect(0, 0, g.width, g.height);

    GradientTexture.ctx.fillStyle = g.gradient;
    GradientTexture.ctx.fillRect(0, 0, g.width, g.height);

    return this.loadImage(GradientTexture.canvas.toDataURL());
  }

  /**
   * Creates the canvas gradient fill for this {@link GradientTexture}.
   *
   * @returns The created gradient and dimensions of the gradient
   */
  createGradient() {
    let g: CanvasGradient;
    let height = 0;
    let width = 0;

    switch (this.type) {
      case GradientType.LINEAR:
        switch (this.direction) {
          case GradientDirection.LEFT_TO_RIGHT:
            width = this.resolution;
            height = 1;
            g = GradientTexture.ctx.createLinearGradient(0, 0, this.resolution, 1);
            break;
          case GradientDirection.RIGHT_TO_LEFT:
            width = this.resolution;
            height = 1;
            g = GradientTexture.ctx.createLinearGradient(this.resolution, 0, 0, 1);
            break;
          case GradientDirection.TOP_TO_BOTTOM:
            width = 1;
            height = this.resolution;
            g = GradientTexture.ctx.createLinearGradient(0, 0, 1, this.resolution);
            break;
          case GradientDirection.BOTTOM_TO_TOP:
            width = 1;
            height = this.resolution;
            g = GradientTexture.ctx.createLinearGradient(0, this.resolution, 1, 0);
            break;
          case GradientDirection.BL_TO_TR:
            width = this.resolution;
            height = this.resolution;
            g = GradientTexture.ctx.createLinearGradient(0, this.resolution, this.resolution, 0);
            break;
          case GradientDirection.BR_TO_TL:
            width = this.resolution;
            height = this.resolution;
            g = GradientTexture.ctx.createLinearGradient(this.resolution, this.resolution, 0, 0);
            break;
          default:
            width = this.resolution;
            height = 1;
            g = GradientTexture.ctx.createLinearGradient(0, 0, this.resolution, 1);
            break;
        }
        break;
      case GradientType.RADIAL:
        width = this.resolution;
        height = this.resolution;
        g = GradientTexture.ctx.createRadialGradient(
          this.resolution / 2,
          this.resolution / 2,
          0,
          this.resolution / 2,
          this.resolution / 2,
          this.resolution,
        );
        break;
      default:
        break;
    }

    for (const stop of this.stops) {
      g.addColorStop(stop.offset, stop.color.hex);
    }

    return { gradient: g, width, height };
  }
}
