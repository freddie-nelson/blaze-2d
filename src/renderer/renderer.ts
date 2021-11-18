import { vec2 } from "gl-matrix";

import Rect from "../shapes/rect";
import { clear, createShaderProgram, ShaderProgramInfo } from "../utils/gl";
import TextureLoader from "../texture/loader";

import vsRect from "../shaders/rect/vertex.glsl";
import fsRect from "../shaders/rect/fragment.glsl";
import Color from "../utils/color";
import Blaze from "../blaze";

/**
 * Renders single instances of shapes at a time.
 */
export default abstract class Renderer {
  private static gl: WebGL2RenderingContext;
  private static resolutionScale = 1;

  /**
   * Sets up the renderer to be used for rendering.
   *
   * Creates the webgl2 rendering context for the canvas and clears the webgl buffer.
   *
   * @param canvas
   *
   * @throws When browser does not support webgl 2.0
   */
  static init(canvas: HTMLCanvasElement, opts?: WebGLContextAttributes) {
    const gl = canvas.getContext("webgl2", opts);
    if (!gl) throw new Error("Your browser does not support WebGL 2.0");

    this.gl = gl;
    this.resizeToCanvas();

    // transparency
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.depthFunc(gl.LEQUAL);
    gl.depthMask(true);
    clear(gl);

    this.initShaders(gl);
  }

  static rectProgram: WebGLProgram;
  static rectProgramInfo: ShaderProgramInfo;
  static rectPositionBuffer: WebGLBuffer;
  static rectUvBuffer: WebGLBuffer;
  static rectIndexBuffer: WebGLBuffer;

  private static initShaders(gl: WebGL2RenderingContext) {
    this.rectPositionBuffer = gl.createBuffer();
    this.rectIndexBuffer = gl.createBuffer();
    this.rectUvBuffer = gl.createBuffer();

    this.rectProgram = createShaderProgram(gl, vsRect, fsRect);
    this.rectProgramInfo = {
      program: this.rectProgram,
      attribLocations: {
        vertex: gl.getAttribLocation(this.rectProgram, "a_Vertex"),
        texCoord: gl.getAttribLocation(this.rectProgram, "a_TexCoord"),
      },
      uniformLocations: {
        zIndex: gl.getUniformLocation(this.rectProgram, "u_ZIndex"),
        texture: gl.getUniformLocation(this.rectProgram, "u_Texture"),
      },
    };
  }

  /**
   * Resizes the `width` and `height` of the canvas attached to `gl` to the canvas' `clientWidth` and `clientHeight` multiplied by the `resolutionScale` or 1.
   */
  static resizeToCanvas() {
    const gl = this.gl;
    gl.canvas.width = (gl.canvas as HTMLCanvasElement).clientWidth * this.resolutionScale;
    gl.canvas.height = (gl.canvas as HTMLCanvasElement).clientHeight * this.resolutionScale;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  }

  static clear(clearColor: Color) {
    clear(this.gl, clearColor);
  }

  /**
   * Renders a rectangle.
   *
   * @param rect The rectangle to render
   * @param position The x and y position to render the rectangle at
   * @param zIndex The z position of the rendered rectangle
   * @param scale The world cell size to clip space scale value
   */
  static renderRect(rect: Rect, position = vec2.create(), zIndex = 0, scale = vec2.fromValues(1, 1)) {
    const gl = this.gl;
    const rectProgramInfo = this.rectProgramInfo;

    // vertex positions
    gl.bindBuffer(gl.ARRAY_BUFFER, this.rectPositionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(rect.getVerticesClipSpace(position, scale)),
      gl.STATIC_DRAW
    );

    {
      const numComponents = 2;
      const type = gl.FLOAT;
      const normalize = false;
      const stride = 0;
      const offset = 0;

      gl.vertexAttribPointer(
        rectProgramInfo.attribLocations.vertex,
        numComponents,
        type,
        normalize,
        stride,
        offset
      );
      gl.enableVertexAttribArray(rectProgramInfo.attribLocations.vertex);
    }

    // uv coords
    const uvs = rect.getUVCoords();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.rectUvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);

    {
      const numComponents = 2;
      const type = gl.FLOAT;
      const normalize = false;
      const stride = 0;
      const offset = 0;

      gl.vertexAttribPointer(
        rectProgramInfo.attribLocations.texCoord,
        numComponents,
        type,
        normalize,
        stride,
        offset
      );
      gl.enableVertexAttribArray(rectProgramInfo.attribLocations.texCoord);
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.rectIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, rect.getIndices(), gl.STATIC_DRAW);

    gl.useProgram(rectProgramInfo.program);
    gl.uniform1f(rectProgramInfo.uniformLocations.zIndex, zIndex / Blaze.getZLevels());

    // set active texture
    if (rect.texture) {
      TextureLoader.loadTexture(rect.texture);

      const unit = rect.texture.getTextureUnit();
      TextureLoader.updateLastUsed(unit);
      gl.uniform1i(rectProgramInfo.uniformLocations.texture, unit - gl.TEXTURE0);
    }

    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
  }

  /**
   * Gets the renderer's webgl context.
   *
   * @returns The renderer's webgl context
   */
  static getGL() {
    return this.gl;
  }

  /**
   * Sets the resolution scale to use when rendering.
   *
   * The width and height of the renderer canvas are set to `clientWidth * resolutionScale` and `clientHeight * resolutionScale` respectively.
   *
   * @param resolutionScale The new resolution scale to use
   */
  static setResolutionScale(resolutionScale: number) {
    if (resolutionScale <= 0) throw new Error("Blaze: Resolution scale must be a number greater than 0.");

    this.resolutionScale = resolutionScale;
    this.resizeToCanvas();
  }

  /**
   * Gets the renderer's current resolution scale.
   *
   * @returns The renderer's current resolution scale
   */
  static getResolutionScale() {
    return this.resolutionScale;
  }
}
