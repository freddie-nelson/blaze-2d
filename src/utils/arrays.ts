/**
 * Converts a 3D array index to a 1D index
 *
 * @param x row in slice index
 * @param y depth/slice index
 * @param z column index
 * @param width length of each row in array
 * @param depth number of rows in array
 * @returns index of (x, y, z) in flat array
 */
export function from3Dto1D(x: number, y: number, z: number, width: number, depth: number) {
  return x + width * (y + depth * z);
}

/**
 * Converts a 2D array index to a 1D index
 *
 * @param x column index
 * @param y row index
 * @param width length of each row in array
 * @returns index of (x, y) in flat array
 */
export function from2Dto1D(x: number, y: number, width: number) {
  return y * width + x;
}
