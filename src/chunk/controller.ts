import { createShaderProgram, ShaderProgramInfo } from "../utils/gl";
import ChunkGenerator from "./generator";
import GeometryGenerator, { ChunkGeometry } from "./geometry";

import vsChunk from "../shaders/chunk/vertex.glsl";
import fsChunk from "../shaders/chunk/fragment.glsl";
import { mat4, vec2, vec3 } from "gl-matrix";
import Box from "../physics/box";
import Tilesheet from "../tilesheet";
import ThreadPool from "../threading/threadPool";
import Object3D, { Neighbours } from "../object3d";
import Camera from "../camera";
import { System } from "../system";

export interface ChunkControllerOptions {
  gl: WebGL2RenderingContext;
  object: Object3D;
  camera: Camera;
  renderDist: number;
  worldSize: number;
  chunksPerTick: number;
  bedrock: number;
  chunkSize?: number;
  chunkHeight?: number;
}

export interface Limits {
  lowerX: number;
  iterationsX: number;
  lowerY: number;
  iterationsY: number;
}

export type ChunkDrawingMode = 1 | 4; // WebGL2RenderingContext.LINES | WebGL2RenderingContext.TRIANGLES

export type Chunks = { [index: string]: Uint8Array };

/**
 * Chunk controller which manages all generation and rendering of chunks around a given object.
 *
 * Also handles multi-threading for geometry generation if created with a {@link ThreadPool} instance.
 */
export default class ChunkController implements System {
  private threadPool: ThreadPool;
  private chunkGenerator: ChunkGenerator;
  private geometryGenerator: GeometryGenerator;

  private object: Object3D; // object to center generation around
  private camera: Camera; // camera to use for rendering

  private height = 255;
  private size = 8;
  private bedrock: number;

  private worldSize: number;
  private renderDist: number;
  private generationDist: number;
  private chunkOffset: number;
  private renderOffset: number;

  private gl: WebGL2RenderingContext;
  private shader: WebGLProgram;
  private shaderProgramInfo: ShaderProgramInfo;
  private tilesheet: Tilesheet;

  private queue: { x: number; y: number }[] = [];
  private lastCenter: { x: number; y: number } = { x: NaN, y: NaN };
  private chunksPerTick: number;

  private chunks: Chunks = {};

  private geometry: { [index: string]: ChunkGeometry } = {};
  private pendingGeometry: { [index: string]: boolean } = {};
  private replaceGeometry: { [index: string]: boolean } = {};

  private verticesBuffer: WebGLBuffer;
  private indicesBuffer: WebGLBuffer;

  private renderQueue: string[] = [];
  private drawn = 0;
  private drawMode = WebGL2RenderingContext.TRIANGLES;

  /**
   * Creates a {@link ChunkController} instance and sets it up for use.
   *
   * @param opts The options to use when setting up the controller.
   * @param threadPool The thread pool to use for chunk geometry generation.
   */
  constructor(opts: ChunkControllerOptions, threadPool?: ThreadPool) {
    this.setupFromOptions(<ChunkControllerOptions>opts);

    if (threadPool) {
      this.threadPool = threadPool;
      threadPool.everyThread({
        task: "init-geometry-generator",
        data: new Uint16Array([this.size, this.height, 0]),
        // cb: () => console.log("init-geometry-generator"),
      });
    }

    this.verticesBuffer = this.gl.createBuffer();
    this.indicesBuffer = this.gl.createBuffer();
    this.setupShader(this.gl);
  }

  /**
   * Sets up the chunk controller from {@link ChunkControllerOptions}
   *
   * @param opts The options to use for setup
   */
  private setupFromOptions(opts: ChunkControllerOptions) {
    // validation checks
    if (opts.chunkSize && (opts.chunkSize < 1 || opts.chunkSize > 15))
      throw new Error("Chunk Controller: chunk size must be between 1 and 15 inclusive.");
    if (opts.chunkHeight && (opts.chunkHeight < 1 || opts.chunkHeight > 1023))
      throw new Error("Chunk Controller: chunk height must be between 1 and 1023 inclusive.");

    this.gl = opts.gl;
    this.object = opts.object;
    this.camera = opts.camera;
    this.setRenderDist(opts.renderDist);
    this.chunksPerTick = opts.chunksPerTick;
    this.worldSize = opts.worldSize;
    this.bedrock = opts.bedrock;
    if (opts.chunkSize) this.size = opts.chunkSize;
    if (opts.chunkHeight) this.height = opts.chunkHeight;

    this.chunkOffset = Math.floor(this.worldSize / 2);
    this.renderOffset = Math.floor(this.renderDist / 2);

    this.chunkGenerator = new ChunkGenerator({ height: this.height, size: this.size });
    this.geometryGenerator = new GeometryGenerator({
      chunkSize: this.size,
      chunkHeight: this.height,
      excludeList: new Uint8Array([0]),
    });
  }

