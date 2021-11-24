import CollisionObject from "../collisionObject";
import Space from "./space";

/**
 * Represents an infinite space containing {@link CollisionObject}s.
 *
 * Can be used to test for and solve collisions between objects in the space.
 */
export default class CollisionsSpace extends Space<CollisionObject> {
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
    // check every object against every other object for collisions
    for (const A of this.objects) {
      const colliderA = A.collider;

      for (const B of this.objects) {
        // skip check if objects are the same
        if (A === B) continue;

        const colliderB = B.collider;

        // test collision
        const res = colliderA.testCollision(colliderB);
        if (res.hasCollision) {
          // console.log(colliderA, colliderB);
        }
      }
    }
  }
}
