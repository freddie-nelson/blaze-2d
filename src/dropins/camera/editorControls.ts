import { vec2 } from "gl-matrix";
import Blaze from "../../blaze";
import Camera from "../../camera/camera";
import { Mouse } from "../../input/mouse";

/**
 * Allows the camera to be panned, zoomed and rotated.
 *
 * By default the middle mouse button is used for panning, scroll for zoom and arrow keys for rotation.
 */
export default class EditorCameraControls {
  camera: Camera;
  private canvas: HTMLCanvasElement;

  // pan
  panButton = Mouse.MIDDLE;
  private isPanPressed = false;
  private last: vec2;

  // zoom
  zoomSensitivity = 0.005;

  // rotate
  rotateSpeed = 1;
  posRotateKey = "ArrowRight";
  negRotateKey = "ArrowLeft";

  /**
   * Create an {@link EditorCameraControls} instance.
   *
   * @param camera The camera to control
   * @param canvas The canvas to attach event listeners to
   */
  constructor(camera: Camera, canvas: HTMLCanvasElement) {
    this.camera = camera;
    this.setCanvas(canvas);
  }

  /**
   * Enables panning when the mouse button is pressed.
   *
   * @param e The mouse event
   */
  private onMousedown = (e: MouseEvent) => {
    if (e.button === this.panButton) {
      this.isPanPressed = true;
      this.last = vec2.fromValues(
        e.pageX - this.canvas.offsetLeft,
        this.canvas.height - (e.pageY - this.canvas.offsetTop),
      );
    }
  };

  /**
   * Disables panning when the mouse button is released.
   *
   * @param e The mouse event
   */
  private onMouseup = (e: MouseEvent) => {
    if (e.button === this.panButton) this.isPanPressed = false;
  };

  /**
   * Moves the camera by the difference between the current and last mouse position.
   *
   * @param e The mouse event
   */
  private onMousemove = (e: MouseEvent) => {
    if (!this.isPanPressed) return;

    const curr = vec2.fromValues(
      e.pageX - this.canvas.offsetLeft,
      this.canvas.height - (e.pageY - this.canvas.offsetTop),
    );
    const diff = vec2.sub(vec2.create(), this.last, curr);
    vec2.mul(diff, diff, Blaze.getScene().world.getPixelToWorldSpace());
    vec2.rotate(diff, diff, vec2.create(), -this.camera.getRotation());

    this.camera.translate(diff);

    this.last = curr;
  };

  /**
   * Zooms/unzooms the camera.
   *
   * @param e The wheel event
   */
  private onWheel = (e: WheelEvent) => {
    this.camera.zoom(-e.deltaY * this.zoomSensitivity);
  };

  /**
   * Rotates the camera on key down.
   *
   * @param e The keyboard event
   */
  private onKeydown = (e: KeyboardEvent) => {
    if (e.key === this.posRotateKey) {
      this.camera.rotate((1 * Math.PI) / 180);
    } else if (e.key === this.negRotateKey) {
      this.camera.rotate((-1 * Math.PI) / 180);
    }
  };

  /**
   * Set the canvas to be attach event listeners to.
   *
   * @param canvas The {@link HTMLCanvasElement} to attach event listeners to
   */
  setCanvas(canvas: HTMLCanvasElement) {
    // remove events from old canvas
    if (this.canvas) {
      this.canvas.removeEventListener("mousedown", this.onMousedown);
      this.canvas.removeEventListener("mouseup", this.onMouseup);
      this.canvas.removeEventListener("mousemove", this.onMousemove);

      this.canvas.removeEventListener("wheel", this.onWheel);

      this.canvas.removeEventListener("keydown", this.onKeydown);
    }

    // attach events to new canvas
    this.canvas = canvas;
    this.canvas.addEventListener("mousedown", this.onMousedown);
    this.canvas.addEventListener("mouseup", this.onMouseup);
    this.canvas.addEventListener("mousemove", this.onMousemove);

    this.canvas.addEventListener("wheel", this.onWheel);

    this.canvas.addEventListener("keydown", this.onKeydown);
  }

  /**
   * Get the canvas that event listeners are on.
   *
   * @returns The canvas that event listeners are attached to
   */
  getCanvas() {
    return this.canvas;
  }
}
