import { vec2 } from "gl-matrix";
import Renderer from "../renderer/renderer";
import Circle from "../shapes/circle";
import Color from "../utils/color";
import { cross2DWithScalar } from "../utils/vectors";
import CircleCollider from "./collider/circle";
import { CollisionResult } from "./collider/collider";
import CollisionObject from "./collisionObject";
import { calculateRelativeVelocity } from "./solvers/collision/impulse";

interface Edge {
  p0: vec2;
  p1: vec2;
  e: vec2;
  max: vec2;
}

export interface ContactPoint {
  point: vec2;
  depth: number;
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

  /**
   * The contact points of the collision.
   */
  contactPoints: ContactPoint[];

  /**
   * Creates a {@link Manifold} describing a collision between **a** and **b** in detail.
   *
   * @param a First collision object
   * @param b Second collision object
   * @param collision {@link CollisionResult} from collision test
   * @param gravity The collision world's gravity vector
   * @param delta The time since the last update
   */
  constructor(
    a: CollisionObject,
    b: CollisionObject,
    collision: CollisionResult,
    gravity: vec2,
    delta: number
  ) {
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
    // for (const p of this.contactPoints) {
    //   const circle = new Circle(0.001, p);
    //   Renderer.renderCircle(circle);
    // }

    // console.log(this.contactPoints.length < 2);

    // try to prevent jitter
    const g = vec2.sqrLen(vec2.scale(vec2.create(), gravity, delta)) + 0.005;
    for (const contact of this.contactPoints) {
      // const contactA = vec2.sub(vec2.create(), contact.point, a.getPosition());
      // const contactB = vec2.sub(vec2.create(), contact.point, b.getPosition());

      const relativeVelocity = vec2.sub(vec2.create(), this.b.velocity, this.a.velocity);
      // console.log(vec2.sqrLen(relativeVelocity) < g);

      // Determine if we should perform a resting collision or not
      // The idea is if the only thing moving this object is gravity,
      // then the collision should be performed without any restitution
      if (vec2.sqrLen(relativeVelocity) < g) {
        this.epsilon = 0;
        // console.log("epsilon 0");
      }
    }
  }

  private calculateContactPoints(): ContactPoint[] {
    if (this.a.collider instanceof CircleCollider) {
      return [{ point: this.a.collider.findFurthestPoint(this.normal), depth: this.depth }];
    } else if (this.b.collider instanceof CircleCollider) {
      return [{ point: this.b.collider.findFurthestPoint(this.normal), depth: this.depth }];
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
    let cp = this.clipPoints(
      { point: inc.p0, depth: this.depth },
      { point: inc.p1, depth: this.depth },
      ref.e,
      o1
    );
    if (cp.length < 2) return cp;

    // clip whats left of the incident edge by the second vertex of
    // the reference edge
    // but we need to clip in opposite direction so we flip the
    // direction and offset
    const o2 = vec2.dot(ref.e, ref.p1);
    cp = this.clipPoints(cp[0], cp[1], vec2.negate(vec2.create(), ref.e), -o2);
    if (cp.length < 2) return cp;

    // calculate 2d vector cross product with scalar
    const refNorm = cross2DWithScalar(vec2.create(), ref.e, -1);

    // if we had to flip the incident and reference edges
    // then we need to flip the ref edge normal to clip properly
    if (flip) vec2.negate(refNorm, refNorm);

    // get the largest depth
    const max = vec2.dot(refNorm, ref.max);

    // compute contact point depths
    cp[0].depth = vec2.dot(refNorm, cp[0].point) - max;
    cp[1].depth = vec2.dot(refNorm, cp[1].point) - max;

    // make sure the final points are not past this maximum
    let removed = false;
    if (cp[0].depth < 0) {
      cp.shift();
      removed = true;
    }
    const i = removed ? 0 : 1;
    if (cp[i].depth < 0) {
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
        e: vec2.negate(l, l),
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
  private clipPoints(p0: ContactPoint, p1: ContactPoint, direction: vec2, o: number): ContactPoint[] {
    const clipped: ContactPoint[] = [];

    const d1 = vec2.dot(direction, p0.point) - o;
    const d2 = vec2.dot(direction, p1.point) - o;

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
      const e = vec2.sub(vec2.create(), p1.point, p0.point);

      // compute the location along e
      const u = d1 / (d1 - d2);
      vec2.scale(e, e, u);
      vec2.add(e, e, p0.point);

      // add the point
      clipped.push({ point: e, depth: p0.depth });
    }

    return clipped;
  }
}
