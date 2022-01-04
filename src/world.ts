import { vec2 } from "gl-matrix";
import Blaze from "./blaze";
import Camera from "./camera/camera";
import Entity from "./entity";
import RectCollider from "./physics/collider/rect";
import CircleCollider from "./physics/collider/circle";
import BatchRenderer from "./renderer/batchRenderer";
import Renderer from "./renderer/renderer";
import Circle from "./shapes/circle";
import Rect from "./shapes/rect";
import { System } from "./system";
import Texture from "./texture/texture";
import Color, { RGBAColor } from "./utils/color";
import Viewport from "./camera/viewport";
import Logger from "./logger";
import TimeStep from "./timestep";
import Fluid from "./physics/fluid/fluid";

export type EntityListener = (event: "add" | "remove", entity: Entity, index: number, entities: Entity[]) => void;

/**
 * Represents the 2D world.
 */
export default class World implements System {
  cellSize: vec2;
  useBatchRenderer = false;

  private camera: Camera;
  private entities: Entity[] = [];
  private fluids: Fluid[] = [];

  /**
   * Callbacks which are fired whenever an entity is added or removed.
   */
  private entityListeners: EntityListener[] = [];

  /**
   * Creates a {@link World} instance.
   *
   * @param cellSize The width and height of each world cell in pixels
   * @param cameraViewport The width and height of the camera's viewport in pixels
   */
  constructor(cellSize: vec2, cameraViewport: vec2);

  /**
   * Creates a {@link World} instance with a dynamic viewport that resizes to the  {@link Renderer}'s dimensions.
   *
   * @param cellSize The width and height of each world cell in pixels
   */
  constructor(cellSize: vec2);

  constructor(cellSize: vec2, cameraViewport?: vec2) {
    this.cellSize = cellSize;

    if (!cameraViewport) {
      const canvas = Renderer.getGL().canvas;
      this.camera = new Camera(vec2.fromValues(0, 0), canvas.width, canvas.height);

      // setup resize observer
      const observer = new ResizeObserver((entries) => {
        if (
          canvas.clientWidth === this.camera.viewport.getWidth() &&
          canvas.clientHeight === this.camera.viewport.getHeight()
        )
          return;

        this.camera.viewport = new Viewport(this.camera.getPosition(), canvas.clientWidth, canvas.clientHeight);
        this.camera.setZoom(this.camera.getZoom());
      });
      observer.observe(canvas);
    } else {
      this.camera = new Camera(vec2.fromValues(0, 0), cameraViewport[0], cameraViewport[1]);
    }
  }

  /**
   * Updates the world's camera, terrain and entities.
   *
   * Also calls the render function.
   *
   * @param ts The {@link TimeStep} for this update
   */
  update(ts: TimeStep) {
    this.camera.update();

    // update entities
    for (const e of this.entities) {
      e.update(ts.dt);

      if (this.camera.viewport.containsRectCollider(e.collider as RectCollider, this.getWorldToPixelSpace())) {
      }
    }

    // rendering
    this.renderEntities();
    this.renderFluids();
  }

  /**
   * Renders the entities in the world using the world's current camera.
   */
  renderEntities() {
    const worldToClipSpace = this.getWorldtoClipSpace();

    // Renderer.setMode("TRIANGLES");
    Renderer.useCamera(this.camera);
    Renderer.setScale(worldToClipSpace);

    if (this.useBatchRenderer) {
      for (const e of this.entities) {
        BatchRenderer.queueEntity(e, e.getZIndex());
      }
    } else {
      for (const e of this.entities) {
        e.render();
      }
    }
  }

  /**
   * Renders the fluids in the world using the world's current camera.
   */
  renderFluids() {
    const worldToClipSpace = this.getWorldtoClipSpace();

    // Renderer.setMode("TRIANGLES");
    Renderer.useCamera(this.camera);
    Renderer.setScale(worldToClipSpace);

    for (const fluid of this.fluids) {
      fluid.render();
    }
  }

  /**
   * Calculates the world space to clip space scale.
   *
   * @returns The number that multiplying a world space coordinate by provides the equivalent clip space coordinate.
   */
  getWorldtoClipSpace() {
    const width = this.camera.viewport.getWidth();
    const height = this.camera.viewport.getHeight();

    return vec2.fromValues((this.cellSize[0] * 2) / width, (this.cellSize[1] * 2) / height);
  }

  /**
   * Calculates the world space to pixel space scale.
   *
   * @returns The number that multiplying a world space coordinate by provides the equivalent pixel space coordinate.
   */
  getWorldToPixelSpace() {
    const v = vec2.clone(this.cellSize);
    return v;
  }

  /**
   * Calculates the pixel space to world space scale.
   *
   * @returns The number that multiplying a pixel space coordinate by provides the equivalent world space coordinate.
   */
  getPixelToWorldSpace() {
    const zoom = this.camera.getZoom();
    const cellSize = vec2.scale(vec2.create(), this.cellSize, zoom);

    const v = vec2.fromValues(1 / cellSize[0], 1 / cellSize[1]);
    return v;
  }

