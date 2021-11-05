import { loadTexture } from "./utils/gl";

/**
 * Stores information about a tilesheet that can be used to texture chunks in a {@link ChunkController}.
 */
export default class Tilesheet {
  texture: WebGLTexture;
  numOfTiles: number;
  tileSize: number;
  width: number;
  height: number;

  /**
   * Creates a {@link Tilesheet} instance and creates a {@link WebGLTexture} from the given image path.
   *
   * @param gl The webgl context to use when creating the {@link WebGLTexture}
   * @param path The path to the tilesheet image
   * @param tileSize The size of each individual tile in the tilesheet in px
   * @param numOfTiles The number of tiles in the tilesheet
   */
  constructor(gl: WebGL2RenderingContext, path: string, tileSize: number, numOfTiles: number) {
    this.texture = loadTexture(gl, path);
    this.numOfTiles = numOfTiles;
    this.tileSize = tileSize;
    this.width = tileSize * 3;
    this.height = tileSize * numOfTiles;
  }
}
