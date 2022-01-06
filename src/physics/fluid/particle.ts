import { vec2 } from "gl-matrix";
import CircleCollider from "../collider/circle";
import RigidBody from "../rigidbody";
import solveForces from "../solvers/dynamics/forces";
import kdTree from "./kdTree";

const diff = vec2.create();
const dir = vec2.create();
const negDir = vec2.create();

export default class Particle extends RigidBody {
  private radius: number;

  density: number;
  densityNear: number;

  pressure: number;
  pressureNear: number;

  dx: vec2;
  posPrev: vec2;

  neighbours: Particle[];

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

    this.neighbours = [];
  }

  /**
   * Finds particles which are closer to this particle than the fluid's smoothing radius.
   *
   * Particles which are closer than this distance are added to this particle's neighbours array.
   *
   * @param kdTree The {@link kdTree} of the fluid
   * @param smoothingRadius The fluid's smoothing radius
   * @param smoothingRadiusSqr The fluid's smoothing radius squared
   */
  findNeighbours(kdTree: kdTree, smoothingRadius: number, smoothingRadiusSqr: number) {
    this.neighbours = kdTree.findNeighbours(this, smoothingRadius, smoothingRadiusSqr);
  }

  /**
   * Computes the density and density near of the particle based on it's neighbours.
   *
   * @param smoothingRadius The smoothing radius of the fluid
   */
  computeDoubleDensityRelaxation(smoothingRadius: number) {
    let diffLen = 0;
    let q = 0;
    let qFlip = 0;
    let qFlipSqr = 0;

    this.density = 0;
    this.densityNear = 0;

    for (const n of this.neighbours) {
      vec2.sub(diff, n.getPosition(), this.getPosition());
      diffLen = vec2.len(diff);
      q = diffLen / smoothingRadius;

      if (q < 1) {
        qFlip = 1 - q;
        qFlipSqr = qFlip ** 2;

        this.density += qFlipSqr;
        this.densityNear += qFlipSqr * qFlip;
      }
    }
  }

  /**
   * Calculate the pressure the particle based on it's neighbours.
   *
   * @param restDensity The rest density of the fluid
   */
  computePressure(stiffness: number, stiffnessNear: number, restDensity: number) {
    this.pressure = stiffness * (this.density - restDensity);
    this.pressureNear = stiffnessNear * this.densityNear;
  }

  /**
   * Advanced the particle's position.
   *
   * @param delta The time since the last update
   * @param smoothingRadius The smoothing radius of the fluid
   */
  advancePosition(delta: number, smoothingRadius: number) {
    let diffLen = 0;
    let q = 0;
    let qFlip = 0;
    let qFlipSqr = 0;

    vec2.zero(this.dx);

    for (const n of this.neighbours) {
      vec2.sub(diff, n.getPosition(), this.getPosition());
      diffLen = vec2.len(diff);
      q = diffLen / smoothingRadius;

      if (q < 1) {
        qFlip = 1 - q;
        qFlipSqr = qFlip ** 2;

        vec2.normalize(dir, diff);

        vec2.scale(dir, dir, delta * delta * (this.pressure * qFlip + this.pressureNear * qFlipSqr) * 0.5);

        this.translate(vec2.negate(negDir, dir));
        n.translate(dir);

        vec2.sub(this.dx, this.dx, dir);
      }
    }

    this.translate(this.dx);
  }

  /**
   * Comptues the particle's new velocity and performs the second force solving pass.
   *
   * @param delta The time since the last update
   * @param gravity The physics world's gravity vector
   */
  computeNewVelocity(delta: number, gravity: vec2) {
    // compute new velocity
    vec2.sub(this.velocity, this.getPosition(), this.posPrev);
    vec2.scale(this.velocity, this.velocity, 1 / delta);

    // integrate forces
    solveForces(this, delta, gravity);
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
