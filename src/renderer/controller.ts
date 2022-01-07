import Blaze from "../blaze";
import Renderer from "./renderer";

/**
 * Handles flush orders of {@link Renderer}s
 */
export default class RenderController {
  renderers: typeof Renderer[] = [];

  /**
   * Flushes all {@link Renderer}s.
   */
  flush() {
    let min = Blaze.getZLevels();
    let max = 0;

    for (const r of this.renderers) {
      if (r.getQueueMax() > max) max = r.getQueueMax();
      if (r.getQueueMin() < min) min = r.getQueueMin();
    }

    for (let z = min; z <= max; z++) {
      for (const r of this.renderers) {
        r.flush(z);
      }
    }
  }

  /**
   * Adds a renderer to the controller.
   *
   * @param renderer The renderer to add
   */
  addRenderer(renderer: typeof Renderer) {
    this.renderers.push(renderer);
  }

  /**
   * Adds the given renderers to the controller.
   *
   * @param renderers The renderers to add
   */
  addRenderers(...renderers: typeof Renderer[]) {
    this.renderers.push(...renderers);
  }

  /**
   * Removes a renderer from the controller.
   *
   * @param renderer The renderer to remove
   */
  removeRenderer(renderer: Renderer) {
    const i = this.renderers.findIndex((r) => r === renderer);
    if (i === -1) return;

    this.renderers.splice(i, 1);
  }
}
