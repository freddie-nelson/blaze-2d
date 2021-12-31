import { vec2 } from "gl-matrix";

/**
 * Enum for {@link MouseEvent.state} numbers
 */
export enum Mouse {
  LEFT = 0,
  MIDDLE = 1,
  RIGHT = 2,
  MOVE = 123,
}

/**
 * A callback to be executed on mouse button events.
 */
export type MouseCallback = (pressed: boolean, pos: vec2) => void;

/**
 * Handles mouse events for an {@link HTMLElement}.
 */
export default class MouseHandler {
  readonly element: HTMLElement;

  /**
   * The mouse's current position within the element.
   */
  private position = vec2.create();

  private buttons: { [index: number]: boolean } = {};
  private listeners: { [index: number]: MouseCallback[] } = {};

  constructor(element: HTMLElement) {
    this.element = element;
    this.addListeners();
  }

  private addListeners() {
    this.element.addEventListener("mousedown", (e) => {
      this.buttons[e.button] = true;

      const pos = vec2.fromValues(e.offsetX, e.offsetY);
      this.listeners[e.button]?.forEach((cb) => cb(true, pos));
    });

    this.element.addEventListener("mouseup", (e) => {
      this.buttons[e.button] = false;

      const pos = vec2.fromValues(e.offsetX, e.offsetY);
      this.listeners[e.button]?.forEach((cb) => cb(false, pos));
    });

    this.element.addEventListener("mousemove", (e) => {
      const pos = vec2.fromValues(e.offsetX, e.offsetY);
      vec2.copy(this.position, pos);

      this.listeners[Mouse.MOVE]?.forEach((cb) => cb(this.isPressed(), pos));
    });
  }

  /**
   * Gets the current mouse position within the element.
   *
   * If the mouse has not yet entered the element then the position will be [0, 0].
   *
   * @returns The mouse position in pixels as a {@link vec2};
   */
  getMousePos() {
    return this.position;
  }

  /**
   * Determines wether the given mouse button is pressed.
   *
   * @param button The {@link Mouse} button to check
   * @returns Wether the given button is pressed or not
   */
  isPressed(button = Mouse.LEFT) {
    return !!this.buttons[button];
  }

  /**
   * Attaches a listener to a given mouse button that is called whenever the state of the button changes.
   *
   * @param button The {@link Mouse} button to attach the listener to
   * @param cb The callback to execute on a mousedown/mouseup event
   */
  addListener(button: Mouse, cb: MouseCallback) {
    if (this.listeners[button]) {
      this.listeners[button].push(cb);
    } else {
      this.listeners[button] = [cb];
    }
  }

  /**
   * Removes a listener from a given mouse button.
   *
   * @param button The {@link Mouse} button the listener is attached to
   * @param cb The attached listener
   */
  removeListener(button: Mouse, cb: MouseCallback) {
    if (!this.listeners[button]) return;

    for (let i = 0; i < this.listeners[button].length; i++) {
      if (cb === this.listeners[button][i]) {
        this.listeners[button].splice(i, 1);
        break;
      }
    }
  }
}
