import { vec2 } from "gl-matrix";
import Manifold from "../../manifold";

/**
 * Solves the object's positions for a collision described by a {@link Manifold}.
 *
 * @param m {@link Manifold} describing the collision to solve the position for
 */
export default function solvePosition(m: Manifold) {
  let share = 2;
  const resolution = vec2.scale(vec2.create(), m.normal, m.depth);

  if (m.a.isStatic) {
    share -= 1;
  }

  if (m.b.isStatic) {
    share -= 1;
  }

  if (share !== 0) {
    if (!m.a.isStatic) {
      m.a.translate(vec2.scale(vec2.create(), resolution, -1 / share));
    }
    if (!m.b.isStatic) {
      m.b.translate(vec2.scale(vec2.create(), resolution, 1 / share));
    }
  }
}
