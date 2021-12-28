import { vec2, vec3 } from "gl-matrix";
import { tripleProduct } from "../utils/vectors";
import Collider from "./collider/collider";

const MAX_ITERATIONS = 16;

interface GJKResult {
  collision: boolean;
  simplex?: vec2[];
}

const direction = vec2.create();

/**
 * Performs GJK collision detection between two colliders.
 *
 * @see [GJK Explanation](https://www.youtube.com/watch?v=ajv46BSqcK4)
 *
 * @param a The first collider
 * @param c The collider to test for collisions against
 * @returns A {@link GJKResult} struct containing the results of the GJK algorithm
 */
export default function GJK(a: Collider, b: Collider): GJKResult {
  // find inital support point using b.position - a.position as direction
  vec2.sub(direction, b.getPosition(), a.getPosition());

  // prevent direction of (0, 0) when positions are identical
  // when this is true use unit vector instead
  if (direction[0] === 0 && direction[1] === 0) {
    direction[0] = 1;
    direction[1] = 1;
  }

  let support = a.supportPoint(b, direction);

  // create simplex
  const simplex = [support];

  // new direction is support - origin (-support) as we are trying to see if simplex contains origin
  vec2.scale(direction, support, -1);

  // check simplex for collisions
  // let iterations = 0;
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    support = a.supportPoint(b, direction);
    if (!sameDirection(support, direction)) {
      return {
        collision: false,
      }; // no collision
    }

    simplex.push(support);
    if (nextSimplex(simplex, direction)) {
      return {
        collision: true,
        simplex,
      };
    }

    // iterations++;
    // if (iterations > 50) {
    // console.log("GJK: Algorithm stuck.", simplex, support, a, b);
    // return {
    // collision: false,
    // };
    // }
  }

  return {
    collision: false,
  };
}

/**
 * Determine wether or not a collision has occured or if we need to evolve the simplex.
 *
 * @param simplex The minkowski difference outer hull vertices
 * @param direction The direction in which the last support point was calculated
 * @returns Wether or not there is a collision
 */
function nextSimplex(simplex: vec2[], direction: vec2): boolean {
  switch (simplex.length) {
    case 2:
      return line(simplex, direction);
    case 3:
      return triangle(simplex, direction);
  }
}

const ab = vec2.create();
const ao = vec2.create();
const abPerp = vec2.create();

/**
 * Determine wether or not a collision has occured when the simplex consists of 2 vertices.
 *
 * @param simplex The minkowski difference outer hull vertices
 * @param direction The direction in which the last support point was calculated
 * @returns Wether or not there is a collision
 */
function line(simplex: vec2[], direction: vec2): boolean {
  const a = simplex[1];
  const b = simplex[0];

  // vector ab is the line formed by the first two vertices
  vec2.sub(ab, b, a);

  // vector ao is the line from the first vertex to the origin
  vec2.scale(ao, a, -1);

  // use the triple cross product to calculate a direction perpendicular to line ab
  // in the direction of the origin
  vec2.copy(direction, tripleProduct(abPerp, ab, ao, ab));

  // correct direction for ab which cuts the origin?
  if (vec2.sqrLen(direction) === 0) {
    vec2.copy(direction, vec2.fromValues(ab[1], -ab[0]));
  }

  return false;
}

const ac = vec2.create();
const acPerp = vec2.create();

/**
 * Determine wether or not a collision has occured when the simplex consists of 3 vertices.
 *
 * @param simplex The minkowski difference outer hull vertices
 * @param direction The direction in which the last support point was calculated
 * @returns Wether or not there is a collision
 */
function triangle(simplex: vec2[], direction: vec2): boolean {
  const a = simplex[2];
  const b = simplex[1];
  const c = simplex[0];

  vec2.sub(ab, b, a);

  vec2.sub(ac, c, a);

  vec2.scale(ao, a, -1);

  tripleProduct(abPerp, ac, ab, ab);
  tripleProduct(acPerp, ab, ac, ac);

  if (sameDirection(abPerp, ao)) {
    // the origin is outside line ab

    // remove c
    simplex.shift();

    vec2.copy(direction, abPerp);
    return false;
  } else if (sameDirection(acPerp, ao)) {
    // the origin is outside line ac

    // remove b
    simplex.splice(1, 1);

    vec2.copy(direction, acPerp);
    return false;
  } else {
    // the origin is inside both ab and ac, so it must be inside the triangle
    return true;
  }
}

/**
 * Determines if two vectors point roughly in the same direction.
 *
 * @param direction The direction
 * @param a The vector to compare
 */
function sameDirection(direction: vec2, a: vec2) {
  return vec2.dot(direction, a) > 0;
}