  /**
   * Creates the chunk rendering vertex and fragment shaders.
   *
   * @param gl The webgl context to use when creating the shader
   */
  private setupShader(gl: WebGL2RenderingContext) {
    this.shader = createShaderProgram(gl, vsChunk, fsChunk);
    this.shaderProgramInfo = {
      program: this.shader,
      attribLocations: {
        vertex: gl.getAttribLocation(this.shader, "aVertex"),
      },
      uniformLocations: {
        projectionViewMatrix: gl.getUniformLocation(this.shader, "uProjectionViewMatrix"),
        modelMatrix: gl.getUniformLocation(this.shader, "uModelMatrix"),
        texture: gl.getUniformLocation(this.shader, "uTexture"),
        numOfTiles: gl.getUniformLocation(this.shader, "uNumOfTiles"),
      },
    };
  }

  /**
   * The controller's main update loop.
   *
   * Called every frame the main engine loop.
   */
  update() {
    const center = this.getChunk(this.object.getPosition());
    if (this.lastCenter.x !== center.x || this.lastCenter.y !== center.y) {
      this.lastCenter = center;

      this.queueChunks(center);
    }

    this.generateChunks();

    const renderLimits = {
      lowerX: center.x - this.renderOffset,
      iterationsX: this.renderDist,
      lowerY: center.y - this.renderOffset,
      iterationsY: this.renderDist,
    };

    this.generateGeometry(renderLimits);
    this.renderChunks();
  }

  /**
   * Queues chunks for generation around the provided `center`.
   *
   * Uses a modified BFS algorithm to produce queue with chunks ordered by distance from `center`
   *
   * @param center Center of generation algorithm
   */
  private queueChunks(center: { x: number; y: number }) {
    const start = { x: center.x - this.chunkOffset, y: center.y - this.chunkOffset };
    const startVec = vec2.fromValues(start.x, start.y);
    const maxDist = this.generationDist / 1.5;

    const queue = [start];
    const needsGeneration = [];
    if (!this.chunks[this.chunkKey(start.x, start.y)]) needsGeneration.push(start);

    let offset = 0;
    while (true) {
      const current = queue[offset];

      const ns = [];
      ns.push({ x: current.x - 1, y: current.y });
      ns.push({ x: current.x + 1, y: current.y });
      ns.push({ x: current.x, y: current.y - 1 });
      ns.push({ x: current.x, y: current.y + 1 });

      for (const n of ns) {
        if (queue.findIndex((c) => c.x === n.x && c.y === n.y) === -1) {
          if (this.chunks[this.chunkKey(n.x, n.y)]) queue.push(n);
          else {
            queue.push(n);
            needsGeneration.push(n);
          }
        }
      }

      offset++;
      const dist = vec2.dist(vec2.fromValues(queue[queue.length - 1].x, queue[queue.length - 1].y), startVec);
      if (offset >= queue.length || dist >= maxDist) break;
    }

    this.queue = needsGeneration;
  }

  /**
   * Generates chunks from the queue.
   *
   * Skips chunks that have data in `this.chunks` or breach the world size limits.
   *
   * @returns The keys for the chunks that were generated.
   */
  private generateChunks() {
    const generated: string[] = [];

    for (let i = 0; i < this.chunksPerTick && this.queue.length !== 0; i++) {
      const pos = this.queue.shift();
      const key = this.chunkKey(pos.x, pos.y);

      if (
        this.chunks[key] ||
        pos.x <= this.chunkOffset * -1 ||
        pos.x > this.chunkOffset ||
        pos.y <= this.chunkOffset * -1 ||
        pos.y > this.chunkOffset
      )
        continue;

      const c = this.chunkGenerator.generateChunk(pos);
      this.chunks[key] = c;
      generated.push(key);
    }

    return generated;
  }

