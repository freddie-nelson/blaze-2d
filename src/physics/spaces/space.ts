/**
 * Represents an infinite space filled with objects.
 *
 * @type **O** The type of objects the space will contain
 * @type **S** The type of solvers the space can use
 */
export default abstract class Space<O, S> {
  objects: O[] = [];
  solvers: S[] = [];

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
  addObject(obj: O) {
    this.objects.push(obj);
  }

  /**
   * Removes an object from the space.
   *
   * @param obj The object to remove
   * @returns Wether or not the object was removed
   */
  removeObject(obj: O) {
    const i = this.objects.findIndex((o) => o === obj);
    if (i === -1) return false;

    this.objects.splice(i, 1);
    return true;
  }

  /**
   * Gets all solvers in the space.
   *
   * @returns All solvers in the space
   */
  getSolvers() {
    return this.solvers;
  }

  /**
   * Removes all solvers from the space.
   */
  clearSolvers() {
    this.solvers.length = 0;
  }

  /**
   * Adds a solver to the space.
   *
   * @param solver The solvers to add
   */
  addSolver(solver: S) {
    this.solvers.push(solver);
  }

  /**
   * Removes a solver from the space.
   *
   * @param solver The solver to remove
   * @returns Wether or not the solver was removed
   */
  removeSolver(solver: S) {
    const i = this.solvers.findIndex((s) => s === solver);
    if (i === -1) return false;

    this.solvers.splice(i, 1);
    return true;
  }
}
