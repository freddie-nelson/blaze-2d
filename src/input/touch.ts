import { vec2 } from "gl-matrix";

/**
 * A callback to be executed on touch events.
 */
export type TouchCallback = (touch: BLZTouch, e: TouchEvent) => void;

/**
 * Represents a tap on the screen.
 *
 * A {@link BLZTouch} should only be used until it's release event is fired.
 */
export class BLZTouch {
  private element: HTMLElement;
  touch: Touch;

  startPos = vec2.create();
  pos = vec2.create();
  holding = true;

  private listeners = {
    move: <TouchCallback[]>[],
    release: <TouchCallback[]>[],
  };

  /**
   * Creates a {@link BLZTouch}.
   *
   * @param touch The native {@link Touch} to wrap
   * @param e The {@link TouchEvent} which created the given touch
   * @param element The dom element the {@link TouchHandler} is attached to
   */
  constructor(touch: Touch, e: TouchEvent, element: HTMLElement) {
    this.element = element;

    const pos = vec2.fromValues(touch.pageX - this.element.offsetLeft, touch.pageY - this.element.offsetTop);
    vec2.copy(this.startPos, pos);

    this.update(touch, e);
  }

  /**
   * Updates the {@link BLZTouch}'s state.
   *
   * @param touch The native touch to grab values from
   * @param e The {@link TouchEvent} which created the given touch
   */
  update(touch: Touch, e: TouchEvent) {
    const pos = vec2.fromValues(touch.pageX - this.element.offsetLeft, touch.pageY - this.element.offsetTop);
    if (this.touch && this.holding && !vec2.equals(pos, this.pos)) {
      this.fireListeners("move", e);
    }

    this.touch = touch;
    vec2.copy(this.pos, pos);
  }

  /**
   * Performs a final update and fires release events for the {@link BLZTouch}.
   *
   * @param touch The touch from the touchend event
   * @param e The {@link TouchEvent} which created the given touch
   */
  release(touch: Touch, e: TouchEvent) {
    this.holding = false;

    this.update(touch, e);
    this.fireListeners("release", e);
  }

  /**
   * Fires the listeners for the given event.
   *
   * @param event The event to fire listeners of
   * @param e The {@link TouchEvent} of the update
   */
  private fireListeners(event: "move" | "release", e: TouchEvent) {
    this.listeners[event].forEach((cb) => {
      cb(this, e);
    });
  }

  /**
   * Adds an event listener to the touch.
   *
   * @param event The event to listen for
   * @param cb The callback to fire
   */
  addListener(event: "move" | "release", cb: TouchCallback) {
    this.listeners[event].push(cb);
  }

  /**
   * Removes an event listener from the touch.
   *
   * @param event The event to remove from
   * @param cb The callback to remove
   */
  removeListener(event: "move" | "release", cb: TouchCallback) {
    const i = this.listeners[event].findIndex((l) => l === cb);
    if (i === -1) return;

    this.listeners[event].splice(i, 1);
  }
}

/**
 * Handles touch events for an {@link HTMLElement}.
 */
export default class TouchHandler {
  readonly element: HTMLElement;

  private listeners = {
    tap: <TouchCallback[]>[],
    release: <TouchCallback[]>[],
  };

  /**
   * Maps native {@link Touch} events to {@link BLZTouch} instances.
   */
  private activeTouches = new Map<number, BLZTouch>();

  constructor(element: HTMLElement) {
    this.element = element;
    this.addListeners();
  }

  private addListeners() {
    this.element.addEventListener("touchstart", this.addNewTouches);

    this.element.addEventListener("touchmove", this.updateTouches);

    this.element.addEventListener("touchend", this.releaseTouches);

    this.element.addEventListener("touchcancel", this.releaseTouches);
  }

  /**
   * Adds all the give touches to the handler's active touches list.
   *
   * @param e The dom {@link TouchEvent}
   */
  private addNewTouches = (e: TouchEvent) => {
    const touches = Array.from(e.changedTouches);

    for (const t of touches) {
      this.activeTouches.set(t.identifier, new BLZTouch(t, e, this.element));
      this.fireListeners("tap", this.activeTouches.get(t.identifier), e);
    }
  };

  private updateTouches = (e: TouchEvent) => {
    const activeTouches = this.activeTouches.entries();
    const changed = Array.from(e.changedTouches);

    for (const [id, bTouch] of activeTouches) {
      for (const t of changed) {
        if (id === t.identifier) {
          bTouch.update(t, e);
        }
      }
    }
  };

  /**
   * Releases and removes touches from the handler's active touches list.
   *
   * @param e The dom {@link TouchEvent}
   */
  private releaseTouches = (e: TouchEvent) => {
    const touches = Array.from(e.changedTouches);

    for (const t of touches) {
      if (this.activeTouches.has(t.identifier)) {
        const bTouch = this.activeTouches.get(t.identifier);
        bTouch.release(t, e);
        this.activeTouches.delete(t.identifier);

        this.fireListeners("release", bTouch, e);
      }
    }
  };

  private fireListeners(event: "tap" | "release", t: BLZTouch, e: TouchEvent) {
    this.listeners[event].forEach((cb) => {
      cb(t, e);
    });
  }

  /**
   * Attaches a listener to a given touch event.
   *
   * @param event The event to attach the listener to
   * @param cb The callback to execute when the event is fired
   */
  addListener(fired: "tap" | "release", cb: TouchCallback) {
    this.listeners[fired].push(cb);
  }

  /**
   * Removes a listener from a given touch event.
   *
   * @param event The event to remove the listener from
   * @param cb The callback to remove
   */
  removeListener(event: "tap" | "release", cb: TouchCallback) {
    const i = this.listeners[event].findIndex((l) => l === cb);
    if (i === -1) return;

    this.listeners[event].splice(i, 1);
  }
}
