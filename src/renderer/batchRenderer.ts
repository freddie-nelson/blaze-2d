import { vec2 } from "gl-matrix";

import Rect from "../shapes/rect";
import { clear, createShaderProgram, ShaderProgramInfo } from "../utils/gl";
import TextureLoader from "../texture/loader";

import vsRect from "../shaders/rect/vertex.glsl";
import fsRect from "../shaders/rect/fragment.glsl";
import Color from "../utils/color";
import Renderer from "./renderer";
import Entity from "../entity";
import Shape from "../shapes/shape";
import TextureAtlas from "../texture/atlas";
import Camera from "../camera/camera";
import Blaze from "../blaze";

/**
 * Stores the data needed to render a shape in the world.
 *
 * @field `shape` The shape to be rendered
 * @field `pos` The world position to start drawing the shape at
 * @field `rot` A base rotation to apply to the shape's vertices, in radians
 */
interface Renderable<T> {
  shape: T;
  pos: vec2;
  rot: number;
}

interface Geometry {
  vertices: Float32Array;
  indices: Uint16Array;
  uvs: Float32Array;
}

/**
 * Batch renders instances of shapes and entities.
 *
 * A texture atlas must be used with the batch renderer.
 */
export default abstract class BatchRenderer extends Renderer {
  static atlas: TextureAtlas;

  /**
   * Batch render an array of entities.
   *
   * @param entities The entities to render
   * @param zIndex The z position of the rendered rectangle
   * @param scale The world cell size to clip space scale value
   */
  static renderEntities(entities: Entity[], zIndex = 0, scale = vec2.fromValues(1, 1)) {
    const shapes = this.getRenderableShapesFromEntites(entities);

    this.renderRects(shapes.rects, zIndex, scale);
  }

  /**
   * Batch render an array of rectangles.
   *
   * @param rects The rects to render
   * @param zIndex The z position of the rendered rectangle
   * @param scale The world cell size to clip space scale value
   */
  static renderRects(rects: (Rect | Renderable<Rect>)[], zIndex = 0, scale = vec2.fromValues(1, 1)) {
    const renderable =
      rects[0] instanceof Rect
        ? this.getRenderableRectsFromRects(<Rect[]>rects)
        : (rects as Renderable<Rect>[]);

    const vertices: number[] = [];
    const indices: number[] = [];
    const uvs: number[] = [];

    for (const r of renderable) {
      const pos = vec2.clone(r.pos);
      vec2.sub(pos, pos, this.getCamera().getPosition());

      const v = r.shape.getVerticesClipSpace(pos, scale, r.rot);
      const i = r.shape.getIndices((indices.length / 3) * 2);

      const atlasImage = this.atlas.getTexture(r.shape.texture);
      if (!atlasImage) continue;

      const uv = r.shape.getUVCoords().map((uv, i) => {
        if (i % 2 === 0) {
          if (uv === 1) return atlasImage.br[0] / this.atlas.getSize();
          else return atlasImage.tl[0] / this.atlas.getSize();
        } else {
          if (uv === 1) return atlasImage.br[1] / this.atlas.getSize();
          else return atlasImage.tl[1] / this.atlas.getSize();
        }
      });

      vertices.push(...v);
      indices.push(...i);
      uvs.push(...uv);
    }

    const geometry: Geometry = {
      vertices: new Float32Array(vertices),
      indices: new Uint16Array(indices),
      uvs: new Float32Array(uvs),
    };

    this.renderGeometry(geometry, "rect", zIndex);
  }

  /**
   * Renders geometry using a shape shader.
   *
   * @param geometry The geometry to render
   * @param type The type of shape shader to use
   * @param zIndex The z position of the rendered rectangle
   */
  static renderGeometry(geometry: Geometry, type: "rect", zIndex = 0) {
    const gl = this.getGL();
    const programInfo = type === "rect" ? this.rectProgramInfo : undefined;

    // vertex positions
    gl.bindBuffer(gl.ARRAY_BUFFER, this.rectPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, geometry.vertices, gl.STATIC_DRAW);

    gl.vertexAttribPointer(programInfo.attribLocations.vertex, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attribLocations.vertex);

    // uv coords
    gl.bindBuffer(gl.ARRAY_BUFFER, this.rectUvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, geometry.uvs, gl.STATIC_DRAW);

    gl.vertexAttribPointer(programInfo.attribLocations.texCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attribLocations.texCoord);

    // index buffer
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.rectIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geometry.indices, gl.STATIC_DRAW);

    gl.useProgram(programInfo.program);
    gl.uniform1f(programInfo.uniformLocations.zIndex, zIndex / Blaze.getZLevels());

    // bind atlas texture
    TextureLoader.loadTexture(this.atlas);
    const textureUnit = TextureLoader.getUnitOfTexture(this.atlas);
    TextureLoader.updateLastUsed(textureUnit.unit);
    gl.uniform1i(programInfo.uniformLocations.texture, textureUnit.unit - gl.TEXTURE0);

    gl.drawElements(gl[this.getMode()], geometry.indices.length, gl.UNSIGNED_SHORT, 0);
  }

  static getRenderableRectsFromRects(rects: Rect[]) {
    const renderable: Renderable<Rect>[] = [];

    for (const r of rects) {
      renderable.push({
        shape: r,
        pos: vec2.create(),
        rot: 0,
      });
    }

    return renderable;
  }

  static getRenderableShapesFromEntites(entities: Entity[]) {
    const rects: Renderable<Rect>[] = [];

    for (const e of entities) {
      const pieces = e.getPieces();

      for (const p of pieces) {
        if (p instanceof Rect) {
          rects.push({
            shape: p,
            pos: e.getCenter(),
            rot: e.getRotation(),
          });
        }
      }
    }

    return {
      rects,
    };
  }
}