  /**
   * Gets the world location of a pixel on the screen.
   *
   * This is calculated using the viewport of the world camera.
   *
   * @param pixel A pixel position on the screen
   */
  getWorldFromPixel(pixel: vec2) {
    const view = this.camera.viewport;
    const vw = view.getOriginalWidth();
    const vh = view.getOriginalHeight();

    const p = vec2.fromValues(pixel[0] - vw / 2, vh / 2 - pixel[1]);

    const pixelToWorld = this.getPixelToWorldSpace();
    const world = vec2.fromValues(p[0] * pixelToWorld[0], p[1] * pixelToWorld[1]);

    // get world position inside current view
    const centre = this.camera.getPosition();
    vec2.add(world, world, centre);
    vec2.rotate(world, world, centre, -this.camera.getRotation());

    return world;
  }

  /**
   * Gets the pixel coordinate of a world location.
   *
   * This is calculated using the viewport of the world camera.
   *
   * @param world A world position
   */
  getPixelFromWorld(world: vec2) {
    const centre = this.camera.getPosition();
    const pos = vec2.rotate(vec2.create(), world, centre, this.camera.getRotation());
    vec2.sub(pos, pos, centre);

    const worldToPixel = this.getWorldToPixelSpace();
    const pixel = vec2.fromValues(pos[0] * worldToPixel[0], pos[1] * worldToPixel[1]);

    const view = this.camera.viewport;
    const vw = view.getOriginalWidth();
    const vh = view.getOriginalHeight();

    return vec2.fromValues(pixel[0] + vw / 2, vh / 2 - pixel[1]);
  }

  /**
   * Gets all entities currently in the world.
   *
   * @returns All entites in the world
   */
  getEntities() {
    return this.entities;
  }

  /**
   * Gets all entities with the given name.
   *
   * @param name The name of the entity
   */
  getEntitiesByName(name: string) {
    return this.getEntities().filter((entity) => entity.name === name);
  }

  /**
   * Adds an entity to the world.
   *
   * @param entity The entity to add
   * @param fireListeners Wether or not to execute the world's entity listeners
   */
  addEntity(entity: Entity, fireListeners = true) {
    this.entities.push(entity);
    if (fireListeners) this.callEntityListeners("add", entity, this.entities.length - 1);
  }

  /**
   * Adds the given entities to the world.
   *
   * By default entity listeners are fired for each entity added however, if the last argument
   * passed to this function is a boolean then it will be used to decide wether or not to fire entity listeners.
   *
   * @param entities The entities to add
   */
  addEntities(...entities: (Entity | boolean)[]) {
    let fireListeners = true;
    if (typeof entities[entities.length - 1] === "boolean") {
      fireListeners = <any>entities[entities.length - 1];
      entities.pop();
    }

    entities.forEach((entity) => {
      if (typeof entity === "boolean") return;

      this.addEntity(entity, fireListeners);
    });
  }

  /**
   * Removes an entity from the world.
   *
   * @param entity The entity to remove
   * @param fireListeners Wether or not to execute the world's entity listeners
   * @returns Wether or not the entity was removed
   */
  removeEntity(entity: Entity, fireListeners = true) {
    const i = this.entities.findIndex((e) => e === entity);
    if (i === -1) return false;

    this.entities.splice(i, 1);
    if (fireListeners) this.callEntityListeners("remove", entity, i);
    return true;
  }

  private callEntityListeners(event: "add" | "remove", entity: Entity, index: number) {
    for (const l of this.entityListeners) {
      l(event, entity, index, this.entities);
    }
  }

  /**
   * Adds a callback which will be called whenever an entity is added or removed from the world.
   *
   * @param listener The listener to add
   */
  addEntityListener(listener: EntityListener) {
    this.entityListeners.push(listener);
  }

  /**
   * Removes an {@link EntityListener} from the world.
   *
   * @param listener The listener to remove
   */
  removeEntityListener(listener: EntityListener) {
    const index = this.entityListeners.findIndex((l) => l === listener);
    if (index === -1) return;

    this.entityListeners.splice(index, 1);
  }

  /**
   * Adds a fluid to the world.
   *
   * @param fluid The fluid to add
   */
  addFluid(fluid: Fluid) {
    this.fluids.push(fluid);
  }

  /**
   * Removes a fluid from the world.
   *
   * @param fluid The fluid to remove
   */
  removeFluid(fluid: Fluid) {
    const index = this.fluids.findIndex((f) => f === fluid);
    if (index === -1) return;

    this.fluids.splice(index, 1);
  }

  /**
   * Sets the camera to use for rendering.
   *
   * @param camera The camera to use for rendering
   */
  useCamera(camera: Camera) {
    this.camera = camera;
  }

  /**
   * Gets the camera that is currently being used for rendering.
   *
   * @returns The camera that is currently being used for rendering
   */
  getCamera() {
    return this.camera;
  }
}
