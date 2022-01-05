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
   * @param distSqr The maximum distance squared a neighbour can be from the particle
   */
  findNeighbours(particle: Particle, distSqr: number) {
    const neighbours: Particle[] = [];
    if (this.root) this.findNeighboursHelper(particle, particle.getPosition(), distSqr, this.root, 0, neighbours);

    return neighbours;
  }

  private findNeighboursHelper(
    particle: Particle,
    pos: vec2,
    distSqr: number,
    node: kdNode,
    depth: number,
    neighbours: Particle[],
  ) {
    const k = 2;
    const axis = depth % k;

    let next: kdNode;
    if (node.isLeaf()) {
      const d = vec2.sqrDist(pos, node.particle.getPosition());
      if (d <= distSqr && node.particle !== particle) {
        neighbours.push(node.particle);
        return;
      }
    } else {
      if (pos[axis] <= node.particle.getPosition()[axis]) {
        next = node.left;
      } else {
        next = node.right;
      }

      if (!next) return;

      this.findNeighboursHelper(particle, pos, distSqr, next, depth + 1, neighbours);
    }

    const d = vec2.sqrDist(pos, node.particle.getPosition());
    if (d <= distSqr && node.particle !== particle) {
      neighbours.push(node.particle);
    }

    // if (node.left) this.findNeighboursHelper(particle, pos, distSqr, node.left, depth + 1, neighbours);
    // if (node.right) this.findNeighboursHelper(particle, pos, distSqr, node.right, depth + 1, neighbours);

    const other = next === node.left ? node.right : node.left;
    if (!other) return;

    // check if other branch (plane) is close enough to contain neighbours
    if (Math.abs(pos[axis] - node.particle.getPosition()[axis]) ** 2 <= distSqr) {
      // traverse other branch
      this.findNeighboursHelper(particle, pos, distSqr, other, depth + 1, neighbours);
    }
  }
}
