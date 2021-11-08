import { createRenderer, resizeRendererToCanvas } from "./renderer";
import { clear } from "./utils/gl";
import Debug from "./debug";
import { glMatrix } from "gl-matrix";
import Color, { ColorLike } from "./utils/color";
import ThreadPool from "./threading/threadPool";
import { System } from "./system";
import Camera from "./camera/camera";
import Player from "./player";
import TextureLoader from "./texture/loader";

export interface BlazeOptions {
  antialias: boolean;
}

const defaultOpts: BlazeOptions = {
  antialias: false,
};

export default class Blaze {
  gl: WebGL2RenderingContext;
  private resolutionScale = 1;

  debug: Debug;

  private bgColor = new Color("#000");

  private systems: System[] = [];
  private threadPool = new ThreadPool();

  private lastUpdateTime = performance.now();

  /**
   * Initializes the engine and creates the renderer.
   *
   * @param canvas The canvas to use to create the renderer
   * @param opts The options to use when setting up the engine
   */
  constructor(canvas: HTMLCanvasElement, opts: BlazeOptions = defaultOpts) {
    const gl = createRenderer(canvas, { antialias: opts.antialias });
    this.gl = gl;

    TextureLoader.init(gl);

    window.addEventListener("resize", () => {
      resizeRendererToCanvas(gl, this.resolutionScale);
    });

    glMatrix.setMatrixArrayType(Array);
  }

  /**
   * Starts Blaze's update/render loop.
   *
   * i.e. calls `this.update`
   */
  start() {
    this.update();
  }

  /**
   * Blaze's global update loop.
   *
   * Controls updating and rendering of all objects, entities and chunks.
   *
   * Also calls any before and after update hooks.
   */
  private update() {
    requestAnimationFrame(() => this.update());
    const delta = (performance.now() - this.lastUpdateTime) / 1000;
    this.lastUpdateTime = performance.now();

    clear(this.gl, this.bgColor);

    for (const system of this.systems) {
      system.update(delta);
    }

    if (this.debug) this.debug.update(delta);
  }

  /**
   * Gets the systems running at the top level of the engine.
   *
   * @returns The engine's top level systems
   */
  getSystems() {
    return this.systems;
  }

  /**
   * Adds a system to the top level of the engine.
   *
   * @param system The system to add
   */
  addSystem(system: System) {
    this.systems.push(system);
  }

  /**
   * Removes a system from the top level of the engine.
   *
   * @param system The system to remove
   * @returns Wether or not the system was removed
   */
  removeSystem(system: System) {
    const i = this.systems.findIndex((s) => s === system);
    if (i === -1) return false;

    this.systems.splice(i, 1);
    return true;
  }

  /**
   * Sets the resolution scale to use when rendering.
   *
   * The width and height of the renderer canvas are set to `clientWidth * resolutionScale` and `clientHeight * resolutionScale` respectively.
   *
   * @param resolutionScale The new resolution scale to use
   */
  setResolutionScale(resolutionScale: number) {
    if (resolutionScale <= 0) throw new Error("Blaze: Resolution scale must be a number greater than 0.");

    this.resolutionScale = resolutionScale;
    resizeRendererToCanvas(this.gl, resolutionScale);
  }

  /**
   * Gets the renderer's current resolution scale.
   *
   * @returns The renderer's current resolution scale
   */
  getResolutionScale() {
    return this.resolutionScale;
  }

  /**
   * Gets the engine's current chunk controller.
   *
   * @returns The engine's current chunk controller or undefined
   */
  // getChunkController(): ChunkController {
  //   return <ChunkController>this.systems[this.systems.findIndex((s) => s instanceof ChunkController)];
  // }

  // /**
  //  * Sets the engine's chunk controller from a {@link ChunkController} instance.
  //  *
  //  * @param c The {@link ChunkController} instance to set the engine's chunk controller to
  //  * @returns The set {@link ChunkController} instance
  //  */
  // setChunkController(c: ChunkController): ChunkController;

  // /**
  //  * Sets the engine's chunk controller from a {@link ChunkControllerOptions} object.
  //  *
  //  * @param opts The options to use when instantiating the chunk controller
  //  * @returns The set {@link ChunkController} instance
  //  */
  // setChunkController(opts: ChunkControllerOptions): ChunkController;

  // setChunkController(c: ChunkController | ChunkControllerOptions) {
  //   if (c instanceof ChunkController) {
  //     this.chunkController = c;
  //   } else {
  //     this.chunkController = new ChunkController(c, this.threadPool);
  //   }

  //   return this.chunkController;
  // }

  // /**
  //  * Sets the tilesheet to be used on the engine's current chunk controller.
  //  *
  //  * A tilesheet must match the layout: [TOP OF TILE], [SIDES OF TILE], [BOTTOM OF TILE], (repeat)
  //  *
  //  * For an example of a valid tilesheet [see here](https://raw.githubusercontent.com/freddie-nelson/blaze/master/dev/tilesheet.png)
  //  *
  //  * @param path A path or url to the tilesheet bitmap image (Supports `.jpg`, `.jpeg`, `.png`)
  //  * @param tileSize The width and height of each individual tile in the tilesheet
  //  * @param numOfTiles The number of different tiles in the tilesheet
  //  * @returns The set {@link Tilesheet} instance
  //  *
  //  * @throws If the engine's chunk controller has not been set
  //  */
  // setTilesheet(path: string, tileSize: number, numOfTiles: number) {
  //   if (!this.chunkController)
  //     throw new Error("You must init the chunk controller before setting a tilesheet.");

  //   this.chunkController.setTilesheet(new Tilesheet(this.gl, path, tileSize, numOfTiles));
  // }

  // /**
  //  * Returns the engine's current tilesheet, if it exists.
  //  *
  //  * @returns The {@link Tilesheet} instance or undefined
  //  */
  // getTilesheet(): Tilesheet {
  //   return this.chunkController.getTilesheet();
  // }

  /**
   * Sets the clear color to be used when clearing the webgl buffer, mimics having a bg color.
   *
   * @param color The {@link Color} instance to set the engine's bg color to
   * @returns The set {@link Color} instance
   */
  setBgColor(color: Color): Color;

  /**
   * Sets the clear color to be used when clearing the webgl buffer, mimics having a bg color.
   *
   * @param color The {@link ColorLike} representation to use when instantiating the bg color
   * @returns The set {@link Color} instance
   */
  setBgColor(color: ColorLike): Color;

  setBgColor(color: Color | ColorLike): Color {
    if (color instanceof Color) {
      this.bgColor = color;
    } else {
      this.bgColor = new Color(color);
    }

    return this.bgColor;
  }

  /**
   * Gets the engine's current bg color.
   *
   * @returns The engine's current bg color
   */
  getBgColor(): Color {
    return this.bgColor;
  }

  /**
   * Gets the time of the last update, measured from the time the page started to load.
   *
   * @see Uses [performance.now](https://developer.mozilla.org/en-US/docs/Web/API/Performance/now)
   *
   * @returns The time of the last update
   */
  getLastUpdateTime() {
    return this.lastUpdateTime;
  }

  /**
   * Gets the current thread pool being used.
   *
   * @returns The thread pool in use by the engine
   */
  getThreadPool() {
    return this.threadPool;
  }

  /**
   * Enables/disables the debug menu.
   */
  toggleDebug() {
    if (!this.debug) this.debug = new Debug(this);
    else {
      this.debug.dispose();
      this.debug = undefined;
    }
  }
}
