/**
 * Map to store data which belongs to certain z indexes of the world.
 */
export interface ZMap<T> {
  [index: number]: T;
  max?: number;
  min?: number;
}
