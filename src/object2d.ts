import { mat4, vec2 } from "gl-matrix";

/**
 * A generic interface to represent any 3D object's neighbours in a grid.
 */
export interface Neighbours<T> {
  [index: string]: T;
  left?: T;
  right?: T;
  bottom?: T;
  top?: T;
  topLeft?: T;
  topRight?: T;
  bottomLeft?: T;
  bottomRight?: T;
}

export type Listener = (e?: any, obj?: Object2D) => void;

/**
 * Represents an object in 2D space with a position and rotation.
 *
 * The position should be in world space and represent the center of the object, if the object is given a width and/or height.
 *
 * Also contains an events system which can be used to execute arbitrary functions on certain events.
 */
export default class Object2D {
  private position = vec2.create();
  private rotation = 0;

  protected listeners: { [index: string]: Listener[] } = {};

  constructor() {
    this.setupEvents();
  }

  /**
   * Sets the object's position.
   *
   * @param pos The object's new position
   */
  setPosition(pos: vec2) {
    this.position = vec2.clone(pos);

    this.fireEvent("position", this.position);
  }

  /**
   * Sets the x component of the object's position.
   *
   * @param pos The object's new x coordinate
   */
  setPositionX(pos: number) {
    this.position[0] = pos;

    this.fireEvent("position", this.position);
  }

  /**
   * Sets the y component of the object's position.
   *
   * @param pos The object's new y coordinate
   */
  setPositionY(pos: number) {
    this.position[1] = pos;

    this.fireEvent("position", this.position);
  }

  /**
   * Gets the object's position.
   *
   * @returns The object's position as a vec2
   */
  getPosition() {
    return this.position;
  }

  /**
   * Moves the object's position right (x+) relative to it's rotation.
   *
   * @param dist The distance to move right, can be + or -
   */
  moveRight(dist: number) {
    const forwardVec = vec2.fromValues(1, 0);
    vec2.rotate(forwardVec, forwardVec, vec2.fromValues(0, 0), this.rotation);
    vec2.scaleAndAdd(this.position, this.position, forwardVec, dist);

    this.fireEvent("position", this.position);
  }

  /**
   * Moves the object's position up (y+) relative to it's rotation.
   *
   * @param dist The distance to move up, can be + or -
   */
  moveUp(dist: number) {
    const upVec = vec2.fromValues(0, 1);
    vec2.rotate(upVec, upVec, vec2.fromValues(0, 0), this.rotation);
    vec2.scaleAndAdd(this.position, this.position, upVec, dist);

    this.fireEvent("position", this.position);
  }

  /**
   * Sets the object's rotation.
   *
   * @param rot The object's new rotation
   */
  setRotation(rot: number) {
    this.rotation = rot;

    this.fireEvent("rotate", this.rotation);
  }

  /**
   * Gets the object's rotation as a number in radians relative to y+.
   *
   * @returns The object's rotation
   */
  getRotation() {
    return this.rotation;
  }

  /**
   * Increments the object's rotation by an angle in radians.
   *
   * @param angle The angle to rotate by in radians
   */
  rotate(angle: number) {
    this.rotation += angle;

    this.fireEvent("rotate", this.rotation);
  }

  /**
   * Sets all the events that can be used in `listeners`.
   */
  protected setupEvents() {
    this.listeners.position = [];
    this.listeners.rotate = [];
  }

  /**
   * Gets the events that can be listened to on the object.
   *
   * @returns The events the object supports
   */
  getEvents() {
    return Object.keys(this.listeners);
  }

  /**
   * Executes all listeners attached to a given event.
   *
   * @param event The event to fire
   * @param e The data to pass to each event listener
   */
  fireEvent(event: string, e: any) {
    if (!this.listeners[event]) throw new Error(`Object2D: '${event}' is not a supported event.`);

    for (const l of this.listeners[event]) {
      l(e, this);
    }
  }

  /**
   * Gets the listeners attached to an event.
   *
   * @returns An array of listeners attached to the given event
   */
  getEventListeners(event: string) {
    return this.listeners[event];
  }

  /**
   * Executes a function when an event is fired.
   *
   * @param event The event to listen for
   * @param listener The function to execute when the event fired
   * @returns Wether or not the listener was added
   */
  addEventListener(event: string, listener: Listener) {
    if (!this.listeners[event]) return false;

    this.listeners[event].push(listener);
    return true;
  }

  /**
   * Removes a listener from an event.
   *
   * @param event The event the listener is attached to
   * @param listener The listener to remove
   * @returns Wether or not the listener was removed
   */
  removeEventListener(event: string, listener: Listener) {
    if (!this.listeners[event]) return false;

    const i = this.listeners[event].findIndex((l) => l === listener);
    if (i === -1) return false;

    this.listeners[event].splice(i, 1);
    return true;
  }
}
