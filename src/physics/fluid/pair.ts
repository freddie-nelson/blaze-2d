import { vec2 } from "gl-matrix";
import Particle from "./particle";

/**
 * Stores information needed to solve the SPH for two particles in a fluid.
 */
export default class ParticlePair {
  a: Particle;
  b: Particle;

  diff: vec2;
  diffLen: number;

  q: number;
  qFlip: number; // 1 - q
  qFlip2: number;
  qFlip3: number;

  /**
   * Creates an {@link ParticlePair}
   *
   * @param a A particle in the pair
   * @param b A particle in the pair
   */
  constructor(a: Particle, b: Particle) {
    this.a = a;
    this.b = b;
  }
}
