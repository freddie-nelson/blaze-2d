import { vec2 } from "gl-matrix";
import Blaze from "./blaze";
import Camera from "./camera/camera";
import Entity from "./entity";
import BoxCollider from "./physics/collider/box";
import CircleCollider from "./physics/collider/circle";
import BatchRenderer from "./renderer/batchRenderer";
import Renderer from "./renderer/renderer";
import Circle from "./shapes/circle";
import Rect from "./shapes/rect";
import { System } from "./system";
import Texture from "./texture/texture";
import Color, { RGBAColor } from "./utils/color";

const debugRGBA: RGBAColor = {
  r: 255,
  g: 0,
  b: 0,
  a: 0.2,
};
const debugTexture = new Texture(new Color(debugRGBA));

/**
 * Map to store data which belongs to certain z indexes of the world.
 */
interface ZMap<T> {
  [index: number]: T;
  max?: number;
  min?: number;
}

/**
 * Represents the 2D world.
 */
export default class World implements System {
  cellSize: vec2;
  useBatchRenderer = false;

  private camera: Camera;
  private entities: Entity[] = [];

  debug = false;
  debugTexture = debugTexture;

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

  /**
   * Updates the world's camera, terrain and entities.
   *
   * Also calls the render function.
   *
   * @param delta Time since last frame
   */
  update(delta: number) {
    const worldToClipSpace = this.getWorldtoClipSpace();

    this.camera.update();

    // z map of visible entities
    const entityZMap: ZMap<Entity[]> = {
      max: 0,
      min: Blaze.getZLevels(),
    };

    // update entities and construct z map
    for (const e of this.entities) {
      e.update(delta);

      if (this.camera.viewport.containsBoxCollider(e.collider as BoxCollider, this.getWorldToPixelSpace())) {
        // add entity to z map
        const z = e.getZIndex();
        if (entityZMap[z]) entityZMap[z].push(e);
        else entityZMap[z] = [e];

        // update z map min and max
        if (z > entityZMap.max) {
          entityZMap.max = z;
        } else if (z < entityZMap.min) {
          entityZMap.min = z;
        }
      }
    }

    // render entities
    this.renderEntities(entityZMap);

    // debug tooling
    if (this.debug) {
      // Renderer.setMode("LINES");

      for (const e of this.entities) {
        // draw entity bounding boxes (colliders)
        if (e.collider instanceof BoxCollider) {
          const rect = new Rect(
            e.collider.getWidth(),
            e.collider.getHeight(),
            e.collider.getPosition(),
            e.collider.getRotation()
          );
          rect.texture = this.debugTexture;

          Renderer.renderRect(rect, undefined, undefined, undefined, worldToClipSpace);
        } else if (e.collider instanceof CircleCollider) {
          const circle = new Circle(
            e.collider.getRadius(),
            e.collider.getPosition(),
            e.collider.getRotation()
          );
          circle.texture = debugTexture;

          Renderer.renderCircle(circle, undefined, undefined, undefined, worldToClipSpace);
        }
      }
    }
  }

  /**
   * Renders a {@link ZMap} of entities in the world using the world's current camera.
   *
   * If `this.useBatchRenderer` is true then the batch renderer will be used, otherwise the
   * entities will be sorted by zIndex and rendered normally.
   *
   * Draw calls are sent before this function terminates.
   *
   * @param delta Time since last frame
   */
  renderEntities(queue: ZMap<Entity[]>) {
    const worldToClipSpace = this.getWorldtoClipSpace();

    Renderer.setMode("TRIANGLES");
    Renderer.useCamera(this.camera);

    const min = queue.min || 0;
    const max = queue.max || Blaze.getZLevels();

    for (let z = min; z <= max; z++) {
      if (!queue[z]) continue;

      if (this.useBatchRenderer) {
        BatchRenderer.renderEntities(queue[z], z, worldToClipSpace);
      } else {
        for (const e of queue[z]) {
          e.render(worldToClipSpace);
        }
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
    const centre = this.camera.getPosition();
    vec2.add(world, world, centre);

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
