import { clear } from "./utils/gl";
import Debug from "./debug";
import { glMatrix } from "gl-matrix";
import Color, { ColorLike } from "./utils/color";
import ThreadPool from "./threading/threadPool";
import { System } from "./system";
import TextureLoader from "./texture/loader";
import Renderer from "./renderer/renderer";
import validateZIndex from "./utils/validators";
import BatchRenderer from "./renderer/batchRenderer";

export interface BlazeOptions {
  antialias: boolean;
}

const defaultOpts: BlazeOptions = {
  antialias: true,
};

export default abstract class Blaze {
  static debug: Debug;

  private static bgColor = new Color("#000");

  /**
   * This value represents the number of Z positions that can be used within the world space.
   *
   * Allows the user to specify zIndexes as integer values (-1, 1, 2, 3) that are scaled into a -1.0 - 1.0 range.
   *
   * The higher this value the more zIndexes the camera will be able to see.
   */
  private static zLevels = 100;

  private static systems: System[] = [];
  private static fixedSystems: System[] = [];

  private static threadPool = new ThreadPool();

  private static lastUpdateTime = performance.now();

  /**
   * The time since `lastUpdateTime`
   */
  private static delta = 0;

  private static lastFixedUpdateTime = performance.now();

  /**
   * The minimum time in ms between each fixed update.
   */
  private static fixedTimeStep = 1000 / 60;

  /**
   * The maximum delta time passed to each fixed update system.
   */
  private static maxFixedTimeStep = 1000 / 50;

  /**
   * The time since `lastFixedUpdateTime`
   */
  private static fixedDelta = 0;

  /**
   * Initializes the engine and creates the renderer.
   *
   * @param canvas The canvas to use to create the renderer
   * @param opts The options to use when setting up the engine
   */
  static init(canvas: HTMLCanvasElement, opts: BlazeOptions = defaultOpts) {
    Renderer.init(canvas, { antialias: opts.antialias });
    TextureLoader.init(Renderer.getGL());

    glMatrix.setMatrixArrayType(Array);
  }

  /**
   * Starts Blaze's update/render loop.
   *
   * i.e. calls `this.update`
   */
  static start() {
    this.lastUpdateTime = performance.now();
    this.lastFixedUpdateTime = this.lastUpdateTime;

    this.update();
    this.fixedUpdate();
  }

  /**
   * Blaze's update loop.
   *
   * Update is called on every animation frame using [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame).
   *
   * Update clears the {@link Renderer} with the set background color and calls `update` on any systems in `this.systems`.
   *
   * At the end of the update the {@link Renderer} queue is flushed, drawing anything that was queued for rendering during the frame.
   */
  static update() {
    requestAnimationFrame(() => this.update());

    const now = performance.now();
    const delta = (now - this.lastUpdateTime) / 1000;
    this.delta = delta;
    this.lastUpdateTime = now;

    Renderer.clear(this.bgColor);

    for (const system of this.systems) {
      system.update(delta);
    }

    BatchRenderer.flush();
    Renderer.flush();

    if (Debug.show) Debug.update(delta);
  }

  /**
   * Blaze's fixed update loop.
   *
   * Fixed update is called every `this.fixedTimeStep`ms using [setTimeout](https://developer.mozilla.org/en-US/docs/Web/API/setTimeout),
   * due to how the JS event loop works and any other tasks being ran on the main thread this may not always be the case.
   *
   * To account for the possible variations in time between each update a seperate delta time value is calculated for the fixed update loop.
   *
   * Fixed update calls `update` on all systems in `this.fixedSystems`.
   */
  static fixedUpdate() {
    setTimeout(() => this.fixedUpdate(), this.fixedTimeStep);

    const now = performance.now();
    const delta = Math.min((now - this.lastFixedUpdateTime) / 1000, this.maxFixedTimeStep);
    this.fixedDelta = delta;
    this.lastFixedUpdateTime = now;

    for (const system of this.fixedSystems) {
      system.update(delta);
    }
  }

