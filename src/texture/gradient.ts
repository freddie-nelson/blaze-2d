import Color from "../utils/color";
import Texture from "./texture";

export enum GradientType {
  LINEAR,
  RADIAL,
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

  private static canvas = document.createElement("canvas");
  private static ctx = GradientTexture.canvas.getContext("2d");

  /**
   * Creates a {@link GradientTexture}.
   *
   * Before use the texture must be refreshed, this is done by calling the `refresh()` method on the texture.
   *
   * @param type The type of gradient (linear, radial, etc)
   * @param resolution The quality of the gradient
   * @param stops The color stops in the gradient
   */
  constructor(type: GradientType, resolution: number, ...stops: ColorStop[]) {
    super();

    if (stops.length === 0) throw new Error("GradientTexture: Must have at least one color in stops array.");
    this.color = stops[0].color;

    this.type = type;
    this.resolution = resolution;
    this.stops = stops;
  }

  /**
   * Regenerates the gradient image.
   *
   * @returns A promise which is resolved when the gradient has been loaded into the texture's image.
   */
  refresh() {
    GradientTexture.canvas.width = this.resolution;
    if (this.type === GradientType.RADIAL) {
      GradientTexture.canvas.height = this.resolution;
    } else {
      GradientTexture.canvas.height = 1;
    }

    GradientTexture.ctx.clearRect(0, 0, this.resolution, this.resolution);

    GradientTexture.ctx.fillStyle = this.createGradient();
    GradientTexture.ctx.fillRect(0, 0, GradientTexture.canvas.width, GradientTexture.canvas.height);

    return this.loadImage(GradientTexture.canvas.toDataURL());
  }

  /**
   * Creates the canvas gradient fill for this {@link GradientTexture}.
   */
  createGradient() {
    let g: CanvasGradient;

    switch (this.type) {
      case GradientType.LINEAR:
        g = GradientTexture.ctx.createLinearGradient(0, 0, this.resolution, 1);
        break;
      case GradientType.RADIAL:
        g = GradientTexture.ctx.createRadialGradient(
          this.resolution / 2,
          this.resolution / 2,
          0,
          this.resolution / 2,
          this.resolution / 2,
          this.resolution
        );
      default:
        break;
    }

    for (const stop of this.stops) {
      g.addColorStop(stop.offset, stop.color.hex);
    }

    return g;
  }
}
