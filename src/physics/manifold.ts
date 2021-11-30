import { vec2 } from "gl-matrix";
import Renderer from "../renderer/renderer";
import Circle from "../shapes/circle";
import Color from "../utils/color";
import { cross2DWithScalar } from "../utils/vectors";
import CircleCollider from "./collider/circle";
import { CollisionResult } from "./collider/collider";
import CollisionObject from "./collisionObject";
import PHYSICS_CONF from "./config";
import { calculateRelativeVelocity } from "./solvers/collision/impulse";

interface Edge {
  p0: vec2;
  p1: vec2;
  e: vec2;
  max: vec2;
  p0Neighbour?: Edge;
  p1Neighbour?: Edge;
}

export interface ContactPoint {
  point: vec2;
  normal: vec2;
  depth: number;

  // feature id is an array of vec2s representing the edges that clip the contact point
  featureId?: vec2[];

  contactA?: vec2;
  contactB?: vec2;
  massNormal?: number;
  massTangent?: number;
  bias?: number;
  impulseNormal?: number;
  impulseTangent?: number;
  impulseNormalPosition?: number;
}

/**
 * Information about a collision which has occured between two objects.
 */
export default class Manifold {
  static CACHED_CONTACTS_TOLERANCE = 0;

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
   * store used edges for debugging [inc, ref]
   */
  edges: Edge[] = [];

  isDead = false;

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

    // add missing properties to contacts
    for (const contact of this.contactPoints) {
      contact.bias = 0;
      contact.impulseNormal = 0;
      contact.impulseNormalPosition = 0;
      contact.impulseTangent = 0;
      contact.massNormal = 0;
      contact.massTangent = 0;
    }

    // for (const p of this.contactPoints) {
    //   const circle = new Circle(0.001, p);
    //   Renderer.renderCircle(circle);
    // }

    // console.log(this.contactPoints.length < 2);

    const g = vec2.sqrLen(vec2.scale(vec2.create(), gravity, delta)) + 0.0001;

