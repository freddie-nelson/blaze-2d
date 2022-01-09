/**
 * A callback to be executed on key events.
 */
export type KeyCallback = (pressed: boolean, e: KeyboardEvent) => void;

/**
 * Handles keyboard events for an {@link HTMLElement}.
 */
export default class KeyboardHandler {
  readonly element: HTMLElement;

  keys: { [index: string]: boolean } = {};
  listeners: { [index: string]: KeyCallback[] } = {};

  constructor(element: HTMLElement) {
    this.element = element;

    // set tab index to allow element to catch key events
    this.element.tabIndex = 0;

    this.addListeners();
  }

  private addListeners() {
    this.element.addEventListener("keydown", (e) => {
      this.keys[e.code] = true;
      this.listeners[e.code]?.forEach((cb) => cb(true, e));
    });

    this.element.addEventListener("keyup", (e) => {
      this.keys[e.code] = false;
      this.listeners[e.code]?.forEach((cb) => cb(false, e));
    });
  }

  /**
   * Determines wether or not a key is currently pressed.
   *
   * @see [Key Codes](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code)
   *
   * @param code The key code to check
   * @returns Wether or not the key corresponding to the given code is pressed.
   */
  isPressed(code: string) {
    return !!this.keys[code];
  }

  /**
   * Emulates a keydown/keyup event on the pages body for a given key code.
   *
   * @see [Key Codes](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code)
   *
   * @param code The key code to emulate
   * @param pressed When true a `keydown` event is emulated otherwise `keyup` is emulated
   */
  setKey(code: string, pressed: boolean) {
    const type = pressed ? "keydown" : "keyup";
    const event = new KeyboardEvent(type, {
      code: code,
    });

    this.element.dispatchEvent(event);
  }

  /**
   * Attaches a listener to a given key code that is called whenever the state of the key changes.
   *
   * @param code The key code to attach the listener to
   * @param cb The callback to execute on a keydown/keyup event
   */
  addListener(code: string, cb: KeyCallback) {
    if (this.listeners[code]) {
      this.listeners[code].push(cb);
    } else {
      this.listeners[code] = [cb];
    }
  }

  /**
   * Removes a listener from a given key code.
   *
   * @param code The key code the listener is attached to
   * @param cb The attached listener
   */
  removeListener(code: string, cb: KeyCallback) {
    if (!this.listeners[code]) return;

    for (let i = 0; i < this.listeners[code].length; i++) {
      if (cb === this.listeners[code][i]) {
        this.listeners[code].splice(i, 1);
        break;
      }
    }
  }
}
