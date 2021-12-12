import { vec2 } from "gl-matrix";
import Collider from "./collider/collider";
import Physics from "./physics";

/**
 * The collision normal and penetration depth computed by the EPA algorithm.
 *
 * @field **normal** The collision normal
 * @field **depth** The penetration depth of the collision
 */
interface EPAResult {
  normal: vec2;
  depth: number;
}

/**
 * Performs EPA collision response algorithm between 2 colliders.
 *
 * For a detailed explanation on how this algorithm works:
 *    - @see [dyn4j EPA Post](https://dyn4j.org/2010/05/epa-expanding-polytope-algorithm/)
 *    - @see [hamaluik EPA Post](https://blog.hamaluik.ca/posts/building-a-collision-engine-part-2-2d-penetration-vectors/)
 *    - @see [WinterDev EPA Explanation](https://blog.winter.dev/2020/epa-algorithm/)
 *    - @see [EPA Visualisation](https://winter.dev/lilapps/gjk/index.html)
 *
 * @param polytope The final simplex from the GJK algorithm between a and b.
 * @param a The first collider
 * @param c The second collider
 * @returns A {@link EPAResult} object containing the results of the EPA algorithm
 */
export default function EPA(polytope: vec2[], a: Collider, b: Collider): EPAResult {
  if (polytope.length < 3) throw new Error("EPA: Initial polytope must have atleast 3 vertices.");

  // console.log([...polytope]);
  // console.log(polytope);

  const winding = calculateSimplexWinding(polytope);

  for (let i = 0; i < Physics.EPA_MAX_ITERATIONS; i++) {
    const edge = findClosestEdge(polytope, winding);
    const support = a.supportPoint(b, edge.normal);

    // calculate distance of support along edge.normal
    const d = vec2.dot(support, edge.normal);
    if (Math.abs(d - edge.dist) <= Physics.EPA_TOLERANCE) {
      // if the difference is less than the tolerance then we can
      // assume that we cannot expand the polytope any further and
      // we have our solution
      return {
        normal: edge.normal,
        depth: d + Physics.EPA_TOLERANCE,
      };
    } else {
      polytope.splice(edge.index, 0, support);
    }

    if (i === Physics.EPA_MAX_ITERATIONS - 1) {
      // console.log("EPA: Iteration limit hit.");

      // iteration limit hit
      // return current most accurate values
      return {
        normal: edge.normal,
        depth: d + Physics.EPA_TOLERANCE,
      };
    }
  }
}

/**
 * Represents an edge on the EPA polytope.
 *
 * @field **normal** The edges normal vector towards the origin.
 * @field **dist** The distance of the edge from the origin.
 * @field **index** The index at which the new support point should be inserted into the polytope.
 */
interface Edge {
  normal: vec2;
  dist: number;
  index: number;
}

const ab = vec2.create();
const normal = vec2.create();

/**
 * Finds the edge in the polytope which is closest to the origin.
 *
 * @param polytope The polytope to analyse
 * @return The edge in the polytope which is closest to the origin
 */
function findClosestEdge(polytope: vec2[], winding: Winding): Edge {
  const edge: Edge = {
    normal,
    dist: Infinity,
    index: -1,
  };

  for (let i = 0; i < polytope.length; i++) {
    // calculate next point index in polytope
    const j = i + 1 >= polytope.length ? 0 : i + 1;

    const a = polytope[i];
    const b = polytope[j];

    // edge vector
    vec2.sub(ab, b, a);

    // get normal of edge towards origin
    if (winding === Winding.CLOCKWISE) {
      normal[0] = ab[1];
      normal[1] = -ab[0];
    } else {
      normal[0] = -ab[1];
      normal[1] = ab[0];
    }
    vec2.normalize(normal, normal);

    // distance from edge to origin
    const dist = vec2.dot(normal, a);

    // update closest edge if the new edge is closer to the origin
    if (dist < edge.dist) {
      edge.normal = vec2.clone(normal);
      edge.dist = dist;
      edge.index = j;
    }
  }

  return edge;
}

/**
 * Indicates the winding of the vertices in a polygon.
 */
enum Winding {
  CLOCKWISE,
  COUNTER_CLOCKWISE,
}

/**
 * Calculates the winding order of a simplex (triangle).
 *
 * @param simplex The array of 3 vertices that make up the simplex
 */
function calculateSimplexWinding(simplex: vec2[]): Winding {
  const a = simplex[0];
  const b = simplex[1];
  const c = simplex[2];

  const e0 = (b[0] - a[0]) * (b[1] + a[1]);
  const e1 = (c[0] - b[0]) * (c[1] + b[1]);
  const e2 = (a[0] - c[0]) * (a[1] + c[1]);

  if (e0 + e1 + e2 >= 0) return Winding.CLOCKWISE;
  else return Winding.COUNTER_CLOCKWISE;
}