  /**
   * Generates geometry for every chunk that requires it within the provided limits.
   *
   * Geometry is generated on the thread pool and falls back to the main thread when no pool is available.
   *
   * However, replacement geometry is always generated on the main thread.
   *
   * @param limits The chunk limits to check for needed geometry.
   */
  private generateGeometry(limits: Limits) {
    this.renderQueue = [];

    for (let y = limits.lowerY; y < limits.lowerY + limits.iterationsY; y++) {
      for (let x = limits.lowerX; x < limits.lowerX + limits.iterationsX; x++) {
        const pos = { x: x - this.chunkOffset, y: y - this.chunkOffset };
        const k = this.chunkKey(pos.x, pos.y);

        if (!this.geometry[k] || this.replaceGeometry[k]) {
          const neighbours = this.getChunkNeighbours(pos);
          const hasAllNeighbours = neighbours.left && neighbours.right && neighbours.front && neighbours.back;
          if (!hasAllNeighbours) continue;

          if (this.replaceGeometry[k]) {
            delete this.pendingGeometry[k];
            delete this.replaceGeometry[k];

            this.geometry[k] = this.geometryGenerator.convertGeoToTypedArrs(
              this.geometryGenerator.generateChunkGeometry(this.chunks[k], neighbours)
            );
          } else if (!this.pendingGeometry[k]) {
            if (this.threadPool) {
              this.pendingGeometry[k] = true;

              this.threadPool.requestThread({
                task: "chunk-geometry",
                data: { chunk: this.chunks[k], neighbours },
                cb: (geometry: ChunkGeometry) => {
                  // check if geometry was replaced while waiting
                  if (this.pendingGeometry[k]) {
                    this.geometry[k] = geometry;
                    delete this.pendingGeometry[k];
                  }
                },
              });

              continue;
            } else {
              this.geometry[k] = this.geometryGenerator.convertGeoToTypedArrs(
                this.geometryGenerator.generateChunkGeometry(this.chunks[k], neighbours)
              );
            }
          } else {
            continue;
          }
        }

        this.renderQueue.push(k);
      }
    }
  }

