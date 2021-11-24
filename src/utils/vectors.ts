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
 * **NOTE: not a real triple product**
 *
 * @see [This post for an explanation](https://stackoverflow.com/questions/44797996/triple-product-in-2d-to-construct-perpendicular-line)
 *
 * @param a First vector
 * @param b Second vector
 * @param c Thrid vector
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
