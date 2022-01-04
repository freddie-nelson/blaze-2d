import { mat4, vec2 } from "gl-matrix";
import Logger from "./logger";

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
 * The position should be in world space and represent the centre of the object, if the object is given a width and/or height.
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
    vec2.copy(this.position, pos);

    this.fireEvent("position", this.getPosition());
  }

  private setVec = vec2.create();

  /**
   * Sets the x component of the object's position.
   *
   * @param x The object's new x coordinate
   */
  setPositionX(x: number) {
    // weird implementation so custom position setting is easier to setup in child classes, see CollisionObject
    this.setVec[0] = x;
    this.setVec[1] = this.getPosition()[1];

    this.setPosition(this.setVec);
  }

  /**
   * Sets the y component of the object's position.
   *
   * @param y The object's new y coordinate
   */
  setPositionY(y: number) {
    // weird implementation so custom position setting is easier to setup in child classes, see CollisionObject
    this.setVec[0] = this.getPosition()[0];
    this.setVec[1] = y;

    this.setPosition(this.setVec);
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
   * Translates the object by the provided vector.
   *
   * @param v The vector to translate by
   */
  translate(v: vec2) {
    this.setPosition(vec2.add(this.setVec, this.getPosition(), v));
  }

  /**
   * Moves the object's position right (x+) relative to it's rotation.
   *
   * @param dist The distance to move right, can be + or -
   */
  moveRight(dist: number) {
    const pos = this.getPosition();
    const forwardVec = vec2.fromValues(1, 0);
    vec2.rotate(forwardVec, forwardVec, vec2.fromValues(0, 0), this.getRotation());
    vec2.scaleAndAdd(pos, pos, forwardVec, dist);

    this.fireEvent("position", pos);
  }

  /**
   * Moves the object's position up (y+) relative to it's rotation.
   *
   * @param dist The distance to move up, can be + or -
   */
  moveUp(dist: number) {
    const pos = this.getPosition();
    const upVec = vec2.fromValues(0, 1);
    vec2.rotate(upVec, upVec, vec2.fromValues(0, 0), this.getRotation());
    vec2.scaleAndAdd(pos, pos, upVec, dist);

    this.fireEvent("position", pos);
  }

  /**
   * Sets the object's rotation.
   *
   * @param angle The object's new rotation
   */
  setRotation(angle: number) {
    this.rotation = angle;

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
    this.setRotation(this.getRotation() + angle);
  }

  /**
   * Sets all the events that can be used in `listeners`.
   *
   * Listeners can be added for an event using:
   *
   * ```js
   *    this.listeners.eventName = [];
   * ```
   *
   * @example <caption>Setup listeners for "position" and "rotate" events.</caption>
   *    this.listeners.position = [];
   *    this.listeners.rotate = [];
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
  fireEvent(event: string, e: any): void {
    if (!this.listeners[event]) return void Logger.error("Object2D", `'${event}' is not a supported event.`);

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
