import { vec2 } from "gl-matrix";
import Object2D from "../object2d";
import Viewport from "./viewport";

/**
 * Represents the camera in 2D world space.
 *
 * The camera's position is the center of the viewport.
 */
export default class Camera extends Object2D {
  viewport: Viewport;
  lastPos = vec2.create();

  /**
   * Creates a {@link Camera} instance and instantiates its {@link Viewport} with a width and height at the camera's center.
   *
   * @param center The center of the camera's viewport
   * @param vw The camera's viewport width
   * @param vh The camera's viewport height
   */
  constructor(center: vec2, vw: number, vh: number);

  /**
   * Creates a {@link Camera} instance and sets its viewport.
   *
   * @param center The center of the camera's viewport
   * @param viewport The viewport to use with the camera
   */
  constructor(center: vec2, viewport: Viewport);

  /**
   * Creates a {@link Camera} instance.
   */
  constructor(center: vec2, vw: number | Viewport, vh?: number) {
    super();
    this.setPosition(center);

    if (typeof vw === "number") {
      this.viewport = new Viewport(center, vw, vh);
    } else {
      this.viewport = vw;
    }
  }

  /**
   * Updates the camera's viewport if the camera has changed position since the last call to update.
   */
  update() {
    if (!vec2.exactEquals(this.getPosition(), this.lastPos)) return;

    this.viewport.update(this.getPosition());
    vec2.copy(this.lastPos, this.getPosition());
  }
}
