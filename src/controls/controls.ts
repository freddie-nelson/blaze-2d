import Camera from "../camera/camera";
import Object2D from "../object2d";

/**
 * Stores common properties and methods for controls.
 */
export default abstract class Controls {
  element: HTMLElement;
  sensitivity: number;
  movementX = 0;
  movementY = 0;

  object: Object2D;
  camera: Camera;

  /**
   * Creates a {@link Controls} instance.
   *
   * @param element The element to use when handling control events
   * @param object An optional object to follow the camera's yaw
   * @param sensitivity Movement sensitivity
   */
  constructor(element: HTMLElement, camera: Camera, object?: Object2D, sensitivity = 0.1) {
    this.element = element;
    this.camera = camera;
    this.object = object;
    this.sensitivity = sensitivity;
  }

  /**
   * Called every tick.
   */
  abstract update(): void;

  /**
   * Removes all events used for the controls and deals with any extra cleanup needed.
   */
  abstract dispose(): void;
}
