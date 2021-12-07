import { vec2 } from "gl-matrix";
import Manifold from "../../manifold";

/**
 * Corrects the colliding objects positions.
 *
 * @param m {@link Manifold} describing the collision to correct positions for
 */
export default function positionalCorrection(m: Manifold) {
  const percent = 0.9;
  const slop = 0.04;

  // calculate correction vector
  const invMass = m.a.getInverseMass() + m.b.getInverseMass();
  const scale = Math.max(m.depth - slop, 0) / invMass;
  const correction = vec2.scale(vec2.create(), m.normal, scale * percent);

  const aCorrection = vec2.scale(vec2.create(), correction, -m.a.getInverseMass());
  const bCorrection = vec2.scale(vec2.create(), correction, m.b.getInverseMass());

  m.a.translate(aCorrection);
  m.b.translate(bCorrection);
}
