import Shape from "../shapes/shape";

export interface CollisionResult {
  penetrationDepth: number;
}

export default abstract class Bounds extends Shape {
  /**
   * Checks if this bounds is colliding with another bounds object.
   *
   * @param b Another {@link Bounds} to check collisions against
   * @returns {@link CollisionResult} if the bounds are colliding, otherwise false.
   */
  abstract collidingWith(b: Bounds): false | CollisionResult;
}
