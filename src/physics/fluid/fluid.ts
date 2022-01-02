import { vec2 } from "gl-matrix";
import Logger from "../../logger";
import BatchRenderer from "../../renderer/batchRenderer";
import Renderer from "../../renderer/renderer";
import Circle from "../../shapes/circle";
import Texture from "../../texture/texture";
import Physics from "../physics";
import solveForces from "../solvers/dynamics/forces";
import ParticlePair from "./pair";
import Particle from "./particle";

export interface FluidOptions {
  restDensity: number;
  smoothingRadius: number;
  stiffness: number;
  stiffnessNear: number;

  particleRadius: number;
  maxParticles: number;
  collisionGroup: number;

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
  pairs: ParticlePair[] = [];

  restDensity: number;
  smoothingRadius: number;
  smoothingRadiusSqr: number;
  stiffness: number;
  stiffnessNear: number;

  particleRadius: number;
  maxParticles: number;
  collisionGroup: number;

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
    this.maxParticles = opts.maxParticles;
    this.collisionGroup = opts.collisionGroup;

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
    this.integrate(delta);

    // const timer = performance.now();
    this.findPairs();
    // console.log(performance.now() - timer);

    this.computeDoubleDensityRelaxation(delta);
    this.computePressure(delta);
    this.advancePositions(delta);

    if (this.debug) this.debugRender();
  }

  /**
   * Integrate any forces on the particle, including gravity, and integrate velocity.
   *
   * Also resets the particle's density from the last update.
   *
   * @param delta The time since the last update
   */
  integrate(delta: number) {
    const gravity = this.physics.getGravity() || vec2.create();
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
   * Finds particles which are closer than the fluid's smoothing radius.
   *
   * The pairs are stored in `this.pairs`.
   *
   * Each pair is ready to be solved at creation.
   *
   * @returns The found pairs
   */
  findPairs() {
    this.pairs = [];

    for (const a of this.particles) {
      for (const b of this.particles) {
        if (a === b) continue;

        const sqrDist = vec2.sqrDist(a.getPosition(), b.getPosition());
        if (sqrDist > this.smoothingRadiusSqr) continue;

        const pair = new ParticlePair(a, b);
        this.pairs.push(pair);
      }
    }

    return this.pairs;
  }

  /**
   * Computes the density and density near of each particle in a pair.
   *
   * @param delta The time since the last update
   */
  computeDoubleDensityRelaxation(delta: number) {
    for (const p of this.pairs) {
      p.diff = vec2.sub(vec2.create(), p.b.getPosition(), p.a.getPosition());
      p.diffLen = vec2.len(p.diff);
      p.q = p.diffLen / this.smoothingRadius;

      if (p.q < 1) {
        p.qFlip = 1 - p.q;
        p.qFlip2 = p.qFlip ** 2;

        p.a.density += p.qFlip2;
        // p.b.density += powerOfTemp;

        p.qFlip3 = p.qFlip2 * p.qFlip;
        p.a.densityNear += p.qFlip3;
        // p.b.densityNear += powerOfTemp;
      }
    }
  }

  /**
   * Calculate the pressure of each particle in the fluid.
   *
   * @param delta The time since the last update
   */
  computePressure(delta: number) {
    for (const p of this.particles) {
      p.pressure = this.stiffness * (p.density - this.restDensity);
      p.pressureNear = this.stiffnessNear * p.densityNear;

      vec2.zero(p.dx);
    }
  }

  /**
   * Advanced each pair's particle's positions and then calculate their new velocities.
   *
   * @param delta The time since the last update
   */
  advancePositions(delta: number) {
    const aDir = vec2.create();
    const negADir = vec2.create();

    for (const p of this.pairs) {
      if (p.q < 1) {
        vec2.normalize(aDir, p.diff);
        // const bDir = vec2.negate(vec2.create(), aDir);

        vec2.scale(aDir, aDir, delta * delta * (p.a.pressure * p.qFlip + p.a.pressureNear * p.qFlip2) * 0.5);
        // vec2.scale(bDir, bDir, delta * delta * (p.b.pressure * temp + p.b.pressureNear * temp * temp) * 0.5);

        p.a.translate(vec2.negate(negADir, aDir));
        p.b.translate(aDir);

        vec2.sub(p.a.dx, p.a.dx, aDir);
      }
    }

    for (const p of this.particles) {
      p.translate(p.dx);

      vec2.sub(p.velocity, p.getPosition(), p.posPrev);
      vec2.scale(p.velocity, p.velocity, 1 / delta);
    }
  }

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
