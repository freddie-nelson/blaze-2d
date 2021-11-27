import { vec2 } from "gl-matrix";
import { CollisionResult } from "../collider/collider";
import CollisionObject from "../collisionObject";
import Manifold from "../manifold";
import { CollisionSolver } from "../solvers/solver";
import Space from "./space";

/**
 * Represents an infinite space containing {@link CollisionObject}s.
 *
 * Can be used to test for and solve collisions between objects in the space.
 */
export default class CollisionsSpace extends Space<CollisionObject, CollisionSolver> {
  gravity: vec2;

  /**
   * Map used to store pairs objects which have had collisisions checked.
   */
  private collisionPairs: Map<CollisionObject, Map<CollisionObject, true>> = new Map();

  /**
   * Creates a {@link CollisionSpace} instance.
   *
   * @param gravity The gravity vector to use in the collision space
   */
  constructor(gravity: vec2) {
    super();

    this.gravity = gravity;
  }

  /**
   * Finds and resolves collisions for objects in the space.
   *
   * @param delta The time since the last frame
   */
  step(delta: number) {
    const manifolds = this.obtainManifolds(delta);
    this.solveManifolds(manifolds.collisions);

    this.fireTriggerEvents(manifolds.triggers);
  }

  private solveManifolds(manifolds: Manifold[]) {
    for (const solver of this.solvers) {
      for (let i = 0; i < solver.iterations; i++) {
        for (const m of manifolds) {
          solver.cb(m);
        }
      }
    }

    for (const m of manifolds) {
      m.a.fireEvent("collision", m);
      m.b.fireEvent("collision", m);
    }
  }

  /**
   * Fire the "trigger" event on trigger collision objects.
   *
   * If both objects in a collision are triggers object `a` will recieve the event.
   *
   * @param triggers Array of manifolds describing collisions involving a {@link CollisionObject} with `isTrigger = true`
   */
  private fireTriggerEvents(triggers: Manifold[]) {
    for (const m of triggers) {
      if (m.a.isTrigger) {
        m.a.fireEvent("trigger", m);
      } else if (m.b.isTrigger) {
        m.b.fireEvent("trigger", m);
      }
    }
  }

  private obtainManifolds(delta: number): { collisions: Manifold[]; triggers: Manifold[] } {
    const collisions: Manifold[] = [];
    const triggers: Manifold[] = [];

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
          const manifold = new Manifold(A, B, res, this.gravity, delta);

          // console.log(
          //   vec2.dot(manifold.normal, vec2.sub(vec2.create(), B.getPosition(), A.getPosition())) > 0,
          //   manifold.normal
          // );

          if (A.isTrigger || B.isTrigger) {
            triggers.push(manifold);
          } else {
            collisions.push(manifold);
          }
        }
      }
    }

    return { collisions, triggers };
  }
}
