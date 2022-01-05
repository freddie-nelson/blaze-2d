import Color from "../utils/color";
import Renderer from "./renderer";
import Blaze from "../blaze";
import { ZMap } from "../utils/types";
import Fluid, { MAX_FLUID_PARTICLES } from "../physics/fluid/fluid";
import { ShaderProgramInfo } from "../utils/gl";
import Rect from "../shapes/rect";
import { vec2 } from "gl-matrix";

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
    const min = this.fluidQueue.min || 0;
    const max = this.fluidQueue.max || Blaze.getZLevels();

    if (!this.getCamera() || z < min || z > max || !this.fluidQueue[z]) return;

    const queue = this.fluidQueue[z];

    const camera = this.getCamera();
    const cameraRect = new Rect(
      camera.viewport.getWidth(),
      camera.viewport.getHeight(),
      camera.getPosition(),
      camera.getRotation(),
    );
    const vertices = cameraRect.getVerticesClipSpace(vec2.create(), this.getScale());

    const quad = new Float32Array(vertices);
    const indices = cameraRect.getIndices();
    const dimensions = vec2.fromValues(cameraRect.getWidth(), cameraRect.getHeight());

    for (const fluid of queue) {
      this.renderFluid(fluid, quad, indices, dimensions);
    }

    delete this.fluidQueue[z];
  }

  /**
   * Renders a {@link Fluid} using a metaball shader.
   *
   * @param fluid The fluid to render
   * @param quad The vertices of the quad to render to (should be size of camera's viewport)
   * @param indices The indices of the quad to render to
   * @param quadDimensions The width and height of the quad
   */
  static renderFluid(fluid: Fluid, quad: Float32Array, indices: Uint16Array, quadDimensions: vec2) {
    const particles = fluid.particles;
    const count = Math.min(fluid.particles.length, MAX_FLUID_PARTICLES);

    const world = Blaze.getScene().world;
    const worldToPixel = world.getWorldToPixelSpace();

    const radius = fluid.particleRadius * worldToPixel[0];
    const positions = new Float32Array(count * 2);

    for (let i = 0; i < count; i++) {
      const pos = world.getPixelFromWorld(particles[i].getPosition());

      positions[i * 2] = pos[0];
      positions[i * 2 + 1] = pos[1];
    }

    const gl = this.getGL();
    const programInfo = this.metaballProgramInfo;

    // vertices
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);

    gl.vertexAttribPointer(programInfo.attribLocations.vertex, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attribLocations.vertex);

    // indices
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    // uniforms
    gl.useProgram(programInfo.program);
    gl.uniform1f(programInfo.uniformLocations.zIndex, fluid.zIndex / Blaze.getZLevels());

    gl.uniform2fv(programInfo.uniformLocations.resolution, quadDimensions);
    gl.uniform2fv(programInfo.uniformLocations.metaballs, positions);
    gl.uniform1i(programInfo.uniformLocations.metaballsCount, count);
    gl.uniform1f(programInfo.uniformLocations.radius, radius);
    gl.uniform1f(programInfo.uniformLocations.threshold, fluid.renderThreshold);
    gl.uniform4fv(programInfo.uniformLocations.color, fluid.color.webgl);

    gl.drawElements(gl[this.getMode()], indices.length, gl.UNSIGNED_SHORT, 0);
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
