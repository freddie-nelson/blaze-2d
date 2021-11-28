import { vec2 } from "gl-matrix";
import { cross2D, cross2DWithScalar } from "../../../utils/vectors";
import Manifold from "../../manifold";

/**
 * Solves the impulse for a collision described by a {@link Manifold}.
 *
 * @param m {@link Manifold} describing the collision to solve the impulse for
 */
export default function solveImpulse(m: Manifold) {
  for (const contact of m.contactPoints) {
    // calculate contact vectors
    const contactA = vec2.sub(vec2.create(), contact.point, m.a.getPosition());
    const contactB = vec2.sub(vec2.create(), contact.point, m.b.getPosition());

    let relativeVelocity = calculateRelativeVelocity(m, contactA, contactB);

    // calculate relative velocity in terms of normal direction
    const contactVelocity = vec2.dot(relativeVelocity, m.normal);

    // do not resolve if velocities are seperating
    if (contactVelocity > 0) return;

    // calculate impulse scalar
    const contactACrossN = cross2D(contactA, m.normal);
    const contactBCrossN = cross2D(contactB, m.normal);
    const invMass =
      m.a.getInverseMass() +
      m.b.getInverseMass() +
      contactACrossN ** 2 * m.a.getInverseInertia() +
      contactBCrossN ** 2 * m.b.getInverseInertia();

    let impulseScalar = -(1 + m.epsilon) * contactVelocity;
    impulseScalar /= invMass;
    impulseScalar /= m.contactPoints.length;

    // apply impulse
    const impulse = vec2.scale(vec2.create(), m.normal, impulseScalar);

    m.a.applyImpulse(vec2.negate(vec2.create(), impulse), contactA);
    m.b.applyImpulse(impulse, contactB);

    // friction impulse
    relativeVelocity = calculateRelativeVelocity(m, contactA, contactB);

    const velTangent = vec2.sub(
      vec2.create(),
      relativeVelocity,
      vec2.scale(vec2.create(), m.normal, vec2.dot(relativeVelocity, m.normal))
    );
    vec2.normalize(velTangent, velTangent);

    let tangentImpulseMag = -vec2.dot(relativeVelocity, velTangent);
    tangentImpulseMag /= invMass;
    tangentImpulseMag /= m.contactPoints.length;

    // don't apply tiny friction impulses
    if (Math.abs(tangentImpulseMag) <= 0.0001) return;

    // coulumb's law
    let tangentImpulse = vec2.create();
    if (Math.abs(tangentImpulseMag) < impulseScalar * m.sf) {
      vec2.scale(tangentImpulse, velTangent, tangentImpulseMag);
    } else {
      vec2.scale(tangentImpulse, velTangent, -impulseScalar * m.df);
    }

    // apply friction impulse
    m.a.applyImpulse(vec2.negate(vec2.create(), tangentImpulse), contactA);
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
//     const contactV = vec2.dot(relV, m.normal);

//     if (contactV > 0) return;

//     // calculate impulse vector along the normal
//     const impulseMagnitude = (-(1 + m.epsilon) * contactV) / invMassSum;
//     const impulseDirection = m.normal;

//     const jn = vec2.scale(vec2.create(), impulseDirection, impulseMagnitude);

//     // apply linear impulse
//     vec2.scaleAndAdd(A.velocity, A.velocity, jn, -A.getInverseMass());
//     vec2.scaleAndAdd(B.velocity, B.velocity, jn, B.getInverseMass());
//   }
// }

/**
 * Calculates the relative velocity for the impulse resolution of a collision between 2 {@link CollisionObject}s.
 *
 * @param m The manifold of the collision between **a** and **b**
 * @param contactA The contact point on **a**
 * @param contactB The contact point on **b**
 */
export function calculateRelativeVelocity(m: Manifold, contactA: vec2, contactB: vec2) {
  const angularCrossContactA = cross2DWithScalar(vec2.create(), contactA, m.a.angularVelocity);
  const angularCrossContactB = cross2DWithScalar(vec2.create(), contactB, -m.b.angularVelocity);

  const rVelA = vec2.sub(vec2.create(), m.a.velocity, angularCrossContactA);
  const rVelB = vec2.add(vec2.create(), m.b.velocity, angularCrossContactB);
  return vec2.sub(vec2.create(), rVelB, rVelA);
}
