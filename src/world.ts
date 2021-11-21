import { vec2 } from "gl-matrix";
import Camera from "./camera/camera";
import Entity from "./entity";
import Box from "./physics/box";
import Physics from "./physics/physics";
import BatchRenderer from "./renderer/batchRenderer";
import Renderer from "./renderer/renderer";
import Rect from "./shapes/rect";
import { System } from "./system";
import Texture from "./texture/texture";
import Color, { RGBAColor } from "./utils/color";

/**
 * Represents the 2D world.
 */
export default class World implements System {
  cellSize: vec2;
  useBatchRenderer = false;

  private camera: Camera;
  private entities: Entity[] = [];

  debug = false;

  /**
   * Creates a {@link World} instance.
   *
   * @param cellSize The width and height of each world cell in pixels
   * @param cameraViewport The width and height of the camera's viewport in pixels
   */
  constructor(cellSize: vec2, cameraViewport: vec2) {
    this.cellSize = cellSize;
    this.camera = new Camera(vec2.fromValues(0, 0), cameraViewport[0], cameraViewport[1]);
  }

  update(delta: number) {
    const worldToClipSpaceScale = this.getWorldtoClipSpaceScale();
    const worldCellToClipSpaceScale = vec2.fromValues(
      this.cellSize[0] * worldToClipSpaceScale[0],
      this.cellSize[1] * worldToClipSpaceScale[1]
    );

    this.camera.update();

    const renderQueue: { [index: string]: Entity[] } = {};
    Renderer.setMode("TRIANGLES");
    Renderer.useCamera(this.camera);

    for (const e of this.entities) {
      e.update(delta);

      if (this.camera.viewport.containsBox(e.bounds as Box, this.getWorldToPixelSpace())) {
        if (this.useBatchRenderer) {
          const z = e.getZIndex();

          if (renderQueue[z]) renderQueue[z].push(e);
          else renderQueue[z] = [e];
        } else {
          e.render(worldCellToClipSpaceScale);
        }
      }
    }

    if (this.useBatchRenderer)
      for (const zIndex of Object.keys(renderQueue).sort((a, b) => Number(a) - Number(b))) {
        BatchRenderer.renderEntities(renderQueue[zIndex], Number(zIndex), worldCellToClipSpaceScale);
      }

    if (this.debug) {
      // Renderer.setMode("LINES");

      for (const e of this.entities) {
        const rect = new Rect(e.bounds.getWidth(), e.bounds.getHeight(), e.getPosition(), e.getRotation());

        const rgba: RGBAColor = {
          r: 255,
          g: 0,
          b: 0,
          a: 0.2,
        };
        rect.texture = new Texture(new Color(rgba));

        Renderer.renderRect(rect, undefined, undefined, undefined, worldCellToClipSpaceScale);
      }
    }
  }

  /**
   * Calculates the world space to clip space scale.
   *
   * @returns The number that multiplying a world space coordinate by provides the equivalent clip space coordinate.
   */
  getWorldtoClipSpaceScale() {
    const width = this.camera.viewport.getWidth();
    const height = this.camera.viewport.getHeight();

    return vec2.fromValues(2 / width, 2 / height);
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
    const v = vec2.fromValues(1 / this.cellSize[0], 1 / this.cellSize[1]);
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
    const p = vec2.fromValues(pixel[0] - view.getWidth() / 2, view.getHeight() / 2 - pixel[1]);

    const pixelToWorld = this.getPixelToWorldSpace();
    const world = vec2.fromValues(p[0] * pixelToWorld[0], p[1] * pixelToWorld[1]);

    // get world position inside current view
    const center = this.camera.getPosition();
    vec2.add(world, world, center);

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
