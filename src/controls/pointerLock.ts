import { glMatrix, vec3 } from "gl-matrix";
import Camera from "../camera";
import Object3D from "../object3d";
import Controls from "./controls";

export default class PointerLockControls extends Controls {
  isLocked = false;

  /**
   * Creates a {@link PointerLockControls} instance and sets up it's event handlers.
   *
   * @param element The element to use when handling control events
   * @param camera The camera to control
   * @param object An optional object to follow the camera's yaw
   * @param sensitivity Movement sensitivity
   */
  constructor(element: HTMLElement, camera: Camera, object?: Object3D, sensitivity: number = 0.1) {
    super(element, camera, object, sensitivity);

    element.addEventListener("click", this.clickHandler);
    document.addEventListener("pointerlockchange", this.pointerLockChangeHandler);
    element.addEventListener("mousemove", this.mouseMoveHandler);
  }

  /**
   * Requests pointer lock if the control's are not already locked.
   */
  private clickHandler = () => {
    if (!this.isLocked) this.element.requestPointerLock();
  };

  /**
   * Resets `movementX` and `movementY` if the controls has been unlocked.
   */
  private pointerLockChangeHandler = () => {
    this.isLocked = !this.isLocked;

    if (!this.isLocked) {
      this.movementX = 0;
      this.movementY = 0;
    }
  };

  /**
   * Syncs `this.movementX` and `this.movementY` with the event's movement properties.
   *
   * @param e The mouse event
   */
  private mouseMoveHandler = (e: MouseEvent) => {
    if (this.isLocked) {
      this.movementX = e.movementX;
      this.movementY = e.movementY;
    }
  };

  /**
   * Calculates the new camera direction from `movementX` and `movementY`.
   *
   * Called every tick.
   */
  update() {
    if (!this.isLocked) return;

    this.calculateCameraDirection();
  }

  dispose() {
    this.element.removeEventListener("click", this.clickHandler);
    document.removeEventListener("pointerlockchange", this.pointerLockChangeHandler);
    this.element.removeEventListener("mousemove", this.mouseMoveHandler);
  }
}
