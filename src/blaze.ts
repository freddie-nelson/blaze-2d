import { glMatrix } from "gl-matrix";
import Color, { ColorLike } from "./utils/color";
import ThreadPool from "./threading/threadPool";
import { System } from "./system";
import TextureLoader from "./texture/loader";
import Renderer from "./renderer/renderer";
import validateZIndex from "./utils/validators";
import BatchRenderer from "./renderer/batchRenderer";
import Editor from "./editor/editor";
import Scene from "./scene";
import BlazeElement from "./ui/element";
import World from "./world";

import "./ui/styles/root.css";
import "./ui/styles/canvas.css";
import Logger from "./logger";
import TimeStep from "./timestep";
import FluidRenderer from "./renderer/fluidRenderer";
import RenderController from "./renderer/controller";

export interface BlazeOptions {
  antialias: boolean;
}

const defaultOpts: BlazeOptions = {
  antialias: true,
};

/**
 * Represents the Blaze engine.
 */
export default abstract class Blaze {
  /**
   * The webgl canvas used by blaze.
   */
  private static canvas: BlazeElement<HTMLCanvasElement>;

  /**
   * The color used to clear the {@link Renderer}.
   */
  private static bgColor = new Color("#000");

  /**
   * This value represents the number of Z positions that can be used within the world space.
   *
   * Allows the user to specify zIndexes as integer values (-1, 1, 2, 3) that are scaled into a -1.0 - 1.0 range.
   *
   * The higher this value the more zIndexes the camera will be able to see.
   */
  private static zLevels = 100;

  static renderController = new RenderController();

  private static systems: System[] = [];
  private static fixedSystems: System[] = [];

  private static threadPool = new ThreadPool();

  /**
   * The {@link TimeStep} for normal updates.
   */
  private static timeStep: TimeStep;

  /**
   * The minimum time in ms between each fixed update.
   */
  static fixedDt = 1000 / 60;

  /**
   * The maximum fixed delta time step in ms.
   *
   * If the time since the last fixed update exceeds this amount then it will be clamped.
   */
  static maxFixedDt = 1000 / 50;

  /**
   * The {@link TimeStep} for fixed updates.
   */
  private static fixedTimeStep: TimeStep;

  /**
   * The current {@link Scene}.
   */
  private static scene: Scene;

  /**
   * The editor.
   */
  static editor: Editor;

  /**
   * Initializes the engine and creates the renderer.
   *
   * @param canvas The canvas to use to create the renderer
   * @param opts The options to use when setting up the engine
   */
  static init(canvas: HTMLCanvasElement, opts: BlazeOptions = defaultOpts) {
    canvas.id = "blzCanvas";
    this.canvas = new BlazeElement(canvas);

    Renderer.init(canvas, { antialias: opts.antialias });
    TextureLoader.init(Renderer.getGL());

    this.renderController.addRenderers(Renderer, BatchRenderer, FluidRenderer);

    this.scene = new Scene();

    glMatrix.setMatrixArrayType(Array);
  }

  /**
   * Starts Blaze's update/render loop.
   *
   * i.e. calls `this.update`
   */
  static start() {
    this.timeStep = new TimeStep(performance.now(), 0, 0);
    this.fixedTimeStep = new TimeStep(performance.now(), 0, 0);

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
   * Update also updates the engine's current {@link Scene}.
   *
   * At the end of the update the {@link Renderer} queue is flushed, drawing anything that was queued for rendering during the frame.
   */
  static update() {
    requestAnimationFrame(() => this.update());

    this.nextTimestep();

    Renderer.clear(this.bgColor);

    this.scene?.world.update(this.timeStep);

    for (const system of this.systems) {
      system.update(this.timeStep);
    }

    this.renderController.flush();

    if (this.editor) this.editor.update();
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
   *
   * Fixed update also steps the {@link Physics} engine.
   */
  static fixedUpdate() {
    setTimeout(() => this.fixedUpdate(), this.fixedDt);

    this.nextTimestep(true);

    this.scene?.physics.update(this.fixedTimeStep);

    for (const system of this.fixedSystems) {
      system.update(this.fixedTimeStep);
    }
  }

  /**
   * Updates the engine's timestep to the current time.
   *
   * @param fixed Wether or not to set the fixed time step
   */
  private static nextTimestep(fixed = false) {
    const now = performance.now();

    if (!fixed) {
      const dt = (now - this.timeStep.time) / 1000;
      this.timeStep = new TimeStep(now, dt, this.timeStep.dt);
    } else {
      const dt = (now - this.fixedTimeStep.time) / 1000;
      this.fixedTimeStep = new TimeStep(now, Math.min(dt, this.maxFixedDt / 1000), this.fixedTimeStep.dt);
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
   * Gets the canvas used by blaze.
   *
   * @returns The {@link BlazeElement} for blaze's canvas
   */
  static getCanvas() {
    return this.canvas;
  }

  /**
   * Sets the engine's scene.
   *
   * @param scene The scene to use
   */
  static setScene(scene: Scene): void {
    if (!(scene instanceof Scene)) return void Logger.error("Blaze", "scene must be an instance of Scene.");

    this.scene = scene;
  }

  /**
   * Gets the engine's scene.
   *
   * @returns The engine's scene
   */
  static getScene() {
    return this.scene;
  }

  /**
   * Gets the current scene's {@link World}.
   *
   * @returns The current scene's world
   */
  static getWorld() {
    return this.scene?.world;
  }

  /**
   * Gets the current scene's {@link Physics} world.
   *
   * @returns THe current scene's physics world
   */
  static getPhysics() {
    return this.scene?.physics;
  }

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
  static setZLevels(zLevels: number): void {
    const valid = validateZIndex(zLevels);
    if (valid !== true) return void Logger.error("Blaze", valid);

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
   * Gets the {@link TimeStep} between each update.
   *
   * @returns The most recent fixed time step
   */
  static getTimeStep() {
    return this.timeStep;
  }

  /**
   * Gets the {@link TimeStep} between each fixed update.
   *
   * @returns The most recent fixed time step
   */
  static getFixedTimeStep() {
    return this.fixedTimeStep;
  }

  /**
   * Gets the current thread pool being used.
   *
   * @returns The thread pool in use by the engine
   */
  static getThreadPool() {
    return this.threadPool;
  }
}
