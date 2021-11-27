import { vec2 } from "gl-matrix";
import Manifold from "../../manifold";

/**
 * Solves the impulse for a collision described by a {@link Manifold}.
 *
 * @param m {@link Manifold} describing the collision to solve the impulse for
 */
export default function solveImpulse(m: Manifold) {
  const relativeVelocity = vec2.sub(vec2.create(), m.b.velocity, m.a.velocity);

  // calculate relative velocity in terms of normal direction
  const contactVelocity = vec2.dot(relativeVelocity, m.normal);

  // do not resolve if velocities are seperating
  if (contactVelocity > 0) return;

  // calculate impulse scalar
  const invMass = m.a.getInverseMass() + m.b.getInverseMass();
  let impulseScalar = (-(1 + m.epsilon) * contactVelocity) / invMass;

  // apply impulse
  const impulse = vec2.scale(vec2.create(), m.normal, impulseScalar);
  const penetrationVector = vec2.scale(vec2.create(), m.normal, m.depth);

  m.a.applyImpulse(vec2.scale(vec2.create(), impulse, -1), penetrationVector);
  m.b.applyImpulse(impulse, penetrationVector);

  // console.log(invMass, impulse, rvAlongNormal, m.a.velocity, m.b.velocity);
}
