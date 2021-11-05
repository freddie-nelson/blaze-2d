export interface ChunkGeneratorOpts {
  height: number;
  size: number;
}

export type Generator = (chunk: Uint8Array, pos: { x: number; y: number }, opts: ChunkGeneratorOpts) => void;

/**
 * Contains standard chunk generation functions and provides a generators api to allow for extensions to the standard chunk generation.
 */
export default class ChunkGenerator {
  private opts: ChunkGeneratorOpts;
  private height: number;
  private size: number;

  private generators: Generator[] = [];

  /**
   * Creates a {@link ChunkGenerator} instance from the given options.
   */
  constructor(opts: ChunkGeneratorOpts) {
    this.opts = opts;
    this.height = opts.height;
    this.size = opts.size;
  }

  /**
   * Creates an empty **flat** {@link Uint8Array} of length `this.height * this.size * this.size`
   * to represent the chunk's voxel ids
   *
   * The returned {@link Uint8Array} should be indexed in y, x, z order
   *
   * @returns The empty chunk
   */
  private emptyChunk() {
    return new Uint8Array(this.height * this.size * this.size);
  }

  /**
   * Appends a generator to the generators list which will be executed on each call of `this.generateChunk`
   *
   * @param generator The generator to be added to the generators list
   */
  addGenerator(...generator: Generator[]) {
    this.generators.push(...generator);
  }

  /**
   * Removes a generator from the generators list.
   *
   * @param generator The generator to be removed from the generators list
   * @returns True if the generator was removed, false otherwise
   */
  removeGenerator(generator: Generator) {
    const i = this.generators.findIndex((g) => g === generator);
    if (i === -1) {
      this.generators.splice(i, 1);
      return true;
    }

    return false;
  }

  /**
   * Removes all generators from the generators list.
   */
  clearGenerators() {
    this.generators.length = 0;
  }

  /**
   * Creates an empty chunk then executes each generator on the new chunk.
   *
   * The returned {@link Uint8Array} should be indexed in y, x, z order
   *
   * @param pos The chunk coordinates of the new chunk
   * @returns The generated chunk as a flat {@link Uint8Array}
   */
  generateChunk(pos: { x: number; y: number }) {
    const chunk = this.emptyChunk();
    // if (Math.random() < 0.2) chunk.fill(0);
    // chunk[from3Dto1D(0, 0, 0, this.size, this.height)] = 1;
    // chunk[from3Dto1D(0, 1, 0, this.size, this.height)] = 1;
    // chunk[from3Dto1D(1, 0, 0, this.size, this.height)] = 1;
    // chunk[from3Dto1D(0, 0, 1, this.size, this.height)] = 1;
    // chunk[from3Dto1D(0, 0, 2, this.size, this.height)] = 1;
    // chunk[from3Dto1D(2, 0, 0, this.size, this.height)] = 1;
    // chunk[from3Dto1D(1, 0, 1, this.size, this.height)] = 1;
    // chunk[from3Dto1D(0, 1, 1, this.size, this.height)] = 1;
    // chunk[from3Dto1D(1, 1, 0, this.size, this.height)] = 1;
    // chunk[from3Dto1D(0, 2, 0, this.size, this.height)] = 1;

    // chunk[from3Dto1D(7, 0, 0, this.size, this.height)] = 1;
    // chunk[from3Dto1D(7, 1, 0, this.size, this.height)] = 1;
    // chunk[from3Dto1D(6, 0, 0, this.size, this.height)] = 1;
    // chunk[from3Dto1D(7, 0, 1, this.size, this.height)] = 1;
    // chunk[from3Dto1D(7, 0, 2, this.size, this.height)] = 1;
    // chunk[from3Dto1D(5, 0, 0, this.size, this.height)] = 1;
    // chunk[from3Dto1D(6, 0, 1, this.size, this.height)] = 1;
    // chunk[from3Dto1D(7, 1, 1, this.size, this.height)] = 1;
    // chunk[from3Dto1D(6, 1, 0, this.size, this.height)] = 1;
    // chunk[from3Dto1D(7, 2, 0, this.size, this.height)] = 1;

    // chunk[from3Dto1D(7, 0, 7, this.size, this.height)] = 1;
    // chunk[from3Dto1D(7, 1, 7, this.size, this.height)] = 1;
    // chunk[from3Dto1D(6, 0, 7, this.size, this.height)] = 1;
    // chunk[from3Dto1D(7, 0, 6, this.size, this.height)] = 1;
    // chunk[from3Dto1D(7, 0, 5, this.size, this.height)] = 1;
    // chunk[from3Dto1D(5, 0, 7, this.size, this.height)] = 1;
    // chunk[from3Dto1D(6, 0, 6, this.size, this.height)] = 1;
    // chunk[from3Dto1D(7, 1, 6, this.size, this.height)] = 1;
    // chunk[from3Dto1D(6, 1, 7, this.size, this.height)] = 1;
    // chunk[from3Dto1D(7, 2, 7, this.size, this.height)] = 1;

    // chunk[from3Dto1D(0, 0, 7, this.size, this.height)] = 1;
    // chunk[from3Dto1D(0, 1, 7, this.size, this.height)] = 1;
    // chunk[from3Dto1D(1, 0, 7, this.size, this.height)] = 1;
    // chunk[from3Dto1D(0, 0, 6, this.size, this.height)] = 1;
    // chunk[from3Dto1D(0, 0, 5, this.size, this.height)] = 1;
    // chunk[from3Dto1D(2, 0, 7, this.size, this.height)] = 1;
    // chunk[from3Dto1D(1, 0, 6, this.size, this.height)] = 1;
    // chunk[from3Dto1D(0, 1, 6, this.size, this.height)] = 1;
    // chunk[from3Dto1D(1, 1, 7, this.size, this.height)] = 1;
    // chunk[from3Dto1D(0, 2, 7, this.size, this.height)] = 1;

    this.generators.forEach((g) => g(chunk, pos, this.opts));

    return chunk;
  }

  /**
   * Gets the width and depth of each chunk
   *
   * @returns The size of each chunk
   */
  getSize() {
    return this.size;
  }

  /**
   * Gets the height of each chunk
   *
   * @returns The height of each chunk
   */
  getHeight() {
    return this.height;
  }
}
