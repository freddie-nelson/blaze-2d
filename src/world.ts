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

/**
 * Represents the 2D world.
 */
export default class World implements System {
  cellSize: vec2;
  useBatchRenderer = false;

  private camera: Camera;
  private entities: Entity[] = [];

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
        if (canvas.width === this.camera.viewport.getWidth() && canvas.height === this.camera.viewport.getHeight())
          return;

        this.camera.viewport = new Viewport(this.camera.getPosition(), canvas.width, canvas.height);
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
   * @param delta Time since last frame
   */
  update(delta: number) {
    this.camera.update();

    // update entities
    for (const e of this.entities) {
      e.update(delta);

      if (this.camera.viewport.containsRectCollider(e.collider as RectCollider, this.getWorldToPixelSpace())) {
      }
    }

    // render entities
    this.renderEntities();
  }

  /**
   * Renders the entities in the world using the world's current camera.
   *
   * If `this.useBatchRenderer` is true then the batch renderer will be used, otherwise the
   * entities will be sorted by zIndex and rendered normally.
   *
   * Draw calls are sent before this function terminates.
   *
   * @param delta Time since last frame
   */
  renderEntities() {
    const worldToClipSpace = this.getWorldtoClipSpace();

    Renderer.setMode("TRIANGLES");
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
   * Gets the world cell location of a pixel on the screen.
   *
   * This is calculated using the viewport of the world camera.
   *
   * @param pixel A pixel position on the screen
   */
  getCellFromPixel(pixel: vec2) {
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
   * Gets all entities currently in the world.
   *
   * @returns All entites in the world
   */
  getEntities() {
    return this.entities;
  }

  /**
   * Adds an entity to the world.
   *
   * @param entity The entity to add
   */
  addEntity(entity: Entity) {
    this.entities.push(entity);
  }

  /**
   * Removes an entity from the world.
   *
   * @param entity The entity to remove
   * @returns Wether or not the entity was removed
   */
  removeEntity(entity: Entity) {
    const i = this.entities.findIndex((e) => e === entity);
    if (i === -1) return false;

    this.entities.splice(i, 1);
    return true;
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
