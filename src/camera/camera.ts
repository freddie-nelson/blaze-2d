import { vec2 } from "gl-matrix";
import Object2D from "../object2d";
import Viewport from "./viewport";

/**
 * Represents the camera in 2D world space.
 *
 * The camera's position is the centre of the viewport.
 */
export default class Camera extends Object2D {
  viewport: Viewport;
  private zoomLevel = 1;
  minZoom = 0.1;
  maxZoom = 3;

  lastPos = vec2.create();

  /**
   * Creates a {@link Camera} instance and instantiates its {@link Viewport} with a width and height at the camera's centre.
   *
   * @param centre The centre of the camera's viewport
   * @param vw The camera's viewport width
   * @param vh The camera's viewport height
   */
  constructor(centre: vec2, vw: number, vh: number);

  /**
   * Creates a {@link Camera} instance and sets its viewport.
   *
   * @param centre The centre of the camera's viewport
   * @param viewport The viewport to use with the camera
   */
  constructor(centre: vec2, viewport: Viewport);

  /**
   * Creates a {@link Camera} instance.
   */
  constructor(centre: vec2, vw: number | Viewport, vh?: number) {
    super();
    this.setPosition(centre);

    if (typeof vw === "number") {
      this.viewport = new Viewport(centre, vw, vh);
    } else {
      this.viewport = vw;
    }
  }

  /**
   * Updates the camera's viewport if the camera has changed position since the last call to update.
   */
  update() {
    if (vec2.exactEquals(this.getPosition(), this.lastPos)) return;

    this.viewport.update(this.getPosition());
    vec2.copy(this.lastPos, this.getPosition());
  }

  /**
   * Zooms the camera by the given amount.
   *
   * @param zoom The amount to zoom by
   */
  zoom(zoom: number) {
    const newZoom = this.zoomLevel + zoom;
    this.setZoom(newZoom);
  }

  /**
   * Sets the zoom level of the camera.
   *
   * This will change the size of `this.viewport`.
   *
   * @param zoom The zoom level
   */
  setZoom(zoom: number) {
    // clamp zoom
    this.zoomLevel = Math.max(this.minZoom, Math.min(zoom, this.maxZoom));

    const w = this.viewport.getOriginalWidth() / this.zoomLevel;
    const h = this.viewport.getOriginalHeight() / this.zoomLevel;

    this.viewport.setWidth(w);
    this.viewport.setHeight(h);
  }

  /**
   * Gets the zoom level of the camera.
   *
   * @returns The zoom level of the camera
   */
  getZoom() {
    return this.zoomLevel;
  }
}
