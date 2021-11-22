import Shape from "../../shapes/shape";
import PhysicsObject from "../object";

export interface CollisionResult {
  penetrationDepth: number;
}

export default abstract class Collider extends Shape {
  /**
   * Checks if this bounds is colliding with another bounds object.
   *
   * @param b Another {@link Collider} to check collisions against
   * @returns {@link CollisionResult} if the bounds are colliding, otherwise false.
   */
  abstract collidingWith(b: Collider): false | CollisionResult;
}
