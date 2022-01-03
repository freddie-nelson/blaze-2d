/**
 * Stores variations of the delta time, the time between each frame/update.
 */
export default class TimeStep {
  /**
   * The time of the start of the timestep in ms since the page loaded.
   *
   * @see [performance.now](https://developer.mozilla.org/en-US/docs/Web/API/Performance/now)
   */
  time: number;

  dt: number;
  lastDt: number;
  dtRatio: number;

  dtSquared: number;
  inverseDt: number;

  /**
   * Creates an {@link TimeStep}.
   *
   * @param time The current time
   * @param dt The current delta time
   * @param lastDt The last delta time
   */
  constructor(time: number, dt: number, lastDt: number) {
    this.time = time;
    this.dt = dt;
    this.lastDt = lastDt;

    this.dtRatio = dt / lastDt;
    this.dtSquared = dt * dt;
    this.inverseDt = 1 / dt;
  }
}
