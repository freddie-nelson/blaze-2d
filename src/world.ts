import Entity from "./entity";
import { System } from "./system";

/**
 * Represents the 2D world.
 */
export default class World implements System {
  cellWidth = 10;
  cellHeight = 10;
  private gl: WebGL2RenderingContext;

  private entities: Entity[] = [];

  /**
   * Creates a {@link World} instance.
   *
   * @param cellWidth The width of each world cell in pixels
   * @param cellHeight The height of each world cell in pixels
   * @param gl The webgl context to use for rendering
   */
  constructor(cellWidth: number, cellHeight: number, gl: WebGL2RenderingContext) {
    this.cellWidth = cellWidth;
    this.cellHeight = cellHeight;
    this.gl = gl;
  }

  update(delta: number) {
    const cellClipSpace = this.getCellDimensionsClipSpace();

    for (const e of this.entities) {
      e.update();
      e.render(this.gl, cellClipSpace);
    }
  }

  /**
   * Calculates the world cell dimensions in clip space coordinates.
   *
   * @returns The world cell dimensions in clip space coordinates
   */
  getCellDimensionsClipSpace() {
    const width = this.gl.canvas.width;
    const height = this.gl.canvas.height;

    return {
      width: this.cellWidth / width,
      height: this.cellHeight / height,
    };
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
}
