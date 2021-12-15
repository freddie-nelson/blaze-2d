import { glMatrix, vec2 } from "gl-matrix";

import Rect from "../shapes/rect";
import { clear, createShaderProgram, ShaderProgramInfo } from "../utils/gl";
import TextureLoader from "../texture/loader";

import vsRect from "../shaders/rect/vertex.glsl";
import fsRect from "../shaders/rect/fragment.glsl";
import vsCircle from "../shaders/circle/vertex.glsl";
import fsCircle from "../shaders/circle/fragment.glsl";
import vsTriangle from "../shaders/triangle/vertex.glsl";
import fsTriangle from "../shaders/triangle/fragment.glsl";

import Color from "../utils/color";
import Blaze from "../blaze";
import Camera from "../camera/camera";
import Circle from "../shapes/circle";
import Shape from "../shapes/shape";
import { ZMap } from "../utils/types";
import Triangle from "../shapes/triangle";

interface RenderQueueItem {
  shape: Shape;
  position: vec2;
  rotation: number;
}

/**
 * Renders single instances of shapes at a time.
 */
export default abstract class Renderer {
  private static gl: WebGL2RenderingContext;
  private static resolutionScale = 1;
  private static mode: "TRIANGLES" | "LINES" = "TRIANGLES";
  private static camera: Camera;

  /**
   * The scale applied to shape vertices to obtain their clip space vertices.
   */
  protected static scale = vec2.fromValues(1, 1);

  private static queue: ZMap<RenderQueueItem[]> = {};

  // buffers
  static positionBuffer: WebGLBuffer;
  static texBuffer: WebGLBuffer;
  static uvBuffer: WebGLBuffer;
  static indexBuffer: WebGLBuffer;

  // shader programs
  static rectProgram: WebGLProgram;
  static rectProgramInfo: ShaderProgramInfo;

  static circleProgram: WebGLProgram;
  static circleProgramInfo: ShaderProgramInfo;

  static triangleProgram: WebGLProgram;
  static triangleProgramInfo: ShaderProgramInfo;

  /**
   * Sets up the renderer to be used for rendering.
   *
   * Creates the webgl2 rendering context for the canvas and clears the webgl buffer.
   *
   * @throws When browser does not support webgl 2.0
   *
   * @param canvas The canvas to grab webgl context from
   * @param opts {@link WebGLContextAttributes} to pass to the `getContext` call
   */
  static init(canvas: HTMLCanvasElement, opts?: WebGLContextAttributes) {
    const gl = canvas.getContext("webgl2", opts);
    if (!gl) throw new Error("Your browser does not support WebGL 2.0");

    this.gl = gl;
    this.resizeToCanvas();

    // setup resize observer
    const observer = new ResizeObserver((entries) => {
      if (canvas.width === canvas.clientWidth && canvas.height === canvas.clientHeight) return;

      this.resizeToCanvas();
    });
    observer.observe(canvas);

    // transparency
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.blendEquation(gl.FUNC_ADD);

    // gl.enable(gl.DEPTH_TEST);
    // gl.enable(gl.CULL_FACE);
    // gl.depthFunc(gl.LEQUAL);
    // gl.depthMask(true);
    clear(gl);

    this.initShaders(gl);
  }

