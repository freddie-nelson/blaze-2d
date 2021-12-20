import { vec2 } from "gl-matrix";
import AABB from "../aabb/aabb";
import AABBTree from "../aabb/aabbTree";
import { CollisionResult } from "../collider/collider";
import CollisionObject from "../collisionObject";
import CollisionPair from "../collisionPair";
import Manifold from "../manifold";
import ManifoldMap from "../manifoldMap";
import { CollisionSolver } from "../solvers/solver";
import Space from "./space";

/**
 * Represents an infinite space containing {@link CollisionObject}s.
 *
 * Can be used to test for and solve collisions between objects in the space.
 */
export default class CollisionsSpace extends Space<CollisionObject, CollisionSolver> {
  gravity: vec2;

  collisionManifolds: Manifold[] = [];
  triggerManifolds: Manifold[] = [];

  /**
   * Collision manifolds map.
   */
  collisions = new ManifoldMap();

  /**
   * Trigger manifolds map.
   */
  triggers = new ManifoldMap();

  /**
   * Array used to store pairs of objects which may be colliding.
   */
  collisionPairs: CollisionPair[];

  /**
   * The {@link AABBTree} used for broadphase and raycasting.
   */
  aabbTree = new AABBTree();

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
   * @param delta The time since the last update
   */
  solve(id: string, delta: number) {
    const solver = this.solvers[id];
    if (!solver) return;

    for (let i = 0; i < solver.iterations; i++) {
      for (const m of this.collisionManifolds) {
        solver.cb(m, delta, i, solver.iterations);
      }
    }
  }

  /**
   * Fire "collision" and "trigger" events on objects in `this.manifolds`.
   *
   * If both objects in a collision are triggers object `a` will recieve the "trigger" the event.
   */
  fireEvents() {
    for (const m of this.collisionManifolds) {
      m.a.fireEvent("collision", m);
      m.b.fireEvent("collision", m);
    }

    for (const m of this.triggerManifolds) {
      if (m.a.isTrigger) {
        m.a.fireEvent("trigger", m);
      } else if (m.b.isTrigger) {
        m.b.fireEvent("trigger", m);
      }
    }
  }

  /**
   * Performs the broadphase collision detection.
   *
   * The broadphase will update the {@link AABBTree} and then obtain possible collision pairs for the narrow phase.
   */
  broadphase() {
    this.aabbTree.update();
    this.collisionPairs = this.aabbTree.collectPairs();
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
    // invalidate all manifolds
    this.collisions.killAllManifolds();
    this.triggers.killAllManifolds();

    for (const pair of this.collisionPairs) {
      let A = pair.a;
      let B = pair.b;

      // swap A and B if a manifold already exists for this pair of objects
      // this increases the possibility of contact point caching
      const key = this.collisions.getManifoldKey(A, B) || this.triggers.getManifoldKey(A, B);
      if (key && key.top === B) {
        A = pair.b;
        B = pair.a;
        // console.log("swap");
      }

      // test collision
      const res = A.testCollision(B);
      if (res.hasCollision) {
        const manifold = new Manifold(A, B, res, this.gravity, delta);

        let timer = performance.now();
        if (A.isTrigger || B.isTrigger) {
          this.triggers.addManifold(A, B, manifold);
        } else {
          this.collisions.addManifold(A, B, manifold);
        }
      }
    }

    // remove dead manifolds
    this.collisions.removeDeadManifolds();
    this.triggers.removeDeadManifolds();

    // update manifold arrays
    this.getCollisionManifolds();
    this.getTriggerManifolds();
  }

  /**
   * Gets all the manifolds in the collisions {@link ManifoldMap} and stores them in `this.collisionManifolds`.
   */
  private getCollisionManifolds() {
    this.collisionManifolds = this.collisions.getAllManifolds();
  }

  /**
   * Gets all the manifolds in the triggers {@link ManifoldMap} and stores them in `this.triggersManifolds`.
   */
  private getTriggerManifolds() {
    this.triggerManifolds = this.triggers.getAllManifolds();
  }

  /**
   * Adds an object to the space.
   *
   * @param obj The {@link CollisionObject} to add to the space
   */
  addObject(obj: CollisionObject) {
    const vel = obj.velocity;
    const margin = Math.max(Math.abs(vel[0]), Math.abs(vel[1]));
    this.aabbTree.add(new AABB(obj, margin));

    super.addObject(obj);
  }

  /**
   * Removes an object from the space and deletes any manifolds associated with it.
   *
   * @param obj The {@link CollisionObject} to remove from the space
   */
  removeObject(obj: CollisionObject) {
    this.collisions.removeManifoldsInvolving(obj);
    this.triggers.removeManifoldsInvolving(obj);
    this.aabbTree.remove(obj);

    return super.removeObject(obj);
  }
}
