import { vec2, vec3 } from "gl-matrix";
import Object2D from "../object2d";
import { cross2D } from "../utils/vectors";

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
   *
   * This value should be between 0 and 1 for best results.
   */
  restitution = 0;

  /**
   * Coefficient of static friction.
   *
   * This value should be between 0 and 1 for best results.
   *
   * @see [Static And Kinetic Friction](https://www.geeksforgeeks.org/static-and-kinetic-friction/)
   */
  staticFriction = 0.1;

  /**
   * Coefficient of dynamic/kinetic friction.
   *
   * This value should be between 0 and 1 for best results.
   *
   * @see [Static And Kinetic Friction](https://www.geeksforgeeks.org/static-and-kinetic-friction/)
   */
  dynamicFriction = 0.1;

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
   * The damping applied to the object's linear velocity every physics update.
   */
  airFriction = 0;

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

  /**
   * The damping applied to the object's angular velocity every physics update.
   */
  angularDamping = 0;

  // OPTIONS

  /**
   * Wether or not the object should take gravity from the physics world.
   */
  takesGravity = true;

  /**
   * Wether or not the object's x position is locked.
   *
   * When true the object's x position will not be affected by collisions or dynamics.
   */
  lockXAxis = false;

  /**
   * Wether or not the object's y position is locked.
   *
   * When true the object's y position will not be affected by collisions or dynamics.
   */
  lockYAxis = false;

  /**
   * Wether or not the object can rotate.
   *
   * When true the object's rotation will not be affected by collisions or dynamics.
   */
  lockRotation = false;

  /**
   * Creates a {@link PhysicsObject} with a mass and restitution.
   *
   * @param mass The mass of the object
   * @param restitution The restituion (bounciness) of the object
   */
  constructor(mass = 1, restitution = 0) {
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
   * If no contact point is provided then the force will be applied at the
   * object's centre, generating 0 torque.
   *
   * @param force The force vector to apply
   * @param contact The local position on the body to apply the force at
   */
  applyForce(force: vec2, contact?: vec2) {
    vec2.add(this.force, this.force, force);

    if (contact) {
      this.torque += contact[0] * force[1] - contact[1] * force[0];
    }
  }

  private forceVec = vec2.create();

  /**
   * Applies a force to the object at an angle.
   *
   * The direction vector is calculated from the unit y+ vector.
   *
   * If no contact point is provided then the force will be applied at the
   * object's centre, generating 0 torque.
   *
   * @param force The force to apply in newtons
   * @param angle The angle at which to apply the force in radians (world space)
   * @param contact The local position on the body to apply the force at
   */
  applyForceAtAngle(force: number, angle: number, contact?: vec2) {
    const dir = vec2.fromValues(0, 1);
    vec2.rotate(dir, dir, vec2.create(), angle);

    vec2.scale(this.forceVec, dir, force);

    vec2.add(this.force, this.force, this.forceVec);

    if (contact) {
      this.torque += contact[0] * this.forceVec[1] - contact[1] * this.forceVec[0];
    }
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
    this.angularVelocity += this.inverseInertia * cross2D(contactVector, impulse);
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

    if (mass === 0) this.setInertia(0);
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
