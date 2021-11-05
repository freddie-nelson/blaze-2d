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

/**
 * Represents an object in 2D space with a position and rotation
 */
export default class Object2D {
  private position = vec2.create();
  private rotation = 0;

  constructor() {}

  /**
   * Sets the object's position.
   *
   * @param pos The object's new position
   */
  setPosition(pos: vec2) {
    this.position = pos;
  }

  /**
   * Sets the x component of the object's position.
   *
   * @param pos The object's new x coordinate
   */
  setPositionX(pos: number) {
    this.position[0] = pos;
  }

  /**
   * Sets the y component of the object's position.
   *
   * @param pos The object's new y coordinate
   */
  setPositionY(pos: number) {
    this.position[1] = pos;
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
  }

  /**
   * Sets the object's rotation.
   *
   * @param rot The object's new rotation
   */
  setRotation(rot: number) {
    this.rotation = rot;
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
  rotateX(angle: number) {
    this.rotation += angle;
  }
}
