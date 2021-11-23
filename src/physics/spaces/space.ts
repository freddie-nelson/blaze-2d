/**
 * Represents an infinite space filled with objects.
 */
export default abstract class Space<T> {
  objects: T[] = [];

  /**
   * Creates a {@link Space} instance.
   */
  constructor() {}

  /**
   * Steps the space forward by the given delta time.
   *
   * @param delta The time since the last frame
   */
  abstract step(delta: number): void;

  /**
   * Gets all objects in the space.
   *
   * @returns All objects in the space
   */
  getObjects() {
    return this.objects;
  }

  /**
   * Removes all objects from the space.
   */
  clearObjects() {
    this.objects.length = 0;
  }

  /**
   * Adds an object to the space.
   *
   * @param obj The object to add
   */
  addObject(obj: T) {
    this.objects.push(obj);
  }

  /**
   * Removes an object from the space.
   *
   * @param obj The object to remove
   * @returns Wether or not the object was removed
   */
  removeBody(obj: T) {
    const i = this.objects.findIndex((o) => o === obj);
    if (i === -1) return false;

    this.objects.splice(i, 1);
    return true;
  }
}
