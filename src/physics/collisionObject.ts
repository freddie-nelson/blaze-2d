import { vec2 } from "gl-matrix";
import validateZIndex from "../utils/validators";
import Collider, { CollisionResult } from "./collider/collider";
import CollisionFilter from "./collisionFilter";
import PhysicsObject from "./object";

/**
 * Represents a physics object that can experience collisions.
 *
 * The object's collider is positioned in world space, not relative to the object.
 */
export default class CollisionObject extends PhysicsObject {
  // private terrainCollisionFlags: { [index: number]: boolean } = {};

  /**
   * The object's collision filter.
   */
  filter = new CollisionFilter();

  /**
   * The object's collider.
   */
  collider: Collider;

  /**
   * The number of contact points the object is colliding at.
   */
  totalContacts = 0;

  /**
   * Wether or not to clone the object's position and rotation to it's collider.
   */
  stickyCollider = true;

  /**
   * Wether or not the object is static, static objects do not move during collisions.
   */
  isStatic = false;

  /**
   * Wether or not the collision object should be a trigger.
   *
   * When true the object will detect but not respond to collisions.
   */
  isTrigger = false;

  /**
   * Creates a {@link CollisionObject} with a collider, mass and restitution.
   *
   * @param collider The collider shape of the object
   * @param mass The mass of the object
   * @param restitution The restitution(bounciness) of the object
   */
  constructor(collider: Collider, mass?: number, restitution?: number) {
    super(mass, restitution);

    this.collider = collider;

    this.setupEvents();
  }

  protected setupEvents() {
    super.setupEvents();

    this.listeners.collision = [];
    this.listeners.trigger = [];
  }

  /**
   * Checks if this object's collider is colliding with another object's collider.
   *
   * @param B {@link CollisionObject} to test collisions against
   * @returns {@link CollisionResult} with the results of the test
   */
  testCollision(B: CollisionObject): CollisionResult {
    const a = this.collider;
    const b = B.collider;

    return a.testCollision(b);
  }

  /**
   * Sets wether or not the rigidbody should collide with the given terrain level.
   *
   * @throws When {@link validateZIndex} returns a string.
   *
   * @param zIndex The Z level of terrain
   * @param collides Wether or not to collide with the given terrain level
   */
  // collidesWithTerrain(zIndex: number, collides: boolean) {
  //   const valid = validateZIndex(zIndex);
  //   if (valid !== true) throw new Error(valid);

  //   this.terrainCollisionFlags[zIndex] = collides;
  // }

  /**
   * Sets the object's position.
   *
   * Also sets `this.collider`'s position, if `this.stickyCollider` is true.
   *
   * @param pos The object's new position
   */
  setPosition(pos: vec2) {
    super.setPosition(pos);
    if (this.stickyCollider) this.collider.setPosition(pos);
  }

  /**
   * Sets the object's rotation, in radians.
   *
   * Also sets `this.collider`'s rotation, if `this.stickyCollider` is true.
   *
   * @param angle The object's new rotation angle (in radians)
   */
  setRotation(angle: number) {
    super.setRotation(angle);
    if (this.stickyCollider) this.collider.setRotation(angle);
  }
}