  private static initShaders(gl: WebGL2RenderingContext) {
    // Rectangle shader
    this.positionBuffer = gl.createBuffer();
    this.indexBuffer = gl.createBuffer();
    this.texBuffer = gl.createBuffer();
    this.uvBuffer = gl.createBuffer();

    this.rectProgram = createShaderProgram(gl, vsRect, fsRect);
    this.rectProgramInfo = {
      program: this.rectProgram,
      attribLocations: {
        vertex: gl.getAttribLocation(this.rectProgram, "a_Vertex"),
        texCoord: gl.getAttribLocation(this.rectProgram, "a_TexCoord"),
        uv: gl.getAttribLocation(this.rectProgram, "a_Uv"),
      },
      uniformLocations: {
        zIndex: gl.getUniformLocation(this.rectProgram, "u_ZIndex"),
        texture: gl.getUniformLocation(this.rectProgram, "u_Texture"),
      },
    };

    // Circle shader
    this.circleProgram = createShaderProgram(gl, vsCircle, fsCircle);
    this.circleProgramInfo = {
      program: this.circleProgram,
      attribLocations: {
        vertex: gl.getAttribLocation(this.circleProgram, "a_Vertex"),
        texCoord: gl.getAttribLocation(this.circleProgram, "a_TexCoord"),
        uv: gl.getAttribLocation(this.circleProgram, "a_Uv"),
      },
      uniformLocations: {
        zIndex: gl.getUniformLocation(this.circleProgram, "u_ZIndex"),
        texture: gl.getUniformLocation(this.circleProgram, "u_Texture"),
      },
    };

    // triangle shader
    this.triangleProgram = createShaderProgram(gl, vsTriangle, fsTriangle);
    this.triangleProgramInfo = {
      program: this.triangleProgram,
      attribLocations: {
        vertex: gl.getAttribLocation(this.triangleProgram, "a_Vertex"),
        texCoord: gl.getAttribLocation(this.circleProgram, "a_TexCoord"),
        uv: gl.getAttribLocation(this.triangleProgram, "a_Uv"),
      },
      uniformLocations: {
        zIndex: gl.getUniformLocation(this.triangleProgram, "u_ZIndex"),
        texture: gl.getUniformLocation(this.triangleProgram, "u_Texture"),
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
   * Renders all items currently in the render queue and clears the queue.
   *
   * Should be called at the end of each frame.
   *
   * If there is no camera specified in {@link Renderer} then nothing will be rendered.
   */
  static flush() {
    if (!this.camera) return;

    const queue = this.queue;
    const min = queue.min || 0;
    const max = queue.max || Blaze.getZLevels();

    for (let z = min; z <= max; z++) {
      if (!queue[z]) continue;

      for (const item of queue[z]) {
        this.renderQueueItem(item, z);
      }

      delete queue[z];
    }
  }

  /**
   * Adds a shape to the render queue.
   *
   * @param shape The shape to queue
   * @param position The x and y position to render the rectangle at
   * @param rotation The rotation to apply to the shape
   * @param zIndex The z position of the rendered rectangle
   * @param scale The world to clip space scale value
   */
  static queueShape(shape: Shape, position = vec2.create(), rotation = 0, zIndex = 0) {
    const item: RenderQueueItem = {
      shape,
      position,
      rotation,
    };

    if (this.queue[zIndex]) this.queue[zIndex].push(item);
    else this.queue[zIndex] = [item];
  }

  /**
   * Renders a shape from a {@link RenderQueueItem} object.
   *
   * @param item The {@link RenderQueueItem} to render
   * @param zIndex The z index to render the shape at
   */
  private static renderQueueItem({ shape, position, rotation }: RenderQueueItem, zIndex: number) {
    const gl = this.gl;

    let programInfo: ShaderProgramInfo;
    if (shape instanceof Rect) {
      programInfo = this.rectProgramInfo;
    } else if (shape instanceof Circle) {
      programInfo = this.circleProgramInfo;
    } else if (shape instanceof Triangle) {
      programInfo = this.triangleProgramInfo;
    }

    // vertex positions
    const vertices = shape.getVerticesClipSpace(position, this.scale, rotation, this.camera);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    gl.vertexAttribPointer(programInfo.attribLocations.vertex, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attribLocations.vertex);

    // tex coords
    const texCoords = shape.getUVCoords();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);

    gl.vertexAttribPointer(programInfo.attribLocations.texCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attribLocations.texCoord);

    // uv coords
    const uvs = shape.getUVCoords();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);

    gl.vertexAttribPointer(programInfo.attribLocations.uv, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attribLocations.uv);

    // indices
    const indices = shape.getIndices();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    gl.useProgram(programInfo.program);
    gl.uniform1f(programInfo.uniformLocations.zIndex, zIndex / Blaze.getZLevels());

    // set active texture
    if (shape.texture) {
      TextureLoader.loadTexture(shape.texture);

      const unit = shape.texture.getTextureUnit();
      TextureLoader.updateLastUsed(unit);
      gl.uniform1i(programInfo.uniformLocations.texture, unit - gl.TEXTURE0);
    }

    gl.drawElements(gl[this.mode], indices.length, gl.UNSIGNED_SHORT, 0);
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

  /**
   * Sets the mode the renderer will use for drawing.
   *
   * @throws When the provided mode is not TRIANGLES or LINES
   *
   * @param mode The mode to use
   */
  static setMode(mode: "TRIANGLES" | "LINES") {
    const m = mode.toUpperCase();
    if (m !== "TRIANGLES" && m !== "LINES") throw new Error("Renderer: Mode can only be TRIANGLES or LINES.");

    this.mode = m;
  }

  /**
   * Gets the current webgl rendering mode being used by the renderer.
   *
   * @returns The rendering mode
   */
  static getMode() {
    return this.mode;
  }

  /**
   * Sets the camera to use for rendering.
   *
   * @param camera The camera to use for rendering
   */
  static useCamera(camera: Camera) {
    this.camera = camera;
  }

  /**
   * Gets the camera that is currently being used for rendering.
   *
   * @returns The camera that is currently being used for rendering
   */
  static getCamera() {
    return this.camera;
  }

  /**
   * Set the scale that is applied to vertices to obtain the vertices in clip space.
   *
   * @param scale The scaling vector
   */
  static setScale(scale: vec2) {
    this.scale = scale;
  }

  /**
   * Gets the scale that is applied to vertices to obtain the vertices in clip space.
   *
   * @returns The scaling vector
   */
  static getScale() {
    return this.scale;
  }
}
