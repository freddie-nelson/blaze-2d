import { Neighbours } from "../object3d";
import { from3Dto1D } from "../utils/arrays";
import { faces } from "../voxel";

export interface GeometryGeneratorOptions {
  chunkSize: number;
  chunkHeight: number;
  excludeList?: Uint8Array;
}

export interface ChunkGeometry {
  [index: string]: Uint32Array;
  indices: Uint32Array;
  vertices: Uint32Array;
}

/**
 * Creates the geometry for a chunk that will be sent to the GPU for rendering.
 */
export default class GeometryGenerator {
  private chunkSize: number;
  private chunkHeight: number;
  private excludeList: Set<number>;

  /**
   * Creates a {@link GeometryGenerator} instance from the provided options.
   *
   * @param opts The options to use when creating the {@link GeometryGenerator}
   */
  constructor(opts: GeometryGeneratorOptions) {
    this.chunkSize = opts.chunkSize;
    this.chunkHeight = opts.chunkHeight;
    this.excludeList = new Set(opts.excludeList);
  }

  /**
   * Generates the geometry for a given chunk as JS typed arrays that can be sent to a shader.
   *
   * @param chunk The chunk to generate geometry for
   * @param cNeighbours The front, back, left and right neighbours of the given chunk
   * @returns The chunk geometry as JS type arrays
   */
  generateChunkGeometryGPU(chunk: Uint8Array, cNeighbours: Neighbours<Uint8Array>) {
    return this.convertGeoToTypedArrs(this.generateChunkGeometry(chunk, cNeighbours));
  }

  /**
   * Converts chunk geometry as normal js arrays to typed arrays that can be sent to a shader.
   *
   * @param geo The chunk geometry as normal JS {@link Array}s
   * @returns The chunk geometry as {@link Uint32Array}s that is ready to be sent to the GPU
   */
  convertGeoToTypedArrs(geo: { indices: number[]; vertices: number[] }): ChunkGeometry {
    const g = {
      vertices: new Uint32Array(geo.vertices),
      indices: new Uint32Array(geo.indices),
    };
    // console.log(g.vertices[2].toString(2));

    return g;
  }

  /**
   * Generates the geometry for a given chunk.
   *
   * The geometry is made up of vertex data and indices.
   *
   * Each vertex contains its local position within the chunk, a face normal, it's voxel id, and uv coordinate.
   *
   * A vertex is represented as a unsigned 32 bit integer that follows the format (starts from the MSB + 1):
   *    - position { x: 4 bits, y: 10 bits, z: 4 bits } : format { x - y - z }
   *    - normal { normal: 3 bits } (scaled from 0.0 - 1.0 to 0 - 6)
   *    - uv { voxelId: 8bits, uv: 2 bits }
   *
   * @param chunk The chunk to generate geometry for
   * @param cNeighbours The front, back, left and right neighbours of the given chunk
   * @returns The chunk geometry as normal JS {@link Array}s
   */
  generateChunkGeometry(chunk: Uint8Array, cNeighbours: Neighbours<Uint8Array>) {
    let timer = performance.now();
    const indices: number[] = [];
    const vertices: number[] = [];

    for (let y = 0; y < this.chunkHeight; y++) {
      for (let x = 0; x < this.chunkSize; x++) {
        for (let z = 0; z < this.chunkSize; z++) {
          const id = chunk[from3Dto1D(x, y, z, this.chunkSize, this.chunkHeight)];
          const { vertices: voxVertices, indices: voxIndices } = this.generateVoxelGeometry(
            id,
            x,
            y,
            z,
            this.getVoxelNeighbours(chunk, cNeighbours, x, y, z),
            vertices.length
          );

          indices.push(...voxIndices);
          vertices.push(...voxVertices);
        }
      }
    }

    // console.log(vertices[2].toString(2));

    console.log(performance.now() - timer);

    return {
      indices,
      vertices,
    };
  }

