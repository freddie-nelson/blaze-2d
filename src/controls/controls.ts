import { glMatrix, vec3 } from "gl-matrix";
import Camera from "../camera";
import Object3D from "../object3d";

/**
 * Stores common properties and methods for controls.
 */
export default abstract class Controls {
  element: HTMLElement;
  sensitivity: number;
  movementX = 0;
  movementY = 0;

  yaw = -90;
  pitch = 0;
  direction = vec3.create();

  object: Object3D;
  camera: Camera;

  /**
   * Creates a {@link Controls} instance.
   *
   * @param element The element to use when handling control events
   * @param camera The camera to control
   * @param object An optional object to follow the camera's yaw
   * @param sensitivity Movement sensitivity
   */
  constructor(element: HTMLElement, camera: Camera, object?: Object3D, sensitivity: number = 0.1) {
    this.element = element;
    this.camera = camera;
    this.object = object;
    this.sensitivity = sensitivity;
  }

  /**
   * Should update the camera's direction and object's rotation.
   *
   * Called every tick.
   */
  abstract update(): void;

  /**
   * Removes all events used for the controls and deals with any extra cleanup needed.
   */
  abstract dispose(): void;

  calculateCameraDirection() {
    this.yaw += this.movementX * this.sensitivity;
    this.pitch -= this.movementY * this.sensitivity;

    // cap pitch
    if (this.pitch > 89.99) this.pitch = 89.99;
    else if (this.pitch < -89.99) this.pitch = -89.99;

    this.direction[0] = Math.cos(glMatrix.toRadian(this.yaw)) * Math.cos(glMatrix.toRadian(this.pitch));
    this.direction[1] = Math.sin(glMatrix.toRadian(this.pitch));
    this.direction[2] = Math.sin(glMatrix.toRadian(this.yaw)) * Math.cos(glMatrix.toRadian(this.pitch));

    if (!vec3.equals(this.direction, this.camera.direction)) {
      vec3.copy(this.camera.direction, this.direction);

      if (this.object) {
        const objectRotation = ((this.yaw + 90) % 360) * -1;
        this.object.setRotationY(glMatrix.toRadian(objectRotation));
      }
    }

    this.movementX = 0;
    this.movementY = 0;
  }
}
