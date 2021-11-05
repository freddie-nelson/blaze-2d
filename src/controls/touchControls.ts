import Camera from "../camera";
import Object3D from "../object3d";
import Controls from "./controls";

export default class TouchControls extends Controls {
  anchor: Touch;

  /**
   * Creates a {@link TouchControls} instance and sets up it's event handlers.
   *
   * @param element The element to use when handling control events
   * @param camera The camera to control
   * @param object An optional object to follow the camera's yaw
   * @param sensitivity Movement sensitivity
   */
  constructor(element: HTMLElement, camera: Camera, object?: Object3D, sensitivity: number = 0.7) {
    super(element, camera, object, sensitivity);

    element.addEventListener("touchstart", this.touchStartHandler);
    element.addEventListener("touchmove", this.touchMoveHandler);
    element.addEventListener("touchend", this.touchEndHandler);
  }

  /**
   * Finds the first touch targeting `this.element`.
   *
   * @param touches The list of touches to choose from
   * @returns The first touch targeting `this.element` or undefined
   */
  private findTouchTargetingElement(touches: TouchList) {
    let touch: Touch;
    for (const t of Array.from(touches)) {
      if (t.target === this.element || this.element.contains(<Node>t.target)) {
        touch = t;
        break;
      }
    }

    return touch;
  }

  /**
   * Sets the anchor point to the first touch detected when anchor has not already been set.
   *
   * @param e The touch event
   */
  private touchStartHandler = (e: TouchEvent) => {
    if (!this.anchor) this.anchor = this.findTouchTargetingElement(e.touches);
  };

  /**
   * Calculates the difference in position from the last anchor and the current touch point.
   *
   * These values are then set in `movementX` and `movementY`.
   *
   * @param e The touch event
   */
  private touchMoveHandler = (e: TouchEvent) => {
    if (!this.anchor) return;

    e.preventDefault();

    const touch = this.findTouchTargetingElement(e.changedTouches);
    if (!touch) return;

    this.movementX = touch.clientX - this.anchor.clientX;
    this.movementY = touch.clientY - this.anchor.clientY;

    this.anchor = touch;
  };

  /**
   * Removes the touch anchor.
   *
   * @param e The touch event
   */
  private touchEndHandler = (e: TouchEvent) => {
    if (this.findTouchTargetingElement(e.changedTouches)) {
      this.anchor = undefined;
    }
  };

  /**
   * Calculates the new camera direction from `movementX` and `movementY`.
   *
   * Called every tick.
   */
  update() {
    if (!this.anchor) return;

    this.calculateCameraDirection();
  }

  dispose() {
    this.element.removeEventListener("touchstart", this.touchStartHandler);
    this.element.removeEventListener("touchmove", this.touchMoveHandler);
    this.element.removeEventListener("touchend", this.touchEndHandler);
  }
}
