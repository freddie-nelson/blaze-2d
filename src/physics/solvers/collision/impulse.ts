import { vec2 } from "gl-matrix";
import { cross2D, cross2DWithScalar } from "../../../utils/vectors";
import CollisionObject from "../../collisionObject";
import PHYSICS_CONF from "../../config";
import Manifold from "../../manifold";

// initialise needed vectors
const contactA = vec2.create();
const contactB = vec2.create();
const impulse = vec2.create();
const velTangent = vec2.create();
const tangentImpulse = vec2.create();
const reverseTangentImpulse = vec2.create();

/**
 * Solves the impulse for a collision described by a {@link Manifold}.
 *
 * @param m {@link Manifold} describing the collision to solve the impulse for
 */
export default function solveImpulse(m: Manifold) {
  for (const contact of m.contactPoints) {
    // calculate contact vectors
    vec2.sub(contactA, contact.point, m.a.getPosition());
    vec2.sub(contactB, contact.point, m.b.getPosition());

    let relativeVelocity = calculateRelativeVelocity(m, contactA, contactB);

    // calculate relative velocity in terms of normal direction
    const contactVelocity = vec2.dot(relativeVelocity, contact.normal);

    // do not resolve if velocities are seperating
    // if (contactVelocity > 0) return;

    // calculate impulse scalar
    // const contactACrossN = cross2D(contactA, contact.normal);
    // const contactBCrossN = cross2D(contactB, contact.normal);
    // const invMass =
    //   m.a.getInverseMass() +
    //   m.b.getInverseMass() +
    //   contactACrossN ** 2 * m.a.getInverseInertia() +
    //   contactBCrossN ** 2 * m.b.getInverseInertia();

    // let impulseScalar = -(1 + m.epsilon) * contactVelocity;
    // impulseScalar /= invMass;
    // impulseScalar /= m.contactPoints.length;
    let deltaImpulseNormal = contact.massNormal * (-contactVelocity + contact.bias);

    if (PHYSICS_CONF.ACUMMULATE_IMPULSE) {
      // clamp the accumulated impulse
      const old = contact.impulseNormal;
      contact.impulseNormal = Math.max(old + deltaImpulseNormal, 0);
      deltaImpulseNormal = contact.impulseNormal - old;
    } else {
      deltaImpulseNormal = Math.max(deltaImpulseNormal, 0);
    }

    // apply impulse
    vec2.scale(impulse, contact.normal, deltaImpulseNormal);

    m.a.applyImpulse(vec2.negate(vec2.create(), impulse), contactA);
    m.b.applyImpulse(impulse, contactB);

    // friction impulse
    relativeVelocity = calculateRelativeVelocity(m, contactA, contactB);

    // calculate tangent velocity
    // vec2.sub(
    //   velTangent,
    //   relativeVelocity,
    //   vec2.scale(vec2.create(), contact.normal, vec2.dot(relativeVelocity, m.normal))
    // );
    // vec2.normalize(velTangent, velTangent);

    // let tangentImpulseMag = -vec2.dot(relativeVelocity, velTangent);
    // tangentImpulseMag /= invMass;
    // tangentImpulseMag /= m.contactPoints.length;

    // don't apply tiny friction impulses
    // if (Math.abs(tangentImpulseMag) <= 0.0001) return;

    // coulumb's law
    // if (Math.abs(tangentImpulseMag) < impulseScalar * m.sf) {
    //   vec2.scale(tangentImpulse, velTangent, tangentImpulseMag);
    // } else {
    //   vec2.scale(tangentImpulse, velTangent, -impulseScalar * m.df);
    // }

    // vec2.negate(reverseTangentImpulse, tangentImpulse);

    const tangent = cross2DWithScalar(vec2.create(), contact.normal, 1);
    const velTangent = vec2.dot(relativeVelocity, tangent);
    let deltaImpulseTangent = contact.massTangent * -velTangent;

    if (PHYSICS_CONF.ACUMMULATE_IMPULSE) {
      // compute friction impulse
      const maxImpulseTangent = m.df * contact.impulseNormal;

      // clamp friction
      const old = contact.impulseTangent;
      contact.impulseTangent = Math.max(
        -maxImpulseTangent,
        Math.min(maxImpulseTangent, old + deltaImpulseTangent)
      );
      deltaImpulseTangent = contact.impulseTangent - old;
    } else {
      const maxImpulseTangent = m.df * deltaImpulseNormal;
      deltaImpulseTangent = Math.max(-maxImpulseTangent, Math.min(maxImpulseTangent, deltaImpulseTangent));
    }

    // apply friction impulse
    vec2.scale(tangentImpulse, tangent, deltaImpulseTangent);
    vec2.negate(reverseTangentImpulse, tangentImpulse);

    m.a.applyImpulse(reverseTangentImpulse, contactA);
    m.b.applyImpulse(tangentImpulse, contactB);
  }
}

// export default function solveImpulse(m: Manifold) {
//   const A = m.a;
//   const B = m.b;

//   const invMassSum = A.getInverseMass() + B.getInverseMass();

//   for (const contact of m.contactPoints) {
//     // calculate contact vectors
//     const contactA = vec2.sub(vec2.create(), contact.point, m.a.getPosition());
//     const contactB = vec2.sub(vec2.create(), contact.point, m.b.getPosition());

//     let relV = vec2.sub(vec2.create(), B.velocity, A.velocity);
//     const contactV = vec2.dot(relV, contact.normal);

//     if (contactV > 0) return;

//     // calculate impulse vector along the normal
//     const impulseMagnitude = (-(1 + m.epsilon) * contactV) / invMassSum;
//     const impulseDirection = contact.normal;

//     const jn = vec2.scale(vec2.create(), impulseDirection, impulseMagnitude);

//     // apply linear impulse
//     vec2.scaleAndAdd(A.velocity, A.velocity, jn, -A.getInverseMass());
//     vec2.scaleAndAdd(B.velocity, B.velocity, jn, B.getInverseMass());
//   }
// }

// initialise vectors
const angularCrossContactA = vec2.create();
const angularCrossContactB = vec2.create();
const rVelA = vec2.create();
const rVelB = vec2.create();
const relativeVelocity = vec2.create();

/**
 * Calculates the relative velocity for the impulse resolution of a collision between 2 {@link CollisionObject}s.
 *
 * @param m The manifold of the collision between **a** and **b**
 * @param contactA The contact point on **a**
 * @param contactB The contact point on **b**
 */
export function calculateRelativeVelocity(m: Manifold, contactA: vec2, contactB: vec2) {
  cross2DWithScalar(angularCrossContactA, contactA, m.a.angularVelocity);
  cross2DWithScalar(angularCrossContactB, contactB, -m.b.angularVelocity);

  vec2.sub(rVelA, m.a.velocity, angularCrossContactA);
  vec2.add(rVelB, m.b.velocity, angularCrossContactB);
  return vec2.sub(relativeVelocity, rVelB, rVelA);
}
