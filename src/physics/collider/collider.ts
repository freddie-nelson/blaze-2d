import { vec2 } from "gl-matrix";
import Shape from "../../shapes/shape";
import PhysicsObject from "../object";
import MeshCollider from "./meshCollider";

/**
 * Describes a collision between two {@link Collider}s (A and B).
 *
 * @field `a` The furthest point on collider **A** inside collider **B**
 * @field `b` The furthest point on collider **B** inside collider **A**
 * @field `normal` vector `b - a` normalised
 * @field `depth` The length of the vector `b - a`
 * @field `hasCollision` Wether or not the A and B are colliding
 */
export interface CollisionResult {
  a: vec2;
  b: vec2;
  normal: vec2;
  depth: number;
  hasCollision: boolean;
}

export default abstract class Collider extends Shape {
  abstract isMeshCollider: boolean;

  /**
   * Checks if this collider is colliding with another collider.
   *
   * @param c {@link Collider} to test collisions against
   * @returns {@link CollisionResult} with the results of the test
   */
  abstract testCollision(c: Collider): CollisionResult;

  /**
   * Checks if this collider is colliding with another mesh collider.
   *
   * @param c {@link MeshCollider} to test collisions against
   * @returns {@link CollisionResult} with the results of the test
   */
  abstract testMeshCollision(c: MeshCollider): CollisionResult;
}