  private readonly shaderUvs = [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1],
  ];

  /**
   * Generates the geometry for a single voxel.
   *
   * The geometry is made up of vertex data and indices.
   *
   * Each vertex contains its local position within the chunk, a face normal, it's voxel id, and uv coordinate.
   *
   * A vertex is represented as a unsigned 32 bit integer that follows the format (starts from the MSB + 1):
   *    - position { x: 4 bits, y: 10 bits, z: 4 bits } : format { x - y - z }
   *    - normal { normal: 3 bits } (scaled from 0.0 - 1.0 to 0 - 6)
   *    - uv { voxelId: 8bits, uv: 2 bits }
   *
   * @param id The voxel's id (0 - 255)
   * @param x The x position of the voxel within its container chunk
   * @param y The y position of the voxel within its container chunk
   * @param z The z position of the voxel within its container chunk
   * @param neighbours The neighbours of the voxel (includes neighbours in neighbouring chunks)
   * @param verticesLength The current length of the vertices generated in `this.generateChunkGeometry`
   * @returns The vertices and indices for the voxel's geometry
   */
  generateVoxelGeometry(
    id: number,
    x: number,
    y: number,
    z: number,
    neighbours: Neighbours<number>,
    verticesLength: number
  ) {
    if (this.excludeList.has(id))
      return {
        vertices: [],
        indices: [],
      }; // empty

    const indices: number[] = [];
    const vertices: number[] = [];

    const keys = Object.keys(neighbours);

    for (const k of keys) {
      const n = neighbours[k];
      if (!n || this.excludeList.has(n)) {
        const ndx = verticesLength + vertices.length;

        for (let i = 0; i < faces[k].corners.length; i++) {
          const corner = faces[k].corners[i];

          // position { x: 4 bits, y: 10 bits, z: 4 bits } : format { x - y - z }
          let p = corner.pos[2] + z;
          p |= (corner.pos[1] + y) << 4;
          p |= (corner.pos[0] + x) << 14;
          p = p >>> 0;

          // normal 3 bits
          let normalScaled = faces[k].normal * 5;
          normalScaled = normalScaled >>> 0;

          // uv { texIndex: 8bits, uv: 2 bits }
          const find = corner.uv;
          let uv = this.shaderUvs.findIndex((suv) => suv[0] === find[0] && suv[1] === find[1]);
          if (uv === -1) throw new Error(`Geometry Generator: Voxel (${x}, ${y}, ${z}) vertex uv not found.`);
          uv |= id << 2;
          uv = uv >>> 0;

          // vertex { position: 18 bits, normal: 3 bits, uv: 10 bits } : format { position - normal - uv }
          let vertex = uv | (normalScaled << 10) | (p << 13);
          vertex = vertex >>> 0;
          vertices.push(vertex);

          // check for errors in bitwise operations
          // const x1 = (vertex & 0x1e000000) >> 25;
          // const y1 = (vertex & 0x1fe0000) >> 17;
          // const z1 = (vertex & 0x1e000) >> 13;
          // const uv1 = vertex & 0x3;
          // const id1 = (vertex & 0x3fc) >> 2;
          // if (x1 !== corner.pos[0] + x) console.log("x: " + x1, corner.pos[0] + x);
          // if (y1 !== corner.pos[1] + y) console.log("y: " + y1, corner.pos[1] + y);
          // if (z1 !== corner.pos[2] + z) console.log("z: " + z1, corner.pos[2] + z);
          // if (uv1 !== find) console.log("uv: " + uv1, find);
          // if (id1 !== id) console.log("id: " + id1, id);
          // if (x === 0) console.log(vertex.toString(2));
          // console.log(vertex.toString(2));
        }

        indices.push(ndx, ndx + 1, ndx + 2, ndx, ndx + 2, ndx + 3);
        // console.log(indices, vertices);

        // for (const i of indices) {
        //   const x1 = (vertices[i] & 0x1e000000) >> 25;
        //   const y1 = (vertices[i] & 0x1fe0000) >> 17;
        //   const z1 = (vertices[i] & 0x1e000) >> 13;

        //   console.log(x1, y1, z1);
        // }
      }
    }

    return {
      vertices,
      indices,
    };
  }

  /**
   * Finds the neighbours of a voxel given it's containing chunk, the containing chunk's neighbours and the voxel position
   *
   * @param chunk The chunk which contains the voxel
   * @param cNeighbours The containing chunk's neighbours
   * @param x The x position of the voxel within its container chunk
   * @param y The y position of the voxel within its container chunk
   * @param z The z position of the voxel within its container chunk
   * @returns The voxel's neighbours
   */
  private getVoxelNeighbours(
    chunk: Uint8Array,
    cNeighbours: Neighbours<Uint8Array>,
    x: number,
    y: number,
    z: number
  ) {
    const neighbours: Neighbours<number> = {
      front:
        z - 1 >= 0
          ? chunk[from3Dto1D(x, y, z - 1, this.chunkSize, this.chunkHeight)]
          : cNeighbours.front[from3Dto1D(x, y, this.chunkSize - 1, this.chunkSize, this.chunkHeight)],
      back:
        z + 1 < this.chunkSize
          ? chunk[from3Dto1D(x, y, z + 1, this.chunkSize, this.chunkHeight)]
          : cNeighbours.back[from3Dto1D(x, y, 0, this.chunkSize, this.chunkHeight)],
      left:
        x - 1 >= 0
          ? chunk[from3Dto1D(x - 1, y, z, this.chunkSize, this.chunkHeight)]
          : cNeighbours.left[from3Dto1D(this.chunkSize - 1, y, z, this.chunkSize, this.chunkHeight)],
      right:
        x + 1 < this.chunkSize
          ? chunk[from3Dto1D(x + 1, y, z, this.chunkSize, this.chunkHeight)]
          : cNeighbours.right[from3Dto1D(0, y, z, this.chunkSize, this.chunkHeight)],
      top:
        y + 1 < this.chunkHeight
          ? chunk[from3Dto1D(x, y + 1, z, this.chunkSize, this.chunkHeight)]
          : undefined,
      bottom: y - 1 >= 0 ? chunk[from3Dto1D(x, y - 1, z, this.chunkSize, this.chunkHeight)] : undefined,
    };

    // if (!neighbours.right && cNeighbours.right)
    // console.log(from3Dto1D(0, y, z, this.chunkSize, this.chunkHeight));

    return neighbours;
  }

  /**
   * Gets the width and depth of each chunk
   *
   * @returns The size of each chunk
   */
  getSize() {
    return this.chunkSize;
  }

  /**
   * Gets the height of each chunk
   *
   * @returns The height of each chunk
   */
  getHeight() {
    return this.chunkHeight;
  }
}
