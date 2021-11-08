import Rect from "./shapes/rect";
import { clear, createShaderProgram, ShaderProgramInfo } from "./utils/gl";

import vsRect from "./shaders/rect/vertex.glsl";
import fsRect from "./shaders/rect/fragment.glsl";
import { vec2 } from "gl-matrix";
import TextureLoader from "./texture/loader";

/**
 * Creates the webgl2 rendering context for the canvas and clears the webgl buffer.
 *
 * @param canvas
 * @returns The created webgl2 rendering context
 *
 * @throws When browser does not support webgl 2.0
 */
export function createRenderer(canvas: HTMLCanvasElement, opts?: WebGLContextAttributes) {
  const gl = canvas.getContext("webgl2", opts);
  if (!gl) throw new Error("Your browser does not support WebGL 2.0");

  resizeRendererToCanvas(gl);

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.depthFunc(gl.LEQUAL);
  gl.depthMask(true);
  clear(gl);

  return gl;
}

/**
 * Resizes the `width` and `height` of the canvas attached to `gl` to the canvas' `clientWidth` and `clientHeight` multiplied by the `resolutionScale` or 1.
 *
 * @param gl
 */
export function resizeRendererToCanvas(gl: WebGL2RenderingContext, resolutionScale = 1) {
  gl.canvas.width = (gl.canvas as HTMLCanvasElement).clientWidth * resolutionScale;
  gl.canvas.height = (gl.canvas as HTMLCanvasElement).clientHeight * resolutionScale;
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
}

let rectProgram: WebGLProgram;
let rectProgramInfo: ShaderProgramInfo;
let positionBuffer: WebGLBuffer;
let uvBuffer: WebGLBuffer;
let indexBuffer: WebGLBuffer;

/**
 * Renders a rectangle using the given webgl context.
 *
 * @param gl The webgl context to render to
 * @param rect The rectangle to render
 * @param position The x and y position to render the rectangle at
 * @param zIndex The z position of the rendered rectangle
 * @param scale The world cell size to clip space scale value
 */
export function renderRect(
  gl: WebGL2RenderingContext,
  rect: Rect,
  position = vec2.create(),
  zIndex = 0,
  scale = vec2.fromValues(1, 1)
) {
  if (!rectProgram) {
    rectProgram = createShaderProgram(gl, vsRect, fsRect);
    rectProgramInfo = {
      program: rectProgram,
      attribLocations: {
        vertex: gl.getAttribLocation(rectProgram, "a_Vertex"),
        texCoord: gl.getAttribLocation(rectProgram, "a_TexCoord"),
      },
      uniformLocations: {
        zIndex: gl.getUniformLocation(rectProgram, "u_ZIndex"),
        texture: gl.getUniformLocation(rectProgram, "u_Texture"),
      },
    };
  }

  // vertex positions
  if (!positionBuffer) positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
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
  if (!uvBuffer) uvBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
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

  if (!indexBuffer) indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, rect.getIndices(), gl.STATIC_DRAW);

  gl.useProgram(rectProgramInfo.program);
  gl.uniform1f(rectProgramInfo.uniformLocations.zIndex, zIndex);

  // set active texture
  if (rect.texture) {
    TextureLoader.loadTexture(rect.texture);

    const unit = rect.texture.getTextureUnit();
    TextureLoader.updateLastUsed(unit);
    gl.uniform1i(rectProgramInfo.uniformLocations.texture, unit - gl.TEXTURE0);
  }

  gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
}
