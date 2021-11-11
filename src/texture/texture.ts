import Color from "../utils/color";

export interface TextureUnit {
  unit: number;
  lastUsed: number;
  texture?: Texture;
}

/**
 * Represents a texture with a color and optionally an image that can be applied to {@link Shape}s
 */
export default class Texture {
  color: Color;
  imagePath: string;
  image: HTMLImageElement;

  private unit: typeof WebGL2RenderingContext.TEXTURE0 = -1;

  /**
   * Creates a {@link Texture} instance with a color.
   *
   * @param color The color of the texture
   */
  constructor(color = new Color("gray")) {
    this.color = color;
  }

  /**
   * Loads an image from a path and stores it in the {@link Texture}.
   *
   * @param imagePath A path to an image
   * @returns A promise that resolves once the image has loaded or rejects if there is an error while loading the image.
   */
  loadImage(imagePath: string) {
    this.imagePath = imagePath;

    this.image = new Image();
    const promise = new Promise<void>((resolve, reject) => {
      this.image.onload = () => resolve();
      this.image.onerror = () => reject();
    });

    this.image.src = this.imagePath;
    return promise;
  }

  /**
   * Set the texture unit to be read from when rendering the texture.
   *
   * **Should only be used if you know what you are doing.**
   *
   * @param unit The texture unit the texture is stored in on the GPU
   */
  setTextureUnit(unit: number) {
    this.unit = unit;
  }

  /**
   * Gets the texture unit the texture is stored in on the GPU, only applies to texture's which use an image.
   *
   * @returns The texture unit the texture is stored in on the GPU, -1 if it is not currently loaded.
   */
  getTextureUnit() {
    return this.unit;
  }
}
