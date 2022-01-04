import { vec2 } from "gl-matrix";

import Rect from "../shapes/rect";
import { clear, createShaderProgram, ShaderProgramInfo } from "../utils/gl";
import TextureLoader from "../texture/loader";

import Color from "../utils/color";
import Renderer from "./renderer";
import Entity from "../entity";
import Shape from "../shapes/shape";
import TextureAtlas from "../texture/atlas";
import Camera from "../camera/camera";
import Blaze from "../blaze";
import Circle from "../shapes/circle";
import { ZMap } from "../utils/types";
import Triangle from "../shapes/triangle";
import Fluid from "../physics/fluid/fluid";

/**
 * Renders {@link Fluid}s using a marching squares metaball algorithm.
 */
export default abstract class FluidRenderer extends Renderer {
  private static fluidQueue: ZMap<Fluid[]> = {};

  /**
   * Renders all fluids in the queue and clears the queue.
   *
   * If the {@link Renderer}'s camera has not been set nothing will be rendered.
   */
  static flush(z: number) {
    const min = this.queue.min || 0;
    const max = this.queue.max || Blaze.getZLevels();

    if (!this.getCamera() || z < min || z > max || !this.queue[z]) return;

    const queue = this.fluidQueue[z];

    for (const fluid of queue) {
      this.renderFluid(fluid);
    }

    delete this.queue[z];
  }

  /**
   * Renders a {@link Fluid} using a metaball shader.
   *
   * @param fluid The fluid to render
   */
  static renderFluid(fluid: Fluid) {
    const particles = fluid.particles;

    const radius = fluid.particleRadius;
    const positions = new Float32Array(particles.length * 2);

    let i = 0;
    for (const p of particles) {
      const pos = p.getPosition();
      positions[i++] = pos[0];
      positions[++i] = pos[1];
    }
  }

  /**
   * Adds a {@link Fluid} to the render queue.
   *
   * @param fluid The fluid to queue for rendering
   */
  static queueFluid(fluid: Fluid) {
    const zIndex = fluid.zIndex;

    if (!this.fluidQueue[zIndex]) this.fluidQueue[zIndex] = [fluid];
    else this.fluidQueue[zIndex].push(fluid);

    if (zIndex >= (this.fluidQueue.max ? this.fluidQueue.max : 0)) this.fluidQueue.max = zIndex;
    if (zIndex <= (this.fluidQueue.min ? this.fluidQueue.min : 0)) this.fluidQueue.min = zIndex;
  }

  /**
   * Gets the fluid render queue.
   *
   * @returns the fluid render queue
   */
  static getFluidQueue() {
    return this.fluidQueue;
  }

  /**
   * Gets the maximum zIndex used by the queue.
   *
   * @returns The max zIndex of the queue
   */
  static getQueueMax() {
    return this.fluidQueue.max;
  }

  /**
   * Gets the minimum zIndex used by the queue.
   *
   * @returns The min zIndex of the queue
   */
  static getQueueMin() {
    return this.fluidQueue.min;
  }
}
