import { vec2 } from "gl-matrix";

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
