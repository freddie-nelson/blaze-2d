import PointerLockControls from "./controls/pointerLock";
import { mergeDeep } from "./utils/objects";
import Controls from "./controls/controls";
import TouchControls from "./controls/touchControls";
import Entity from "./entity";
import Camera from "./camera/camera";
import Viewport from "./camera/viewport";
import { vec2 } from "gl-matrix";
import Box from "./physics/box";
import Rect from "./shapes/rect";
import { isKeyPressed } from "./keyboard";

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
   * @param pos The player's initial world position
   * @param dimensions The width and height of the player's bounding box and body
   * @param cameraViewport The width and height of the player camera's viewport
   * @param keys The key map to use for player controls
   */
  constructor(
    pos: vec2 = vec2.fromValues(0, 0),
    dimensions: vec2 = vec2.fromValues(2, 3),
    cameraViewport: vec2,
    keys: PlayerKeyMap = defaultKeys
  ) {
    super(pos, new Box(dimensions[0], dimensions[1], pos), [
      new Rect(dimensions[0], dimensions[1], vec2.fromValues(0, 0)),
    ]);

    // right most value wins key collisions
    this.keys = mergeDeep(defaultKeys, keys);

    this.camera = new Camera(this.getPosition(), new Viewport(pos, cameraViewport[0], cameraViewport[1]));
    // this.controls = new PointerLockControls(<HTMLCanvasElement>gl.canvas, this.camera, this);
  }

  /**
   * Updates the player's camera, rotation, velocity and picks blocks if block picking is enabled.
   *
   * @param delta The time since the last tick in ms
   */
  update(delta: number) {
    super.update(delta);

    const speed = 0.5;
    if (isKeyPressed("KeyD")) {
      this.moveRight(speed);
    }
    if (isKeyPressed("KeyA")) {
      this.moveRight(-speed);
    }
    if (isKeyPressed("KeyW")) {
      this.moveUp(speed);
    }
    if (isKeyPressed("KeyS")) {
      this.moveUp(-speed);
    }

    this.camera.setPosition(this.getPosition());
  }

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
