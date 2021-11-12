import { vec2 } from "gl-matrix";
import Texture from "./texture";

/**
 * Represents an image/texture stored on the atlas.
 *
 * @field **tl** The top left corner of the image on the atlas in pixels
 * @field **br** The bottom right corner of the image on the atlas in pixels
 * @field **texture** The texture stored
 */
export interface TextureAtlasImage {
  tl: vec2;
  br: vec2;
  texture: Texture;
}

const colorBlockSize = 8;
const padding = 1;

/**
 * Combines {@link Texture}s into one single image using an offscreen canvas.
 *
 * If a {@link Texture} is added to the atlas that has no image then a 1x1 pixel is used with the color of the texture.
 *
 * The size of the atlas should be no larger than `MAX_TEXTURE_SIZE` to insure the atlas can be stored on the GPU.
 *
 * Also provides an api to get the locations of textures on the atlas.
 */
export default class TextureAtlas extends Texture {
  private size: number;
  private textures: Map<Texture, TextureAtlasImage> = new Map();

  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(size: number) {
    super();

    this.size = size;

    this.canvas = document.createElement("canvas");
    this.canvas.height = size;
    this.canvas.width = size;
    this.ctx = this.canvas.getContext("2d", { alpha: true });
  }

  /**
   * Adds a texture to the atlas.
   *
   * @param texture The texture to add
   * @param refreshAtlas Wether or not to refresh the atlas once the texture has been added
   * @returns Wether or not the texture was added to the atlas
   */
  addTexture(texture: Texture, refreshAtlas = false): boolean {
    if (this.textures.has(texture)) return true;

    this.textures.set(texture, {
      texture,
      tl: vec2.create(),
      br: vec2.create(),
    });

    if (refreshAtlas) {
      this.refreshAtlas();
    }

    return true;
  }

  /**
   * Removes a texture from the atlas.
   *
   * @param texture The texture to remove
   * @param refreshAtlas Wether or not to refresh the atlas once the texture has been removed
   * @returns Wether or not the texture was removed from the atlas
   */
  removeTexture(texture: Texture, refreshAtlas = false): boolean {
    this.textures.delete(texture);

    if (refreshAtlas) {
      this.refreshAtlas();
    }

    return true;
  }

  /**
   * Gets the location ({@link TextureAtlasImage}) of the texture on the atlas.
   *
   * @param texture The texture to find
   * @returns The {@link TextureAtlasImage} of the texture on the atlas or undefined
   */
  getTexture(texture: Texture) {
    return this.textures.get(texture);
  }

  /**
   * Gets all the textures on the atlas as an array.
   *
   * @returns An array of all textures on the atlas
   */
  getAllTextures() {
    return Array.from(this.textures.values());
  }

  /**
   * Packs all textures in the atlas together, draws them to the canvas and loads the canvas as a data URL to `this.image`.
   *
   * @returns A promise that resolves once the image has loaded or rejects if there is an error while loading the atlas image.
   */
  refreshAtlas() {
    this.packTextures();
    this.drawTexturesOnCanvas();
    return this.loadImage();
  }

  /**
   * Loads an the atlas' canvas into `image`.
   *
   * @returns A promise that resolves once the image has loaded or rejects if there is an error while loading the image.
   */
  loadImage() {
    return super.loadImage(this.canvas.toDataURL());
  }

  /**
   * Packs all textures in the atlas onto it's canvas.
   *
   * It then loads the canvas as a data URL into `this.image` using `this.loadImage`.
   */
  packTextures() {
    const textures = this.getAllTextures();

    const maxWidth = this.size;

    let rowHeight = 0;
    let row = 0;
    let col = 0;

    while (textures.length > 0) {
      const { i, t } = this.findTallestTexture(textures);
      textures.splice(i, 1);

      const image = t.texture.image;
      const width = image ? image.width : colorBlockSize;
      const height = image ? image.height : colorBlockSize;

      if (height > rowHeight || col + width > maxWidth) {
        row += rowHeight + padding;
        rowHeight = height;
        col = 0;
      }

      t.tl = vec2.fromValues(col, row);
      t.br = vec2.fromValues(col + width, row + height);
      col += width + padding;
    }
  }

  /**
   * Draws all textures stored in the atlas onto the canvas.
   *
   * If `this.packTextures` has not been called beforehand then all textures will be drawn over each other or in undesired positions.
   */
  drawTexturesOnCanvas() {
    const textures = this.getAllTextures();
    this.ctx.clearRect(0, 0, this.size, this.size);

    for (const t of textures) {
      if (!t.texture.image) {
        // when texture has no image substitute with 1x1 pixel of textures color
        this.ctx.fillStyle = t.texture.color.hex;
        this.ctx.fillRect(t.tl[0], t.tl[1], colorBlockSize, colorBlockSize);
      } else {
        this.ctx.drawImage(t.texture.image, t.tl[0], t.tl[1]);
      }
    }
  }

  /**
   * Finds the tallest texture in the given list of textures.
   *
   * @param textures The list of textures to search
   * @returns The tallest texture and it's index in `textures`
   */
  private findTallestTexture(textures: TextureAtlasImage[]): { i: number; t: TextureAtlasImage } {
    let maxHeight = 0;
    let tallestTexture: TextureAtlasImage;
    let tallestIndex = 0;

    for (let i = 0; i < textures.length; i++) {
      const t = textures[i];
      const h = t.texture.image ? t.texture.image.height : 1;

      if (h > maxHeight) {
        maxHeight = h;
        tallestTexture = t;
        tallestIndex = i;
      }
    }

    return { i: tallestIndex, t: tallestTexture };
  }

  /**
   * Gets the size of the atlas image.
   *
   * @returns The size of the atlas image
   */
  getSize() {
    return this.size;
  }
}
