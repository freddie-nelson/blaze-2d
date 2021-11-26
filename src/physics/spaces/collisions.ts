import { vec2 } from "gl-matrix";
import CollisionObject from "../collisionObject";
import Space from "./space";

/**
 * Represents an infinite space containing {@link CollisionObject}s.
 *
 * Can be used to test for and solve collisions between objects in the space.
 */
export default class CollisionsSpace extends Space<CollisionObject> {
  /**
   * Map used to store pairs objects which have had collisisions checked.
   */
  private collisionPairs: Map<CollisionObject, Map<CollisionObject, true>> = new Map();

  /**
   * Creates a {@link CollisionSpace} instance.
   */
  constructor() {
    super();
  }

  /**
   * Finds and resolves collisions for objects in the space.
   *
   * @param delta The time since the last frame
   */
  step(delta: number) {
    this.findCollisions();
  }

  private findCollisions() {
    this.collisionPairs.clear();

    let checks = 0;

    // check every object against every other object for collisions
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
          // test move A
          // vec2.scaleAndAdd(A.getPosition(), A.getPosition(), res.normal, -res.depth);
          // vec2.copy(colliderA.getPosition(), A.getPosition());
        }
      }
    }

    // console.log(checks);
  }
}
