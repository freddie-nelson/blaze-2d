import { vec2, vec3 } from "gl-matrix";

/**
 * Rotates each vector in an array by a rotation angle in radians around an origin point.
 *
 * @param base The vectors to apply the rotation to
 * @param origin The origin to rotate the vectors around
 * @param rotation The rotation (in radians) to apply to each vector
 * @returns The rotated vectors
 */
export function applyRotation(base: vec2[], origin: vec2, rotation: number) {
  const temp = vec2.create();

  return base.map((v) => {
    vec2.rotate(temp, v, origin, rotation);
    return <vec2>[...temp];
  });
}

/**
 * Translates each vector in an array by a given translation vector
 *
 * @param base The vectors to apply the translation to
 * @param translation The translation to apply to each vector
 * @returns The translated vectors
 */
export function applyTranslation(base: vec2[], translation: vec2) {
  const temp = vec2.create();

  return base.map((v) => {
    vec2.add(temp, v, translation);
    return <vec2>[...temp];
  });
}

/**
 * Calculates the triple product of three 2D vectors.
 *
 * This is done by:
 *    - extending each 2D vector into 3D by giving them a Z value of 0.
 *    - Calculating the cross product of **A** and **B**, storing the result as vector **R₁**.
 *      **R₁** will be a vector purely in the z axis as the x and y components after the cross product are 0.
 *    - The cross product of **R₁** and **C** is then calculated, we'll call this **R₂**.
 *      **R₂** will be a vector that is perpendicular to **C** and pointing in the direction of **B**.
 *
 * @see [This post for an explanation](https://stackoverflow.com/questions/44797996/triple-product-in-2d-to-construct-perpendicular-line)
 *
 * @param a Initial vector
 * @param b Vector that the result will be in direction of
 * @param c Vector that the result will be perpendicular to
 */
export function tripleProduct(a: vec2, b: vec2, c: vec2): vec2 {
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
 * Calculates the cross product of **a** with a scalar and stores the value in **out**
 *
 * @param out The vector to output to
 * @param a The vector to cross
 * @param scalar The scalar to cross a with
 * @returns out
 */
export function cross2DWithScalar(out: vec2, a: vec2, scalar: number) {
  out[0] = a[1] * scalar;
  out[1] = a[0] * -scalar;
  return out;
}