  /**
   * Gets the systems added to the engine.
   *
   * @returns The engine's top level systems
   */
  static getSystems() {
    return this.systems;
  }

  /**
   * Gets the fixed systems added to the engine.
   *
   * @returns The engine's fixed systems
   */
  static getFixedSystems() {
    return this.fixedSystems;
  }

  /**
   * Adds a system to the engine.
   *
   * @param system The system to add
   * @param fixed Wether the system will run in the fixed update or normal update loop
   */
  static addSystem(system: System, fixed = false) {
    if (fixed) this.fixedSystems.push(system);
    else this.systems.push(system);
  }

  /**
   * Removes a system from the engine.
   *
   * Will search for the system in both the fixed and normal system arrays.
   *
   * If the system is in both the fixed and normal system arrays then it will only
   * be removed from the normal array. Another call to removeSystem will remove it
   * from the fixed array.
   *
   * @param system The system to remove
   * @returns Wether or not the system was removed
   */
  static removeSystem(system: System) {
    let i = this.systems.findIndex((s) => s === system);
    if (i !== -1) {
      this.systems.splice(i, 1);
      return true;
    }

    i = this.fixedSystems.findIndex((s) => s === system);
    if (i !== -1) {
      this.fixedSystems.splice(i, 1);
      return true;
    }

    return false;
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
  static setBgColor(color: Color): Color;

  /**
   * Sets the clear color to be used when clearing the webgl buffer, mimics having a bg color.
   *
   * @param color The {@link ColorLike} representation to use when instantiating the bg color
   * @returns The set {@link Color} instance
   */
  static setBgColor(color: ColorLike): Color;

  static setBgColor(color: Color | ColorLike): Color {
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
  static getBgColor(): Color {
    return this.bgColor;
  }

  /**
   * Sets the amount of zLevels the engine (physics, world, renderer) will use.
   *
   * @throws When zLevels is < 0 or zLevels is a floating point number.
   *
   * @param zLevels The number to set zLevels to
   */
  static setZLevels(zLevels: number) {
    const valid = validateZIndex(zLevels);
    if (valid !== true) throw new Error(valid);

    this.zLevels = zLevels;
  }

  /**
   * Gets the current number of zLevels the engine is set to support.
   *
   * @returns The number of zLevels for the engine
   */
  static getZLevels(): number {
    return this.zLevels;
  }

  /**
   * Gets the time of the last update, measured from the time the page started to load.
   *
   * @see Uses [performance.now](https://developer.mozilla.org/en-US/docs/Web/API/Performance/now)
   *
   * @returns The time of the last update
   */
  static getLastUpdateTime() {
    return this.lastUpdateTime;
  }

  /**
   * Gets the time since the last update, measured in ms.
   *
   * @returns The time since the last update
   */
  static getDelta() {
    return this.delta;
  }

  /**
   * Set the minimum time step between each fixed update in ms.
   *
   * @param step The time step in ms
   */
  static setFixedTimeStep(step: number) {
    this.fixedTimeStep = step;
  }

  /**
   * Get the time step between each fixed update.
   *
   * @returns The fixed time step in ms
   */
  static getFixedTimeStep() {
    return this.fixedTimeStep;
  }

  /**
   * Gets the time of the last fixed update, measured from the time the page started to load.
   *
   * @see Uses [performance.now](https://developer.mozilla.org/en-US/docs/Web/API/Performance/now)
   *
   * @returns The time of the last fixed update
   */
  static getLastFixedUpdateTime() {
    return this.lastFixedUpdateTime;
  }

  /**
   * Gets the time since the last fixed update, measured in ms.
   *
   * @returns The time since the last fixed update
   */
  static getFixedDelta() {
    return this.fixedDelta;
  }

  /**
   * Gets the current thread pool being used.
   *
   * @returns The thread pool in use by the engine
   */
  static getThreadPool() {
    return this.threadPool;
  }

  /**
   * Enables/disables the debug menu.
   */
  static toggleDebug() {
    Debug.init();
    Debug.toggle();
  }
}
