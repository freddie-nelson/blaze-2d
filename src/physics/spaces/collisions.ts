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

  manifolds: { collisions: Manifold[]; triggers: Manifold[] };

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
   * Executes a solver on every collision manifold in the space.
   *
   * Make sure to call `this.obtainManifolds` before executing any solvers.
   *
   * @param id The id of the solver to execute
   */
  solve(id: string) {
    const solver = this.solvers[id];

    for (let i = 0; i < solver.iterations; i++) {
      for (const m of this.manifolds.collisions) {
        solver.cb(m);
      }
    }
  }

  /**
   * Fire "collision" and "trigger" events on objects in `this.manifolds`.
   *
   * If both objects in a collision are triggers object `a` will recieve the "trigger" the event.
   */
  fireEvents() {
    for (const m of this.manifolds.collisions) {
      m.a.fireEvent("collision", m);
      m.b.fireEvent("collision", m);
    }

    for (const m of this.manifolds.triggers) {
      if (m.a.isTrigger) {
        m.a.fireEvent("trigger", m);
      } else if (m.b.isTrigger) {
        m.b.fireEvent("trigger", m);
      }
    }
  }

  /**
   * Obtains all collision and trigger manifolds for the current frame.
   *
   * Manifolds are stored in `this.manifolds`
   *
   * obtainManifolds should only be called once per frame.
   *
   * @param delta Time since last frame
   */
  obtainManifolds(delta: number) {
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

        // test collision
        const res = A.testCollision(B);
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

    this.manifolds = { collisions, triggers };
  }
}
