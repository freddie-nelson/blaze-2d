import { vec2 } from "gl-matrix";
import BatchRenderer from "../../renderer/batchRenderer";
import FluidRenderer from "../../renderer/fluidRenderer";
import Circle from "../../shapes/circle";
import Texture from "../../texture/texture";
import Color from "../../utils/color";
import Physics from "../physics";
import solveForces from "../solvers/dynamics/forces";
import Particle from "./particle";

export const MAX_FLUID_PARTICLES = 1000;

export interface FluidOptions {
  restDensity: number;
  smoothingRadius: number;
  stiffness: number;
  stiffnessNear: number;

  particleRadius: number;
  maxParticles: number;
  collisionGroup: number;

  color?: Color;
  zIndex?: number;
  renderThreshold?: number;

  debug?: boolean;
  debugTex?: Texture;
}

/**
 * Simulates a fluid using SPH (Smooth Particle Hydrodynamics).
 *
 * @see [SPH Fluid Sim in Processing](https://hmbd.wordpress.com/2019/06/10/sph-fluid-simulation-in-processing/)
 * @see [Processing Code](https://github.com/DanielsSim/hmbd/blob/master/Processing/SPH/Fluid.pde)
 * @see [Particle-based Viscoelastic Fluid Sim](http://www.ligum.umontreal.ca/Clavet-2005-PVFS/pvfs.pdf)
 */
export default class Fluid {
  particles: Particle[] = [];

  restDensity: number;
  smoothingRadius: number;
  smoothingRadiusSqr: number;
  stiffness: number;
  stiffnessNear: number;

  particleRadius: number;
  maxParticles: number;
  collisionGroup: number;

  color: Color;
  renderThreshold: number;

  /**
   * The z layer of the fluid.
   */
  zIndex: number;

  debug: boolean;
  debugTex: Texture;
  debugShapes: Map<Particle, Circle> = new Map();

  /**
   * The physics world the fluid sim was added to.
   */
  physics: Physics;

  /**
   * Creates an {@link Fluid} with the given options.
   *
   * @param opts The options to setup the fluid with
   */
  constructor(opts: FluidOptions) {
    this.restDensity = opts.restDensity;
    this.smoothingRadius = opts.smoothingRadius;
    this.smoothingRadiusSqr = opts.smoothingRadius * opts.smoothingRadius;
    this.stiffness = opts.stiffness;
    this.stiffnessNear = opts.stiffnessNear;

    this.particleRadius = opts.particleRadius;
    this.maxParticles = Math.min(opts.maxParticles, MAX_FLUID_PARTICLES);
    this.collisionGroup = opts.collisionGroup;

    this.color = opts.color || new Color("#1D7BE3");
    this.zIndex = opts.zIndex || 0;
    this.renderThreshold = opts.renderThreshold || 1;

    this.debug = opts.debug || false;
    this.debugTex = opts.debugTex;
  }

  /**
   * Adds a particle to the fluid at the given position.
   *
   * @param pos The position to create the particle at in world space.
   * @returns Wether or not the particle was added
   */
  addParticle(pos: vec2) {
    if (this.particles.length >= this.maxParticles) return false;

    const particle = new Particle(this.particleRadius, this.restDensity / 10);
    particle.setPosition(pos);
    particle.filter.group = this.collisionGroup;

    this.particles.push(particle);

    if (this.physics) {
      this.physics.addCollisionObj(particle);
    }

    return true;
  }

  /**
   * Steps the fluid simulation forward in time.
   *
   * @param delta The time since the last update
   */
  update(delta: number) {
    const gravity = this.physics.getGravity() || vec2.create();
    this.integrate(delta, gravity);

    for (const p of this.particles) {
      p.findNeighbours(this.particles, this.smoothingRadiusSqr);

      p.computeDoubleDensityRelaxation(this.smoothingRadius);
      p.computePressure(this.stiffness, this.stiffnessNear, this.restDensity);
      p.advancePosition(delta, this.smoothingRadius);
    }

    for (const p of this.particles) {
      p.computeNewVelocity(delta, gravity);
    }

    if (this.debug) this.debugRender();
  }

  /**
   * Integrate any forces on the particle, including gravity, and integrate velocity.
   *
   * Also resets the particle's density from the last update.
   *
   * @param delta The time since the last update
   */
  integrate(delta: number, gravity: vec2) {
    const translate = vec2.create();

    for (const p of this.particles) {
      p.density = 0;
      p.densityNear = 0;

      // integrate forces
      solveForces(p, delta, gravity);

      // integrate velocity
      vec2.copy(p.posPrev, p.getPosition());

      p.translate(vec2.scale(translate, p.velocity, delta));
    }
  }

  /**
   * Queues the fluid to be renderer using the fluid renderer.
   */
  render() {
    FluidRenderer.queueFluid(this);
  }

  /**
   * Renders the particles of the fluid as individual circles.
   */
  debugRender() {
    const circles: Circle[] = [];

    for (const p of this.particles) {
      let circle: Circle;
      if (this.debugShapes.has(p)) {
        circle = this.debugShapes.get(p);
      } else {
        circle = new Circle(this.particleRadius);
        circle.texture = this.debugTex;

        this.debugShapes.set(p, circle);
      }

      circle.setPosition(p.getPosition());
      circles.push(circle);
    }

    BatchRenderer.queueCircles(circles);
  }
}
