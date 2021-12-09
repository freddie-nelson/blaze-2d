import { vec2 } from "gl-matrix";
import Manifold from "../../manifold";

/**
 * Corrects the colliding objects positions, by applying the position impulse in the given manifold.
 *
 * @param m {@link Manifold} describing the collision to apply position impulse for
 */
export default function applyPositionImpulse(m: Manifold) {
  // const percent = 0.9;
  // const slop = 0.015;

  // // calculate correction vector
  // const invMass = m.a.getInverseMass() + m.b.getInverseMass();
  // if (invMass === 0) return;

  // const scale = Math.max(m.depth - slop, 0) / invMass;
  // if (scale === 0) return;

  // const correction = vec2.scale(vec2.create(), m.normal, scale * percent);

  // const aCorrection = vec2.scale(vec2.create(), correction, -m.a.getInverseMass());
  // const bCorrection = vec2.scale(vec2.create(), correction, m.b.getInverseMass());

  // m.a.translate(aCorrection);
  // m.b.translate(bCorrection);

  const bodies = [m.a, m.b];
  const impulses = [m.positionImpulse.a, m.positionImpulse.b];

  for (let i = 0; i < bodies.length; i++) {
    const body = bodies[i];
    const positionImpulse = impulses[i];

    body.translate(positionImpulse);

    // reset cached impulse if the body has velocity along it
    if (vec2.dot(positionImpulse, body.velocity) < 0) {
      vec2.zero(positionImpulse);
      // console.log("position impulse zero");
    } else {
      vec2.scale(positionImpulse, positionImpulse, Manifold.POSITION_WARMING);
      // console.log("position impulse warmed");
    }
  }
}