  /**
   * Renders all chunks in the render queue that have geometry.
   */
  private renderChunks() {
    this.drawn = 0;
    const gl = this.gl;
    const positionVec = vec3.create();

    // set texture if tilesheet exists
    if (this.tilesheet) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.tilesheet.texture);
    }

    for (const k of this.renderQueue) {
      // exit if geometry is still being generated on thread
      if (this.pendingGeometry[k]) continue;

      // calculate chunk position
      const position = this.chunkPos(k);
      vec3.set(positionVec, position.x * this.size, this.bedrock, position.y * this.size);

      this.renderChunk(this.geometry[k], positionVec);
    }
  }

  /**
   * Renders a chunk from it's geometry.
   *
   * A chunk is automatically culled if it is outside `this.camera`'s frustum.
   *
   * Overwrites the data in `this.verticesBuffer` and `this.indicesBuffer`
   *
   * @param geometry The chunk's geometry
   * @param position The world position of the chunk
   */
  private renderChunk(geometry: ChunkGeometry, position: vec3) {
    const gl = this.gl;
    const camera = this.camera;

    // calculate chunk position matrix
    const modelMatrix = mat4.create();
    mat4.fromTranslation(modelMatrix, position);

    // calculate projection view matrix
    const projectionViewMatrix = this.camera.getProjectionViewMatrix();

    // frustum cull
    if (!camera.frustum.containsBox(new Box(position, this.size, this.height, this.size))) {
      return;
    }
    this.drawn++;

    // put geometry data in buffers
    gl.bindBuffer(gl.ARRAY_BUFFER, this.verticesBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, geometry.vertices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indicesBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geometry.indices, gl.STATIC_DRAW);

    const numComponents = 1;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;

    // bind vertex buffer to shader
    gl.vertexAttribPointer(
      this.shaderProgramInfo.attribLocations.vertex,
      numComponents,
      type,
      normalize,
      stride,
      offset
    );
    gl.enableVertexAttribArray(this.shaderProgramInfo.attribLocations.vertex);

    gl.useProgram(this.shaderProgramInfo.program);

    // set uniform matrices
    gl.uniformMatrix4fv(
      this.shaderProgramInfo.uniformLocations.projectionViewMatrix,
      false,
      projectionViewMatrix
    );
    gl.uniformMatrix4fv(this.shaderProgramInfo.uniformLocations.modelMatrix, false, modelMatrix);

    // set texture uniforms if tilesheet exists
    if (this.tilesheet) {
      gl.uniform1i(this.shaderProgramInfo.uniformLocations.texture, 0);
      gl.uniform1f(this.shaderProgramInfo.uniformLocations.numOfTiles, this.tilesheet.numOfTiles);
    }

    gl.drawElements(this.drawMode, geometry.indices.length, gl.UNSIGNED_INT, 0);
  }

  /**
   * Tells the controller to regenerate a chunk's geometry.
   *
   * @param chunkLocation Coordinates of the chunk to refresh
   * @param refreshNeighbours Boolean representing wether the chunks neighbours should also be refreshed.
   */
  refreshChunk({ x, y }: { x: number; y: number }, refreshNeighbours = false) {
    this.replaceGeometry[this.chunkKey(x, y)] = true;

    if (refreshNeighbours) {
      this.replaceGeometry[this.chunkKey(x - 1, y)] = true;
      this.replaceGeometry[this.chunkKey(x + 1, y)] = true;
      this.replaceGeometry[this.chunkKey(x, y - 1)] = true;
      this.replaceGeometry[this.chunkKey(x, y + 1)] = true;
    }
  }

  /**
   * Tells the controller to regenerate the geometry of all chunk's in the render queue.
   */
  refreshAllChunks() {
    for (const c in this.geometry) {
      delete this.geometry[c];
    }

    for (const c in this.pendingGeometry) {
      delete this.pendingGeometry[c];
    }
  }

  /**
   * Calculates a chunk's neighbours from it's coordinates.
   *
   * @param pos The chunk's coordinates
   * @returns The chunk's neighbours
   */
  getChunkNeighbours({ x, y }: { x: number; y: number }) {
    const n = <Neighbours<Uint8Array>>{
      left: this.chunks[this.chunkKey(x - 1, y)],
      right: this.chunks[this.chunkKey(x + 1, y)],
      front: this.chunks[this.chunkKey(x, y - 1)],
      back: this.chunks[this.chunkKey(x, y + 1)],
    };

    // if (n.left && n.right && n.front && n.back) {
    //   console.log(x, y);
    //   console.log(n);
    // }

    return n;
  }

  /**
   * Gets the containing chunk coordinates from a world position.
   *
   * @param x
   * @param y
   * @param z
   * @returns The containing chunk coordinates
   */
  getChunk(position: vec3) {
    const x = Math.floor(position[0] / this.size + this.chunkOffset);
    const y = Math.floor(position[2] / this.size + this.chunkOffset);

    return {
      x,
      y,
    };
  }

  /**
   * Returns the chunk key from a set of chunk coordinates
   *
   * @param x
   * @param y
   * @returns The chunk key used to identify a chunk around the chunk controller
   */
  chunkKey(x: number, y: number) {
    return `${x} ${y}`;
  }

  /**
   * Returns the chunk coordinates from it's key
   *
   * @param key The chunk's key
   * @returns The chunk's coordinates
   */
  chunkPos(key: string) {
    const split = key.split(" ");
    if (split.length !== 2)
      return {
        x: NaN,
        y: NaN,
      };
    else
      return {
        x: Number(split[0]),
        y: Number(split[1]),
      };
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

  /**
   * Gets the bedrock level of each chunk
   *
   * @returns The bedrock level of each chunk
   */
  getBedrock() {
    return this.bedrock;
  }

  /**
   * Gets the dimensions and bedrock level of each chunk
   *
   * @returns The dimensions and bedrock level of each chunk
   */
  getChunkDimensions() {
    return {
      size: this.size,
      height: this.height,
      bedrock: this.bedrock,
    };
  }

  /**
   * Gets the world offset of rendered chunks.
   *
   * @returns The chunk offset
   */
  getChunkOffset() {
    return this.chunkOffset;
  }

  /**
   * Sets the controller's render distance and updates the generation distance.
   *
   * @param renderDist The new render distance to use
   */
  setRenderDist(renderDist: number) {
    this.renderDist = renderDist;
    this.generationDist = renderDist + 2;
  }

  /**
   * Gets the controller's render distance
   *
   * @returns The controller's render distance
   */
  getRenderDist() {
    return this.renderDist;
  }

  /**
   * Gets the controller's generation distance
   *
   * @returns The controller's generation distance
   */
  getGenerationDistance() {
    return this.generationDist;
  }

  /**
   * Sets chunksPerTick to the provided value.
   *
   * Issues a warning if a value above `navigator.hardwareConcurrency * 2` is provided.
   *
   * @param chunksPerTick The value to set `this.chunksPerTick` to
   */
  setChunksPerTick(chunksPerTick: number) {
    if (chunksPerTick > navigator.hardwareConcurrency * 2)
      console.warn(
        "Chunk Controller: It is advised not to set chunksPerTick to a number above `navigator.hardwareConcurrency * 2`."
      );

    this.chunksPerTick = chunksPerTick;
  }

  /**
   * Gets the maximum number of chunks the controller can generate per tick/update
   *
   * @returns The number of chunks that can be generated per tick
   */
  getChunksPerTick() {
    return this.chunksPerTick;
  }

  /**
   * Sets the loaded chunks the controller will use.
   *
   * **If the new chunks do not match the `size` and `height` set in the controller there will be bugs.**
   *
   * @param chunks The new chunks to use
   */
  setChunks(chunks: Chunks) {
    this.chunks = chunks;
    this.refreshAllChunks();
  }

  /**
   * Gets the map containing all loaded chunks.
   *
   * The map uses keys that match the format of keys from `this.chunkKey`
   *
   * @returns A map containing all loaded chunks
   */
  getChunks() {
    return this.chunks;
  }

  /**
   * Gets the map containing all cached chunk geometry.
   *
   * The map uses keys that match the format of keys from `this.chunkKey`
   *
   * @returns A map containing all cached chunk geometry
   */
  getGeometry() {
    return this.geometry;
  }

  /**
   * Sets the tilesheet to be used on the chunk controller.
   *
   * A tilesheet must match the layout: [TOP OF TILE], [SIDES OF TILE], [BOTTOM OF TILE], (repeat)
   *
   * For an example of a valid tilesheet [see here](https://raw.githubusercontent.com/freddie-nelson/blaze/master/dev/tilesheet.png)
   *
   * @param path A path or url to the tilesheet bitmap image (Supports `.jpg`, `.jpeg`, `.png`)
   * @param tileSize The width and height of each individual tile in the tilesheet
   * @param numOfTiles The number of different tiles in the tilesheet
   * @returns The set {@link Tilesheet} instance
   */
  setTilesheet(tilesheet: Tilesheet) {
    this.tilesheet = tilesheet;
  }

  /**
   * Gets the controller's current tilesheet.
   *
   * @returns The controller's current tilesheet
   */
  getTilesheet() {
    return this.tilesheet;
  }

  /**
   * Sets the controller's draw mode.
   *
   * @throws If the provided draw mode is not WebGL2RenderingContext.LINES or WebGL2RenderingContext.TRIANGLES
   *
   * @param drawMode The webgl drawing mode to set the controller's draw mode to
   */
  setDrawMode(drawMode: number) {
    if (drawMode !== WebGL2RenderingContext.LINES && drawMode !== WebGL2RenderingContext.TRIANGLES) {
      throw new Error(
        "Chunk Controller: Draw mode can only be set to WebGL2RenderingContext.LINES or WebGL2RenderingContext.TRIANGLES"
      );
    }

    this.drawMode = drawMode;
  }

  /**
   * Gets the controller's current drawing mode.
   *
   * @returns The controller's current drawing mode
   */
  getDrawMode() {
    return this.drawMode;
  }

  /**
   * Gets the number of chunks drawn in the most recent render call.
   *
   * @returns The number of chunks drawn last render call
   */
  getDrawn() {
    return this.drawn;
  }

  /**
   * Gets the number of chunks currently waiting for generation.
   *
   * @returns The number chunks in the queue
   */
  getQueueLength() {
    return this.queue.length;
  }

  /**
   * Gets the maximum number of chunks that could potentially be rendered.
   *
   * Data is from the most recent tick, so this number may become outdated in the next update call.
   *
   * @returns The number of chunks in the render queue
   */
  getRenderQueueLength() {
    return this.renderQueue.length;
  }

  /**
   * Gets the {@link ChunkGenerator} instance that the controller is using.
   *
   * @returns The controller's chunk generator.
   */
  getChunkGenerator() {
    return this.chunkGenerator;
  }

  /**
   * Gets the {@link GeometryGenerator} instance that the controller is using.
   *
   * @returns The controller's geometry generator.
   */
  getGeometryGenerator() {
    return this.geometryGenerator;
  }
}
