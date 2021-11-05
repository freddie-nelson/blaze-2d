import PointerLockControls from "./controls/pointerLock";
import { mergeDeep } from "./utils/objects";
import Controls from "./controls/controls";
import TouchControls from "./controls/touchControls";
import Entity from "./entity";
import Camera from "./camera/camera";
import { vec2 } from "gl-matrix";
import Box from "./physics/box";
import Rect from "./shapes/rect";

export interface PlayerKeyMap {
  forward?: string;
  back?: string;
  left?: string;
  right?: string;
  sprint?: string;
}

const defaultKeys: PlayerKeyMap = {
  forward: "KeyW",
  back: "KeyS",
  left: "KeyA",
  right: "KeyD",
  sprint: "ShiftLeft",
};

/**
 * A highly customizable player controller.
 */
export default class Player extends Entity {
  // camera
  private camera: Camera;
  // private controls: Controls;

  keys: PlayerKeyMap;

  /**
   * Creates a {@link Player} instance with the given settings.
   *
   * @param gl The webgl context to use when creating the player's camera
   * @param pos The player's initial world position
   * @param keys The key map to use for player controls
   */
  constructor(
    gl: WebGL2RenderingContext,
    pos: vec2 = vec2.fromValues(0, 0),
    keys: PlayerKeyMap = defaultKeys
  ) {
    super(pos, new Box(pos, 2, 3), [new Rect(2, 3)]);

    // right most value wins key collisions
    this.keys = mergeDeep(defaultKeys, keys);

    this.camera = new Camera(this.getPosition(), gl.canvas.width, gl.canvas.height);
    // this.controls = new PointerLockControls(<HTMLCanvasElement>gl.canvas, this.camera, this);
  }

  /**
   * Updates the player's camera, rotation, velocity and picks blocks if block picking is enabled.
   *
   * @param delta The time since the last tick in ms
   */
  update(delta: number) {}

  /**
   * Gets the player's current camera.
   *
   * @returns The player's camera
   */
  getCamera(): Camera {
    return this.camera;
  }

  /**
   * Disposes the current controls and switches to touch controls.
   *
   * @param gl The rendering context to grab the canvas from
   */
  // useTouchControls(gl: WebGL2RenderingContext) {
  //   this.controls.dispose();
  //   this.controls = new TouchControls(<HTMLCanvasElement>gl.canvas, this.camera, this);
  // }

  // /**
  //  * Disposes the current controls and switches to pointer lock controls.
  //  *
  //  * @param gl The rendering context to grab the canvas from
  //  */
  // usePointerLockControls(gl: WebGL2RenderingContext) {
  //   this.controls.dispose();
  //   this.controls = new PointerLockControls(<HTMLCanvasElement>gl.canvas, this.camera, this);
  // }
}
