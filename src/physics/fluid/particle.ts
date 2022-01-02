import { vec2 } from "gl-matrix";
import CircleCollider from "../collider/circle";
import CollisionObject from "../collisionObject";
import RigidBody from "../rigidbody";

export default class Particle extends RigidBody {
  private radius: number;

  density: number;
  densityNear: number;

  pressure: number;
  pressureNear: number;

  dx: vec2;
  posPrev: vec2;

  /**
   * Creates a {@link Particle}.
   *
   * @param radius The radius of the particle
   * @param mass The mass of the particle
   */
  constructor(radius: number, mass: number) {
    const collider = new CircleCollider(radius);
    super(collider, mass);

    this.dx = vec2.create();
    this.posPrev = vec2.create();

    this.radius = radius;
    this.lockRotation = true;

    this.density = 0;
    this.densityNear = 0;

    this.pressure = 0;
    this.pressureNear = 0;
  }

  /**
   * Sets the particle's radius.
   *
   * @param radius The particle's new radius
   */
  setRadius(radius: number) {
    this.radius = radius;
    (<CircleCollider>this.collider).setRadius(radius);
  }

  /**
   * Gets the radius of the particle.
   *
   * @returns The particle's radius
   */
  getRadius() {
    return this.radius;
  }
}
