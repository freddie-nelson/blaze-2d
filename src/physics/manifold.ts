import { vec2 } from "gl-matrix";
import { cross2DWithScalar } from "../utils/vectors";
import CircleCollider from "./collider/circle";
import { CollisionResult } from "./collider/collider";
import CollisionObject from "./collisionObject";

interface Edge {
  p0: vec2;
  p1: vec2;
  e: vec2;
  max: vec2;
}

/**
 * Information about a collision which has occured between two objects.
 */
export default class Manifold {
  /**
   * An object in the collision.
   */
  a: CollisionObject;

  /**
   * Another object in the collision.
   */
  b: CollisionObject;

  /**
   * The penetration depth of the collision.
   */
  depth: number;

  /**
   * The collision normal, should always point from **a** to **b**.
   */
  normal: vec2;

  /**
   * Minimum restitution between **a** and **b**.
   */
  epsilon: number;

  /**
   * static friction scalar.
   */
  sf: number;

  /**
   * dynamic friction scalar.
   */
  df: number;

  contactPoints: vec2[];

  /**
   * Creates a {@link Manifold} describing a collision between **a** and **b** in detail.
   *
   * @param a First collision object
   * @param b Second collision object
   * @param collision {@link CollisionResult} from collision test
   */
  constructor(a: CollisionObject, b: CollisionObject, collision: CollisionResult) {
    this.a = a;
    this.b = b;
    this.depth = collision.depth;
    this.normal = collision.normal;

    // calculate restitution
    // smallest value from a and b is used
    this.epsilon = Math.min(a.restitution, b.restitution);

    // friction
    this.sf = Math.sqrt(a.staticFriction * b.staticFriction);
    this.df = Math.sqrt(a.dynamicFriction * b.dynamicFriction);

    this.contactPoints = this.calculateContactPoints();
    console.log(this.contactPoints);
  }

  private calculateContactPoints() {
    if (this.a.collider instanceof CircleCollider) {
      return [this.a.collider.findFurthestPoint(this.normal)];
    }

    const e1 = this.bestEdge(this.a, this.normal);
    const e2 = this.bestEdge(this.b, vec2.scale(vec2.create(), this.normal, -1));

    // identify reference and incident edge for clipping
    let ref: Edge;
    let inc: Edge;
    let flip = false;

    if (Math.abs(vec2.dot(e1.e, this.normal)) <= Math.abs(vec2.dot(e2.e, this.normal))) {
      ref = e1;
      inc = e2;
    } else {
      ref = e2;
      inc = e1;

      // we need to set a flag indicating that the reference
      // and incident edge were flipped so that when we do the final
      // clip operation, we use the right edge normal
      flip = true;
    }

    // perform clipping
    vec2.normalize(ref.e, ref.e);

    const o1 = vec2.dot(ref.e, ref.p0);

    // clip the incident edge by the first vertex of the reference edge
    let cp = this.clipPoints(inc.p0, inc.p1, ref.e, o1);
    if (cp.length < 2) return;

    // clip whats left of the incident edge by the second vertex of
    // the reference edge
    // but we need to clip in opposite direction so we flip the
    // direction and offset
    const o2 = vec2.dot(ref.e, ref.p1);
    cp = this.clipPoints(cp[0], cp[1], vec2.negate(vec2.create(), ref.e), -o2);
    if (cp.length < 2) return;

    // calculate 2d vector cross product with scalar
    const refNorm = cross2DWithScalar(vec2.create(), ref.e, -1);

    // if we had to flip the incident and reference edges
    // then we need to flip the ref edge normal to clip properly
    if (flip) vec2.negate(refNorm, refNorm);

    // get the largest depth
    const max = vec2.dot(refNorm, ref.max);

    // make sure the final points are not past this maximum
    let removed = false;
    if (vec2.dot(refNorm, cp[0]) - max < 0) {
      cp.shift();
      removed = true;
    }
    const i = removed ? 0 : 1;
    if (vec2.dot(refNorm, cp[i]) - max < 0) {
      cp.splice(i, 1);
    }

    return cp;
  }

  private bestEdge(obj: CollisionObject, direction: vec2): Edge {
    const points = obj.collider.findFurthestNeighbours(direction);

    const l = vec2.sub(vec2.create(), points.furthest, points.left);
    const r = vec2.sub(vec2.create(), points.furthest, points.right);

    if (vec2.dot(r, direction) <= vec2.dot(l, direction)) {
      // the right edge is better
      // make sure to retain the winding direction
      return {
        max: points.furthest,
        p0: points.right,
        p1: points.furthest,
        e: r,
      };
    } else {
      // the left edge is better
      // make sure to retain the winding direction
      return {
        max: points.furthest,
        p0: points.furthest,
        p1: points.left,
        e: vec2.scale(l, l, -1),
      };
    }
  }

  /**
   * Clips the edge points (p0, p1) if they are past **o** along the direction.
   *
   * @param p0 The first point to clip
   * @param p1 The second point to clip
   * @param direction The direction to clip in
   * @param o The vector to clip past
   */
  private clipPoints(p0: vec2, p1: vec2, direction: vec2, o: number) {
    const clipped: vec2[] = [];

    const d1 = vec2.dot(direction, p0) - o;
    const d2 = vec2.dot(direction, p1) - o;

    // if either point is past o along n then we can keep it
    if (d1 >= 0) clipped.push(p0);
    if (d2 >= 0) clipped.push(p1);

    // finally we need to check if they are on opposing sides
    // so that we can compute the correct point
    if (d1 * d2 < 0) {
      // if they are on different sides of the offset, d1 and d2
      // will be (+) * (-) and will yield a negative result
      // therefore be less than zero

      //get the vector for the edge we are clipping;
      const e = vec2.sub(vec2.create(), p1, p0);

      // compute the location along e
      const u = d1 / (d1 - d2);
      vec2.scale(e, e, u);
      vec2.add(e, e, p0);

      // add the point
      clipped.push(e);
    }

    return clipped;
  }
}