    for (const contact of this.contactPoints) {
      const contactA = vec2.sub(vec2.create(), contact.point, a.getPosition());
      const contactB = vec2.sub(vec2.create(), contact.point, b.getPosition());

      const relativeVelocity = calculateRelativeVelocity(this, contactA, contactB);

      // Determine if we should perform a resting collision or not
      // The idea is if the only thing moving this object is gravity,
      // then the collision should be performed without any restitution
      if (vec2.sqrLen(relativeVelocity) < g) {
        this.epsilon = 0;
        // console.log("epsilon 0");
      }
    }
  }

  update(m: Manifold) {
    const newContacts = m.contactPoints;
    const oldContacts = this.contactPoints;
    const mergedContacts = [];

    // if we have different number of contacts drop manifold
    if (newContacts.length !== oldContacts.length) return (this.isDead = true);

    // if no feature id provided in old contacts then drop manifold
    if (oldContacts[0].featureId === null) return (this.isDead = true);

    // merge contacts
    for (let i = 0; i < newContacts.length; i++) {
      const nc = newContacts[i];
      let match = -1;

      for (let j = 0; j < oldContacts.length; j++) {
        const oc = oldContacts[j];

        if (this.compareFeatureIds(nc.featureId, oc.featureId)) {
          match = j;
          break;
        }
      }

      if (match === -1) {
        mergedContacts.push(newContacts[i]);
        continue;
      }

      const oc = oldContacts[match];
      if (PHYSICS_CONF.WARM_START) {
        nc.impulseNormal = oc.impulseNormal;
        nc.impulseTangent = oc.impulseTangent;
        nc.impulseNormalPosition = oc.impulseNormalPosition;
      }

      mergedContacts.push(nc);
    }

    if (mergedContacts.length !== oldContacts.length) return (this.isDead = true);

    console.log("match");

    this.edges = m.edges;
    this.contactPoints = mergedContacts;
  }

  private compareFeatureIds(f1: vec2[], f2: vec2[]) {
    if (!f1 || !f2 || f1.length !== f2.length || f1.length === 0) return false;

    for (let i = 0; i < f1.length; i++) {
      const e1 = f1[i];
      const e2 = f2[i];

      if (
        Math.abs(e1[0] - e2[0]) > Manifold.CACHED_CONTACTS_TOLERANCE ||
        Math.abs(e1[1] - e2[1]) > Manifold.CACHED_CONTACTS_TOLERANCE
      )
        return false;
    }

    return true;
  }

  /**
   * Precompute some additional information about the contact points for impulse resolution.
   *
   * Calculates and applies accumulative impulse.
   *
   * @param delta The time since the last udpate
   */
  preStep(delta: number) {
    const allowedPenetration = 0.01;
    const biasFactor = 0.2;

    for (const contact of this.contactPoints) {
      const contactA = vec2.sub(vec2.create(), contact.point, this.a.getPosition());
      const contactB = vec2.sub(vec2.create(), contact.point, this.b.getPosition());
      contact.contactA = contactA;
      contact.contactB = contactB;

      // compute distances along normal for contacts
      const distAlongNormalA = vec2.dot(contactA, contact.normal);
      const distAlongNormalB = vec2.dot(contactB, contact.normal);

      // normal mass
      const invMass = this.a.getInverseMass() + this.b.getInverseMass();
      const invInertiaA =
        this.a.getInverseInertia() * (vec2.dot(contactA, contactA) - distAlongNormalA * distAlongNormalA);
      const invInertiaB =
        this.b.getInverseInertia() * (vec2.dot(contactB, contactB) - distAlongNormalB * distAlongNormalB);

      const massNormal = invMass + invInertiaA + invInertiaB;
      contact.massNormal = 1 / massNormal;

      const tangent = cross2DWithScalar(vec2.create(), contact.normal, 1);

      // compute distance along tangent for contacts
      const distAlongTangentA = vec2.dot(contactA, tangent);
      const distAlongTangentB = vec2.dot(contactB, tangent);

      const invInertiaTangentA =
        this.a.getInverseInertia() * (vec2.dot(contactA, contactA) - distAlongTangentA * distAlongTangentA);
      const invInertiaTangentB =
        this.b.getInverseInertia() * (vec2.dot(contactB, contactB) - distAlongTangentB * distAlongTangentB);

      // tangent mass
      const massTangent = invMass + invInertiaTangentA + invInertiaTangentB;
      contact.massTangent = 1 / massTangent;

      contact.bias = (-biasFactor / delta) * Math.min(0, contact.depth + allowedPenetration);

      // apply accumulate impulse
      if (PHYSICS_CONF.ACUMMULATE_IMPULSE) {
        const impulseNormal = vec2.scale(vec2.create(), contact.normal, contact.impulseNormal);
        const impulseTangent = vec2.scale(vec2.create(), tangent, contact.impulseTangent);
        const impulse = vec2.add(vec2.create(), impulseNormal, impulseTangent);

        this.a.applyImpulse(vec2.negate(vec2.create(), impulse), contactA);
        this.b.applyImpulse(impulse, contactB);
      }
    }
  }

  /**
   * Calculates the contact points of the collision.
   *
   * @see [Dyn4j Contact Points](https://dyn4j.org/2011/11/contact-points-using-clipping/)
   *
   * @returns The points of contact for the collision
   */
  private calculateContactPoints(): ContactPoint[] {
    if (this.a.collider instanceof CircleCollider) {
      return [
        {
          point: this.a.collider.findFurthestPoint(this.normal),
          depth: this.depth,
          normal: this.normal,
          featureId: null,
        },
      ];
    } else if (this.b.collider instanceof CircleCollider) {
      return [
        {
          point: this.b.collider.findFurthestPoint(vec2.negate(vec2.create(), this.normal)),
          depth: this.depth,
          normal: this.normal,
          featureId: null,
        },
      ];
    }

    const e1 = this.bestEdge(this.a, this.normal);
    const e2 = this.bestEdge(this.b, vec2.negate(vec2.create(), this.normal));

    // identify reference and incident edge for clipping
    let ref: Edge;
    let inc: Edge;

    if (Math.abs(vec2.dot(e1.e, this.normal)) <= Math.abs(vec2.dot(e2.e, this.normal))) {
      ref = e1;
      inc = e2;
    } else {
      ref = e2;
      inc = e1;
    }

    this.edges = [inc, ref];

    // perform clipping
    const refv = vec2.clone(ref.e);
    vec2.normalize(refv, refv);

    const o1 = vec2.dot(refv, ref.p0);

    // clip the incident edge by the first vertex of the reference edge
    let cp = this.clipPoints(
      { point: inc.p0, depth: this.depth, normal: this.normal, featureId: [] },
      { point: inc.p1, depth: this.depth, normal: this.normal, featureId: [] },
      refv,
      o1,
      ref.p0Neighbour.e
    );
    if (cp.length < 2) return [];

    // clip whats left of the incident edge by the second vertex of
    // the reference edge
    // but we need to clip in opposite direction so we flip the
    // direction and offset
    const o2 = vec2.dot(refv, ref.p1);
    cp = this.clipPoints(cp[0], cp[1], vec2.negate(vec2.create(), refv), -o2, ref.p1Neighbour.e);
    if (cp.length < 2) return [];

    // calculate 2d vector cross product with scalar
    const refNorm = cross2DWithScalar(vec2.create(), refv, -1);

    // if we had to flip the incident and reference edges
    // then we need to flip the ref edge normal to clip properly
    // * NOTE: No need to flip normal because of how GJK and EPA are implemented.
    // * see comments of dyn4j post (search for comments between May 30, 2018 and June 15, 2019)
    // if (flip) vec2.negate(refNorm, refNorm);

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

  /**
   * Finds the best edge of a {@link CollisionObject} in a given direction.
   *
   * The best edge is defined as the edge most perpendicular to the given direction.
   *
   * @param obj The collision object to calculate the edge for
   * @param direction The direction in which to calculate the edge
   * @returns The best edge of `obj` for the direction given
   */
  private bestEdge(obj: CollisionObject, direction: vec2): Edge {
    const points = obj.collider.findFurthestNeighbours(direction);
    const vertices = obj.collider.getPoints();

    const l = vec2.sub(vec2.create(), points.furthest, points.left);
    const r = vec2.sub(vec2.create(), points.furthest, points.right);

    vec2.normalize(l, l);
    vec2.normalize(r, r);

    // calculate edges
    const right = {
      max: points.furthest,
      p0: points.right,
      p1: points.furthest,
      e: vec2.sub(vec2.create(), points.furthest, points.right),
    };

    const left = {
      max: points.furthest,
      p0: points.furthest,
      p1: points.left,
      e: vec2.sub(vec2.create(), points.left, points.furthest),
    };

    if (vec2.dot(r, direction) <= vec2.dot(l, direction)) {
      // the right edge is better
      const rightNeighbour =
        vertices[points.rightIndex - 1 < 0 ? vertices.length - 1 : points.rightIndex - 1];

      // make sure to retain the winding direction
      return {
        ...right,
        p0Neighbour: {
          max: rightNeighbour,
          p0: points.right,
          p1: rightNeighbour,
          e: vec2.sub(vec2.create(), rightNeighbour, points.right),
        },
        p1Neighbour: left,
      };
    } else {
      // the left edge is better
      const leftNeighbour = vertices[points.leftIndex + 1 >= vertices.length ? 0 : points.leftIndex + 1];

      // make sure to retain the winding direction
      return {
        ...left,
        p0Neighbour: {
          max: points.furthest,
          p0: points.furthest,
          p1: points.right,
          e: vec2.sub(vec2.create(), points.right, points.furthest),
        },
        p1Neighbour: {
          max: leftNeighbour,
          p0: points.left,
          p1: leftNeighbour,
          e: vec2.sub(vec2.create(), leftNeighbour, points.left),
        },
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
  private clipPoints(
    p0: ContactPoint,
    p1: ContactPoint,
    direction: vec2,
    o: number,
    clippingPlane: vec2
  ): ContactPoint[] {
    const clipped: ContactPoint[] = [];

    const dist0 = vec2.dot(direction, p0.point) - o;
    const dist1 = vec2.dot(direction, p1.point) - o;

    // if either point is past o along n then we can keep it
    if (dist0 >= 0) {
      clipped.push(p0);
      p0.featureId.push(clippingPlane);
    }
    if (dist1 >= 0) {
      clipped.push(p1);
      p1.featureId.push(clippingPlane);
    }

    // finally we need to check if they are on opposing sides
    // so that we can compute the correct point
    if (dist0 * dist1 < 0) {
      // if they are on different sides of the offset, d1 and d2
      // will be (+) * (-) and will yield a negative result
      // therefore be less than zero

      //get the vector for the edge we are clipping;
      const e = vec2.sub(vec2.create(), p1.point, p0.point);

      // compute the location along e
      const u = dist0 / (dist0 - dist1);
      vec2.scale(e, e, u);
      vec2.add(e, e, p0.point);

      // add the point
      clipped.push({
        point: e,
        depth: p0.depth,
        normal: this.normal,
        featureId: [vec2.sub(vec2.create(), p1.point, p0.point)],
      });
    }

    return clipped;
  }
}
