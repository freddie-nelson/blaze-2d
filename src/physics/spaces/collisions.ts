import { vec2 } from "gl-matrix";
import CollisionObject from "../collisionObject";
import solveImpulse from "../solvers/impulse";
import { CollisionSolver } from "../solvers/solver";
import Space from "./space";

/**
 * Information about a collision which has occured between two objects.
 *
 * @field **a** An object in the collision
 * @field **b** Another object in the collision
 * @field **depth** The penetration depth of the collision
 * @field **normal** The collision normal
 */
export interface Manifold {
  a: CollisionObject;
  b: CollisionObject;
  depth: number;
  normal: vec2;
}

/**
 * Represents an infinite space containing {@link CollisionObject}s.
 *
 * Can be used to test for and solve collisions between objects in the space.
 */
export default class CollisionsSpace extends Space<CollisionObject, CollisionSolver> {
  /**
   * Map used to store pairs objects which have had collisisions checked.
   */
  private collisionPairs: Map<CollisionObject, Map<CollisionObject, true>> = new Map();

  /**
   * Creates a {@link CollisionSpace} instance.
   */
  constructor() {
    super();

    this.addSolver(solveImpulse);
  }

  /**
   * Finds and resolves collisions for objects in the space.
   *
   * @param delta The time since the last frame
   */
  step(delta: number) {
    const manifolds = this.obtainManifolds();
    this.solveManifolds(manifolds);
  }

  private solveManifolds(manifolds: Manifold[]) {
    for (const m of manifolds) {
      for (const s of this.solvers) {
        s(m);
      }
    }
  }

  private obtainManifolds(): Manifold[] {
    const manifolds: Manifold[] = [];

    this.collisionPairs.clear();
    let checks = 0;

    // check every object against every other object for collisions
    // collision checks are only performed between unique pairs
    for (const A of this.objects) {
      const colliderA = A.collider;

      this.collisionPairs.set(A, new Map());

      for (const B of this.objects) {
        // skip check if objects are the same or pair has already been checked
        if (A === B || this.collisionPairs.get(B)?.get(A)) continue;
        checks++;

        // mark pair as checked in collision map
        this.collisionPairs.get(A).set(B, true);

        const colliderB = B.collider;

        // test collision
        const res = colliderA.testCollision(colliderB);
        if (res.hasCollision) {
          manifolds.push({
            a: A,
            b: B,
            depth: res.depth,
            normal: res.normal,
          });
        }
      }
    }

    return manifolds;
  }
}
