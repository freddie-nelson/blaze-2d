/**
 * A callback to be executed on key events.
 */
export type KeyCallback = (pressed: boolean) => void;

const keys: { [index: string]: boolean } = {};
const listeners: { [index: string]: KeyCallback[] } = {};

document.body.addEventListener("keydown", (e) => {
  keys[e.code] = true;
  listeners[e.code]?.forEach((cb) => cb(true));
});

document.body.addEventListener("keyup", (e) => {
  keys[e.code] = false;
  listeners[e.code]?.forEach((cb) => cb(false));
});

/**
 * Determines wether or not a key is currently pressed.
 *
 * @see [Key Codes](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code)
 *
 * @param code The key code to check
 * @returns Wether or not the key corresponding to the given code is pressed.
 */
export function isKeyPressed(code: string) {
  return !!keys[code];
}

/**
 * Emulates a keydown/keyup event on the pages body for a given key code.
 *
 * @see [Key Codes](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code)
 *
 * @param code The key code to emulate
 * @param pressed When true a `keydown` event is emulated otherwise `keyup` is emulated
 */
export function setKey(code: string, pressed: boolean) {
  const type = pressed ? "keydown" : "keyup";
  const event = new KeyboardEvent(type, {
    code: code,
  });

  document.body.dispatchEvent(event);
}

/**
 * Attaches a listener to a given key code that is called whenever the state of the key changes.
 *
 * @param code The key code to attach the listener to
 * @param cb The callback to execute on a keydown/keyup event
 */
export function addKeyListener(code: string, cb: KeyCallback) {
  if (listeners[code]) {
    listeners[code].push(cb);
  } else {
    listeners[code] = [cb];
  }
}

/**
 * Removes a listener from a given key code.
 *
 * @param code The key code the listener is attached to
 * @param cb The attached listener
 */
export function removeKeyListener(code: string, cb: KeyCallback) {
  if (listeners[code]) {
    for (let i = 0; i < listeners[code].length; i++) {
      if (cb === listeners[code][i]) {
        listeners[code].splice(i, 1);
        break;
      }
    }
  }
}
