/**
 * Represents an infinite space filled with objects.
 *
 * @type **O** The type of objects the space will contain
 * @type **S** The type of solvers the space can use
 */
export default abstract class Space<O, S> {
  objects: O[] = [];
  solvers: { [index: string]: { cb: S; iterations: number } } = {};

  /**
   * Creates a {@link Space} instance.
   */

  /**
   * Executes a solver on every object in the space.
   *
   * @param id The id of the solver to execute
   */
  abstract solve(id: string, ...args: any): void;

  /**
   * Steps the space forward by the given delta time.
   *
   * @param delta The time since the last frame
   */
  // abstract step(delta: number): void;

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
    this.solvers = {};
  }

  /**
   * Adds a solver to the space.
   *
   * @param id The solver's identifier
   * @param cb The solver to add
   * @param iterations The number of times to run the solver, per time step
   */
  addSolver(id: string, cb: S, iterations: number) {
    this.solvers[id] = { cb, iterations };
  }

  /**
   * Removes a solver from the space.
   *
   * @param id The id of the solver to remove
   * @returns Wether or not the solver was removed
   */
  removeSolver(id: string) {
    delete this.solvers[id];
    return true;
  }

  /**
   * Sets the number of iterations a solver should run.
   *
   * @param id The id of the solver to update
   * @param iterations The new number of iterations
   */
  setSolverIterations(id: string, iterations: number) {
    if (!this.solvers[id]) return;

    this.solvers[id].iterations = iterations;
  }
}
