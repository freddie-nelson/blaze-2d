import { vec2 } from "gl-matrix";
import Camera from "./camera/camera";
import Entity from "./entity";
import Box from "./physics/box";
import Physics from "./physics/physics";
import BatchRenderer from "./renderer/batchRenderer";
import Renderer from "./renderer/renderer";
import { System } from "./system";

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

    const renderQueue: Entity[] = [];

    for (const e of this.entities) {
      e.update();
      if (this.camera.viewport.containsBox(e.bounds as Box, this.getWorldToPixelSpace())) {
        if (this.useBatchRenderer) renderQueue.push(e);
        else e.render(this.camera, worldCellToClipSpaceScale);
      }
    }

    if (this.useBatchRenderer)
      BatchRenderer.renderEntities(this.entities, this.camera, 0, worldCellToClipSpaceScale);
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

  getWorldToPixelSpace() {
    const v = vec2.clone(this.cellSize);
    return v;
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
