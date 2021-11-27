import { vec2 } from "gl-matrix";
import validateZIndex from "../utils/validators";
import Collider from "./collider/collider";
import PhysicsObject from "./object";

export default class CollisionObject extends PhysicsObject {
  private terrainCollisionFlags: { [index: number]: boolean } = {};

  collider: Collider;

  /**
   * Wether or not the object is static, static objects cannot move.
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
   * Sets wether or not the rigidbody should collide with the given terrain level.
   *
   * @throws When {@link validateZIndex} returns a string.
   *
   * @param zIndex The Z level of terrain
   * @param collides Wether or not to collide with the given terrain level
   */
  collidesWithTerrain(zIndex: number, collides: boolean) {
    const valid = validateZIndex(zIndex);
    if (valid !== true) throw new Error(valid);

    this.terrainCollisionFlags[zIndex] = collides;
  }

  /**
   * Sets the object's position.
   *
   * Also sets `this.collider`'s position.
   *
   * @param pos The object's new position
   */
  setPosition(pos: vec2) {
    super.setPosition(pos);
    this.collider.setPosition(pos);
  }

  /**
   * Sets the object's rotation, in radians.
   *
   * Also sets `this.collider`'s rotation.
   *
   * @param angle The object's new rotation angle (in radians)
   */
  setRotation(angle: number) {
    super.setRotation(angle);
    this.collider.setRotation(angle);
  }
}
