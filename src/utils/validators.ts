/**
 * Validates a z index.
 *
 * Does not check to see if the z index exceeds `zLevels` defined in {@link Blaze}.
 *
 * @param zIndex The z index to validate
 * @returns true when valid or a string containing the reason for being invalid
 */
export default function validateZIndex(zIndex: number): true | string {
  if (zIndex < 0) return "zIndex cannot be less than 0.";
  else if (Math.floor(zIndex) !== zIndex) return "zIndex must be an integer.";

  return true;
}
