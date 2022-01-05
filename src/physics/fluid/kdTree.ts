import { vec2 } from "gl-matrix";
import Particle from "./particle";

export class kdNode {
  particle: Particle;

  left: kdNode;
  right: kdNode;

  constructor(particle: Particle, left: kdNode, right: kdNode) {
    this.particle = particle;
    this.left = left;
    this.right = right;
  }

  /**
   * Determines wether the node is a leaf node or not.
   *
   * @returns Wether the node is a leaf node or not
   */
  isLeaf() {
    return !this.left && !this.right;
  }
}

/**
 * Represents a kdTree that contains {@link Particle}s.
 */
export default class kdTree {
  root: kdNode;

  /**
   * Creates a {@link kdTree}.
   *
   * @param particles The particles to add to the tree
   */
  constructor(particles: Particle[]) {
    this.build(particles);
  }

  /**
   * Builds the {@link kdTree}.
   *
   * @param particles The particles to add to the tree
   */
  build(particles: Particle[], depth = 0): kdNode {
    if (particles.length === 0) return;

    const k = 2;
    const axis = depth % k;

    // TODO - Use median of medians partition algorithm to split particles array
    // @see - https://en.wikipedia.org/wiki/Median_of_medians
    particles.sort((a, b) => a.getPosition()[axis] - b.getPosition()[axis]);
    const median = Math.floor(particles.length / 2);

    if (depth === 0) {
      // console.log(particles[median]);
      this.root = new kdNode(
        particles[median],
        this.build(particles.slice(0, median), depth + 1),
        this.build(particles.slice(median + 1), depth + 1),
      );
      return this.root;
    } else {
      return new kdNode(
        particles[median],
        this.build(particles.slice(0, median), depth + 1),
        this.build(particles.slice(median + 1), depth + 1),
      );
    }
  }

  /**
   * Finds all the neighbours of a particle within the given distance.
   *
   * @param particle The particle to find neighbours of
   * @param dist The maximum distance a neighbour can be from the particle
   * @param distSqr The maximum distance squared a neighbour can be from the particle
   */
  findNeighbours(particle: Particle, dist: number, distSqr: number) {
    const neighbours: Particle[] = [];
    if (this.root) this.findNeighboursHelper(particle, particle.getPosition(), dist, distSqr, this.root, 0, neighbours);

    return neighbours;
  }

  private findNeighboursHelper(
    particle: Particle,
    pos: vec2,
    dist: number,
    distSqr: number,
    node: kdNode,
    depth: number,
    neighbours: Particle[],
  ) {
    if (!node) return;

    if (node.isLeaf()) {
      const d = vec2.sqrDist(pos, node.particle.getPosition());
      if (d < distSqr && node.particle !== particle) {
        neighbours.push(node.particle);
        return;
      }
    } else {
      const k = 2;
      const axis = depth % k;

      const d = vec2.sqrDist(pos, node.particle.getPosition());
      if (d < distSqr && node.particle !== particle) {
        neighbours.push(node.particle);
      }

      if (pos[axis] < node.particle.getPosition()[axis]) {
        // search left first
        this.findNeighboursHelper(particle, pos, dist, distSqr, node.left, depth + 1, neighbours);

        if (pos[axis] + dist >= node.particle.getPosition()[axis])
          this.findNeighboursHelper(particle, pos, dist, distSqr, node.right, depth + 1, neighbours);
      } else {
        // search right first
        this.findNeighboursHelper(particle, pos, dist, distSqr, node.right, depth + 1, neighbours);

        if (pos[axis] - dist <= node.particle.getPosition()[axis])
          this.findNeighboursHelper(particle, pos, dist, distSqr, node.left, depth + 1, neighbours);
      }
    }

    // const d = vec2.sqrDist(pos, node.particle.getPosition());
    // if (d <= distSqr && node.particle !== particle) {
    //   neighbours.push(node.particle);
    // }

    // if (node.left) this.findNeighboursHelper(particle, pos, dist, distSqr, node.left, depth + 1, neighbours);
    // if (node.right) this.findNeighboursHelper(particle, pos, dist, distSqr, node.right, depth + 1, neighbours);

    // const other = next === node.left ? node.right : node.left;
    // if (!other) return;

    // // check if other branch (plane) is close enough to contain neighbours
    // if (Math.abs(pos[axis] - node.particle.getPosition()[axis]) ** 2 <= distSqr) {
    //   // traverse other branch
    //   this.findNeighboursHelper(particle, pos, distSqr, other, depth + 1, neighbours);
    // }
  }
}
