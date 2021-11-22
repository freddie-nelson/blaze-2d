import { vec2 } from "gl-matrix";
import Object2D from "../object2d";

/**
 * Represents an object in 2D world space that can experience physics.
 */
export default class PhysicsObject extends Object2D {
  /**
   * The gravitational froce applied to the object.
   */
  gravity = vec2.fromValues(0, -9.8);

  // PROPERTIES

  /**
   * Mass of object in kg
   */
  mass = 1;

  /**
   * Elasticity/bounciness
   */
  restitution = 0;

  // POSITIONAL MOMENTUM

  /**
   * The net force applied to the object in newtons.
   */
  force = vec2.create();

  /**
   * The object's velocity in world space units (metres).
   */
  velocity = vec2.create();

  /**
   * Coefficient of static friction.
   *
   * @see [Static And Kinetic Friction](https://www.geeksforgeeks.org/static-and-kinetic-friction/)
   */
  staticFriction = 1;

  /**
   * Coefficient of dynamic/kinetic friction.
   *
   * @see [Static And Kinetic Friction](https://www.geeksforgeeks.org/static-and-kinetic-friction/)
   */
  dynamicFriction = 1;

  // ROTATIONAL MOMENTUM

  /**
   * The object's torque in newtons, can be thought of as rotational force.
   */
  torque = 0;

  /**
   * The object's angular velocity in radians per second.
   */
  angularVelocity = 0;

  /**
   * The object's moment of inertia (resistance to rotation).
   */
  inertia = 1;

  // OPTIONS

  /**
   * Wether or not the object should take gravity from the physics world.
   */
  takesGravity = true;

  /**
   * Creates a {@link PhysicsObject} with a mass and restitution.
   *
   * @param mass The mass of the object
   * @param restitution The restituion (bounciness) of the object
   */
  constructor(mass = 1, restitution = 0) {
    super();

    this.mass = mass;
    this.restitution = restitution;

    this.setupEvents();
  }

  protected setupEvents() {
    super.setupEvents();
  }
}
