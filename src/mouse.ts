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

const buttons: { [index: number]: boolean } = {};
const listeners: { [index: number]: MouseCallback[] } = {};

document.body.addEventListener("mousedown", (e) => {
  buttons[e.button] = true;

  const pos = vec2.fromValues(e.clientX, e.clientY);
  listeners[e.button]?.forEach((cb) => cb(true, pos));
});

document.body.addEventListener("mouseup", (e) => {
  buttons[e.button] = false;

  const pos = vec2.fromValues(e.clientX, e.clientY);
  listeners[e.button]?.forEach((cb) => cb(false, pos));
});

document.body.addEventListener("mousemove", (e) => {
  const pos = vec2.fromValues(e.clientX, e.clientY);
  listeners[Mouse.MOVE].forEach((cb) => cb(isMouseDown(), pos));
});

/**
 * Determines wether the given mouse button is pressed.
 *
 * @param button The {@link Mouse} button to check
 * @returns Wether the given button is pressed or not
 */
export function isMouseDown(button = Mouse.LEFT) {
  return !!buttons[button];
}

/**
 * Attaches a listener to a given mouse button that is called whenever the state of the button changes.
 *
 * @param button The {@link Mouse} button to attach the listener to
 * @param cb The callback to execute on a mousedown/mouseup event
 */
export function addMouseListener(button: Mouse, cb: MouseCallback) {
  if (listeners[button]) {
    listeners[button].push(cb);
  } else {
    listeners[button] = [cb];
  }
}

/**
 * Removes a listener from a given mouse button.
 *
 * @param button The {@link Mouse} button the listener is attached to
 * @param cb The attached listener
 */
export function removeMouseListener(button: Mouse, cb: MouseCallback) {
  if (listeners[button]) {
    for (let i = 0; i < listeners[button].length; i++) {
      if (cb === listeners[button][i]) {
        listeners[button].splice(i, 1);
        break;
      }
    }
  }
}
