import { vec2, vec3 } from "gl-matrix";
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
   * Mass of object in kg.
   *
   * When set to 0 the object's mass is effectively infinite.
   */
  private mass = 1;

  /**
   * The inverse of the object's mass (1 / mass).
   */
  private inverseMass = 1;

  /**
   * Elasticity/bounciness
   */
  restitution = 10;

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
   *
   * When set to 0 the object's inertia is effectively infinite.
   */
  private inertia = 1;

  /**
   * The inverse of the object's inertia (1 / inertia).
   */
  private inverseInertia = 1;

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
  constructor(mass = 1, restitution = 0.3) {
    super();

    this.setMass(mass);
    this.restitution = restitution;

    this.setupEvents();
  }

  protected setupEvents() {
    super.setupEvents();
  }

  /**
   * Adds a force to the object's current total force vector.
   *
   * @param force The force vector to apply
   */
  applyForce(force: vec2) {
    vec2.add(this.force, this.force, force);
  }

  /**
   * Applies a force to the object at an angle.
   *
   * The direction vector is calculated from the unit y+ vector.
   *
   * @param force The force to apply in newtons
   * @param angle The angle at which to apply the force in radians (world space)
   */
  applyForceAtAngle(force: number, angle: number) {
    const dir = vec2.fromValues(0, 1);
    vec2.rotate(dir, dir, vec2.create(), angle);

    vec2.scaleAndAdd(this.force, this.force, dir, force);
  }

  /**
   * Applies an impulse to the physics object.
   *
   * This will apply an instantaneous change to the object's angular and linear velocity.
   *
   * @param impulse The impulse to apply
   * @param contactVector A vector from the object's center to the contact point
   */
  applyImpulse(impulse: vec2, contactVector: vec2) {
    vec2.scaleAndAdd(this.velocity, this.velocity, impulse, this.inverseMass);
    this.angularVelocity += this.inverseInertia * vec2.cross(vec3.create(), contactVector, impulse)[2];
  }

  /**
   * Sets the mass of the object in kg.
   *
   * Also computes the inverse mass.
   *
   * **NOTE: Setting the mass to 0 will act as infinite mass.**
   *
   * @param mass The objects new mass
   */
  setMass(mass: number) {
    this.mass = mass;
    this.inverseMass = mass === 0 ? 0 : 1 / mass;
  }

  /**
   * Gets the mass of the object.
   *
   * @returns The mass of the object
   */
  getMass() {
    return this.mass;
  }

  /**
   * Gets the inverse mass of the object (1 / mass).
   *
   * @returns The inverse mass of the object
   */
  getInverseMass() {
    return this.inverseMass;
  }

  /**
   * Sets the moment of inertia of the object.
   *
   * Also computes the inverse inertia.
   *
   * **NOTE: Setting the inertia to 0 will act as infinite inertia.**
   *
   * @param inertia The objects new inertia
   */
  setInertia(inertia: number) {
    this.inertia = inertia;
    this.inverseInertia = inertia === 0 ? 0 : 1 / inertia;
  }

  /**
   * Gets the moment of inertia of the object.
   *
   * @returns The inertia of the object
   */
  getInertia() {
    return this.inertia;
  }

  /**
   * Gets the inverse moment of inertia of the object (1 / inertia).
   *
   * @returns The inverse inertia of the object
   */
  getInverseInertia() {
    return this.inverseInertia;
  }
}
