import Color from "../utils/color";

export interface TextureUnit {
  unit: number;
  lastUsed: number;
  texture?: Texture;
}

export default class Texture {
  color = new Color("gray");
  image: string;

  private unit: typeof WebGL2RenderingContext.TEXTURE0 = -1;

  /**
   * Creates a {@link Texture} instance with a color.
   *
   * @param color The color of the texture
   */
  constructor(color: Color);

  /**
   * Creates a {@link Texture} instance with an image.
   *
   * @param image A relative or absolute path to an image file.
   */
  constructor(image: string);

  constructor(color: Color | string) {
    if (color instanceof Color) {
      this.color = color;
    } else {
      this.image = color;
    }
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
