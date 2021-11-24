import { loadTexture } from "../utils/gl";
import TextureAtlas from "./atlas";
import Texture, { TextureUnit } from "./texture";

/**
 * Handles loading and unloading of textures on the GPU as needed.
 */
export default abstract class TextureLoader {
  private static ready = false;

  private static gl: WebGL2RenderingContext;
  private static loaded: Map<Texture, number> = new Map();
  private static textureUnits: TextureUnit[] = [];

  /**
   * Sets up the texture loader for use, should only be called once.
   *
   * @param gl The WebGL context to use for texture loading
   */
  static init(gl: WebGL2RenderingContext) {
    this.ready = true;
    this.gl = gl;

    this.textureUnits = [];
    this.loaded.clear();

    for (let i = 0; i < gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS) - 1; i++) {
      this.textureUnits.push({
        unit: (gl as any)[`TEXTURE${i}`],
        texture: undefined,
        lastUsed: -1,
      });
    }
  }

  /**
   * Checks if the loader is ready to be used for texture loading/unloading.
   *
   * @throws When TextureLoader.init has not yet been called
   */
  private static checkReady() {
    if (!this.ready)
      throw new Error("TextureLoader: TextureLoader.init must be called before the loader can be used.");
  }

  /**
   * Loads a texture into any available texture unit on the GPU, if no unit is available then the unit with the longest time since it was last used is overwritten.
   *
   * @param texture The texture to load
   * @returns Wether or not the texture was loaded
   */
  static loadTexture(texture: Texture) {
    this.checkReady();
    if (this.isLoaded(texture)) return true;

    const unit = this.findReplaceableTextureUnit();
    if (unit.texture) this.unloadTexture(unit.texture, unit);

    unit.texture = texture;
    unit.lastUsed = performance.now();

    this.loaded.set(texture, unit.unit);
    texture.setTextureUnit(unit.unit);

    loadTexture(this.gl, unit);
  }

  /**
   * Unloads the texture from the GPU.
   *
   * @param texture The texture to unload
   * @param unit The texture unit the `texture` belongs to, improves performance as the unit does not need to be searched for.
   * @returns Wether or not the texture was unloaded
   */
  static unloadTexture(texture: Texture, unit?: TextureUnit) {
    this.checkReady();
    if (!this.isLoaded(texture)) return true;

    this.loaded.delete(texture);

    if (!unit) {
      unit = this.getUnitOfTexture(texture);
      if (!unit) return false;
    }

    unit.texture = undefined;
    return true;
  }

  /**
   * Unloads and then reloads the provided texture.
   *
   * @param texture The texture to reload
   * @returns Wether or not the texture was reloaded
   */
  static reloadTexture(texture: Texture) {
    this.unloadTexture(texture);
    return this.loadTexture(texture);
  }

  /**
   * Checks if a texture is loaded, ie the texture's image is loaded in a texture unit on the GPU.
   *
   * @param texture The texture to check
   * @returns Wether or not the texture is loaded
   */
  static isLoaded(texture: Texture) {
    this.checkReady();
    return this.loaded.has(texture);
  }

  /**
   * Finds the texture unit the given texture is loaded in.
   *
   * @param texture The texture to find
   * @returns The unit the texture is loaded in or undefined
   */
  static getUnitOfTexture(texture: Texture): TextureUnit | undefined {
    this.checkReady();
    if (!this.isLoaded(texture)) return undefined;

    const unitIndex = this.textureUnits.findIndex((u) => u.texture === texture);
    if (unitIndex === -1) return undefined;

    return this.textureUnits[unitIndex];
  }

  /**
   * Finds a free texture unit.
   *
   * @returns A free texture unit or undefined when no units are free
   */
  static getFreeTextureUnit(): TextureUnit | undefined {
    this.checkReady();
    const unitIndex = this.textureUnits.findIndex((u) => u.texture === undefined);
    if (unitIndex === -1) return undefined;

    return this.textureUnits[unitIndex];
  }

  /**
   * Finds the best texture unit to replace.
   *
   * First looks for free texture units and if none are available then it will return the texture unit with the oldest last used time.
   *
   * Texture units that have a {@link TextureAtlas} in them will be ignored.
   *
   * @returns The most replaceable texture unit
   */
  static findReplaceableTextureUnit(): TextureUnit {
    this.checkReady();
    let unit = this.getFreeTextureUnit();
    if (unit) return unit;

    let minLastUsed = Number.MAX_SAFE_INTEGER;
    for (const u of this.textureUnits) {
      if (u.lastUsed < minLastUsed && !(u.texture instanceof TextureAtlas)) {
        minLastUsed = u.lastUsed;
        unit = u;
      }
    }

    return unit;
  }

  /**
   * Finds a {@link TextureUnit} by its WebGL texture unit number and updates its lastUsed time to the current time from `performance.now()`
   *
   * @param unit The WebGL texture unit number
   * @returns Wether or not the TextureUnit was updated
   */
  static updateLastUsed(unit: number) {
    const unitIndex = this.textureUnits.findIndex((u) => u.unit === unit);
    if (unitIndex === -1) return false;

    this.textureUnits[unitIndex].lastUsed = performance.now();
    return true;
  }
}
