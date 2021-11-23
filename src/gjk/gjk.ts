import { vec2, vec3 } from "gl-matrix";
import MeshCollider from "../physics/collider/meshCollider";

/**
 * Performs GJK collision detection between two colliders.
 *
 * @param a The first collider
 * @param c The collider to test for collisions against
 * @returns Wether or not collider a and b are colliding
 */
export default function GJK(a: MeshCollider, b: MeshCollider): boolean {
  // find inital support point using b.position - a.position as direction
  const direction = vec2.create();
  vec2.sub(direction, b.getPosition(), a.getPosition());

  let support = a.supportPoint(b, direction);

  // create simplex
  const simplex = [support];

  // new direction is opposite of initial direction so as to maximise simplex area
  vec2.scale(direction, direction, -1);

  // check simplex for collisions
  // let iterations = 0;
  while (true) {
    support = a.supportPoint(b, direction);
    if (vec2.dot(support, direction) <= 0) {
      return false; // no collision
    }

    simplex.push(support);
    if (nextSimplex(simplex, direction)) {
      return true;
    }

    // iterations++;
    // if (iterations > 100) {
    // console.log("stuck", simplex, support, a, b);
    // return false;
    // }
  }
}

/**
 * Determine wether or not a collision has occured or if we need to evolve the simplex.
 *
 * @param simplex The minkowski difference outer hull vertices
 * @param direction The direction in which the last support point was calculated
 * @returns Wether or not there is a collision
 */
function nextSimplex(simplex: vec2[], direction: vec2): boolean {
  switch (simplexSize(simplex)) {
    case 2:
      return line(simplex, direction);
    case 3:
      return triangle(simplex, direction);
  }
}

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
  const ab = vec2.create();
  vec2.sub(ab, b, a);

  // vector ao (a0) is the line from the first vertex to the origin
  const ao = vec2.create();
  vec2.scale(ao, a, -1);

  // use the triple cross product to calculate a direction perpendicular to line ab
  // in the direction of the origin
  vec2.copy(direction, tripleProduct(ab, ao, ab));

  return false;
}

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

  const ab = vec2.create();
  vec2.sub(ab, b, a);

  const ac = vec2.create();
  vec2.sub(ac, c, a);

  const ao = vec2.create();
  vec2.scale(ao, a, -1);

  const abPerp = tripleProduct(ac, ab, ab);
  const acPerp = tripleProduct(ab, ac, ac);

  if (sameDirection(abPerp, ao)) {
    // the origin is outside line ab
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

/**
 * Calculates the triple product of three 2D vectors.
 *
 * **NOTE: not a real triple product**
 *
 * @see [This post for an explanation](https://stackoverflow.com/questions/44797996/triple-product-in-2d-to-construct-perpendicular-line)
 *
 * @param a First vector
 * @param b Second vector
 * @param c Thrid vector
 */
function tripleProduct(a: vec2, b: vec2, c: vec2): vec2 {
  const A = vec3.fromValues(a[0], a[1], 0);
  const B = vec3.fromValues(b[0], b[1], 0);
  const C = vec3.fromValues(c[0], c[1], 0);

  const first = vec3.create();
  vec3.cross(first, A, B);

  const second = vec3.create();
  vec3.cross(second, first, C);

  return vec2.fromValues(second[0], second[1]);
}

/**
 * Gets the number of vertices in the simplex.
 *
 * @param simplex The simplex to measure
 * @returns The number of vertices in the simplex
 */
function simplexSize(simplex: vec2[]) {
  return Math.min(simplex.length, 3);
}
