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
import Circle from "../shapes/circle";
import { ZMap } from "../utils/types";
import Triangle from "../shapes/triangle";

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
  texCoords: Float32Array;
  uvs: Float32Array;
  opacity: Float32Array;
}

/**
 * Batch renders instances of shapes and entities.
 *
 * A texture atlas must be used with the batch renderer.
 */
export default abstract class BatchRenderer extends Renderer {
  static atlas: TextureAtlas;

  static batchQueue: ZMap<{ [index: string]: Renderable<Shape>[] }> = {};

  /**
   * Renders all items currently in the batch render queue and clears the queue.
   *
   * Should be called at the end of each frame.
   *
   * If there is no camera specified in {@link Renderer} then nothing will be rendered.
   */
  static flush(z: number) {
    const min = this.batchQueue.min || 0;
    const max = this.batchQueue.max || Blaze.getZLevels();

    if (!this.getCamera() || z < min || z > max || !this.batchQueue[z]) return;

    const queue = this.batchQueue[z];

    for (const type of Object.keys(queue)) {
      const count = queue[type].length;
      if (count <= 0) continue;

      switch (type) {
        case "rect":
          this.renderRects(queue[type] as Renderable<Rect>[], z);
          break;
        case "circle":
          this.renderCircles(queue[type] as Renderable<Circle>[], z);
          break;
        case "triangle":
          this.renderTriangles(queue[type] as Renderable<Triangle>[], z);
          break;
        default:
          break;
      }
    }

    delete this.batchQueue[z];
  }

  /**
   * Queue an entity to be batch rendered.
   *
   * @param entity The entity to render
   * @param zIndex The z index of the entity
   */
  static queueEntity(entity: Entity, zIndex = 0) {
    const shapes = this.getRenderableShapesFromEntites([entity]);

    this.queueRects(shapes.rects, zIndex);
    this.queueCircles(shapes.circles, zIndex);
    this.queueTriangles(shapes.triangles, zIndex);
  }

  /**
   * Batch render an array of entities.
   *
   * @param entities The entities to render
   * @param zIndex The z position of the rendered rectangle
   */
  static queueEntities(entities: Entity[], zIndex = 0) {
    const shapes = this.getRenderableShapesFromEntites(entities);

    this.queueRects(shapes.rects, zIndex);
    this.queueCircles(shapes.circles, zIndex);
    this.queueTriangles(shapes.triangles, zIndex);
  }

  /**
   * Queue a group of rectangles to be batch rendered.
   *
   * @param rects The rects to queue
   * @param zIndex The z index of the rectangles
   */
  static queueRects(rects: (Rect | Renderable<Rect>)[], zIndex = 0) {
    const renderable =
      rects[0] instanceof Rect ? this.getRenderableRectsFromRects(<Rect[]>rects) : (rects as Renderable<Rect>[]);

    this.addRenderablesToQueue(renderable, zIndex, "rect");
  }

  /**
   * Queue a group of circle to be batch rendered.
   *
   * @param circles The circles to queue
   * @param zIndex The z index of the circles
   */
  static queueCircles(circles: (Circle | Renderable<Circle>)[], zIndex = 0) {
    const renderable =
      circles[0] instanceof Circle
        ? this.getRenderableCirclesFromCircles(<Circle[]>circles)
        : (circles as Renderable<Circle>[]);

    this.addRenderablesToQueue(renderable, zIndex, "circle");
  }

  /**
   * Queue a group of triangle to be batch rendered.
   *
   * @param triangles The triangles to queue
   * @param zIndex The z index of the triangles
   */
  static queueTriangles(triangles: (Triangle | Renderable<Triangle>)[], zIndex = 0) {
    const renderable =
      triangles[0] instanceof Triangle
        ? this.getRenderableTrianglesfromTriangles(<Triangle[]>triangles)
        : (triangles as Renderable<Triangle>[]);

    this.addRenderablesToQueue(renderable, zIndex, "triangle");
  }

  private static addRenderablesToQueue(renderables: Renderable<Shape>[], zIndex: number, type: string) {
    if (!this.batchQueue[zIndex]) this.batchQueue[zIndex] = {};
    if (!this.batchQueue[zIndex][type]) this.batchQueue[zIndex][type] = [];

    this.batchQueue[zIndex][type].push(...renderables);

    if (zIndex > this.batchQueue.max) this.batchQueue.max = zIndex;
    if (zIndex < this.batchQueue.min) this.batchQueue.min = zIndex;
  }

  /**
   * Batch render an array of rectangles.
   *
   * @param rects The rects to render
   * @param zIndex The z index of the rendered rectangles
   */
  private static renderRects(rects: (Rect | Renderable<Rect>)[], zIndex = 0) {
    const renderable =
      rects[0] instanceof Rect ? this.getRenderableRectsFromRects(<Rect[]>rects) : (rects as Renderable<Rect>[]);

    const geometry = this.getGeometryFromRenderables(renderable);

    this.renderGeometry(geometry, "rect", zIndex);
  }

  /**
   * Batch render an array of circles.
   *
   * @param circles The circles to render
   * @param zIndex The z index of the rendered circles
   */
  private static renderCircles(circles: (Circle | Renderable<Circle>)[], zIndex = 0) {
    const renderable =
      circles[0] instanceof Circle
        ? this.getRenderableCirclesFromCircles(<Circle[]>circles)
        : (circles as Renderable<Circle>[]);

    const geometry = this.getGeometryFromRenderables(renderable);

    this.renderGeometry(geometry, "circle", zIndex);
  }

  /**
   * Batch render an array of triangles.
   *
   * @param triangles The triangles to render
   * @param zIndex The z index of the rendered triangles
   */
  private static renderTriangles(triangles: (Triangle | Renderable<Triangle>)[], zIndex = 0) {
    const renderable =
      triangles[0] instanceof Triangle
        ? this.getRenderableTrianglesfromTriangles(<Triangle[]>triangles)
        : (triangles as Renderable<Triangle>[]);

    const geometry = this.getGeometryFromRenderables(renderable);

    this.renderGeometry(geometry, "triangle", zIndex);
  }

  /**
   * Renders geometry using a shape shader.
   *
   * @param geometry The geometry to render
   * @param type The type of shape shader to use
   * @param zIndex The z position of the rendered rectangle
   */
  private static renderGeometry(geometry: Geometry, type: "rect" | "circle" | "triangle", zIndex = 0) {
    const gl = this.getGL();

    // select shader program
    let programInfo: ShaderProgramInfo;
    switch (type) {
      case "rect":
        programInfo = this.rectProgramInfo;
        break;
      case "circle":
        programInfo = this.circleProgramInfo;
        break;
      case "triangle":
        programInfo = this.triangleProgramInfo;
        break;
      default:
        return;
    }

    // vertex positions
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, geometry.vertices, gl.STATIC_DRAW);

    gl.vertexAttribPointer(programInfo.attribLocations.vertex, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attribLocations.vertex);

    // tex coords
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, geometry.texCoords, gl.STATIC_DRAW);

    gl.vertexAttribPointer(programInfo.attribLocations.texCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attribLocations.texCoord);

    // uv coords
    gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, geometry.uvs, gl.STATIC_DRAW);

    gl.vertexAttribPointer(programInfo.attribLocations.uv, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attribLocations.uv);

    // opacity
    gl.bindBuffer(gl.ARRAY_BUFFER, this.opacityBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, geometry.opacity, gl.STATIC_DRAW);

    gl.vertexAttribPointer(programInfo.attribLocations.opacity, 1, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attribLocations.opacity);

    // index buffer
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
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

  /**
   * Generates geometry data for an array of {@link Renderable} shapes.
   */
  private static getGeometryFromRenderables(renderable: Renderable<Shape>[]): Geometry {
    const vertices: number[] = [];
    const indices: number[] = [];
    const texCoords: number[] = [];
    const uvs: number[] = [];
    const opacity: number[] = [];

    let indicesOffset = 0;

    for (const r of renderable) {
      const v = r.shape.getVerticesClipSpace(r.pos, this.scale, r.rot, this.getCamera());
      const i = r.shape.getIndices(indicesOffset);
      indicesOffset += v.length / 2;

      const atlasImage = this.atlas.getTexture(r.shape.texture);
      if (!atlasImage) continue;

      const uv = r.shape.getUVCoords();
      const texCoord = uv.map((uv, i) => {
        if (i % 2 === 0) {
          // console.log(atlasImage.tl, atlasImage.br);
          if (uv === 1) return atlasImage.br[0] / this.atlas.getSize();
          else return atlasImage.tl[0] / this.atlas.getSize();
        } else {
          if (uv === 1) return atlasImage.br[1] / this.atlas.getSize();
          else return atlasImage.tl[1] / this.atlas.getSize();
        }
      });

      // opacity
      const o = new Float32Array(v.length / 2).fill(r.shape.opacity);

      vertices.push(...v);
      indices.push(...i);
      texCoords.push(...texCoord);
      uvs.push(...uv);
      opacity.push(...o);
    }

    return <Geometry>{
      vertices: new Float32Array(vertices),
      indices: new Uint16Array(indices),
      texCoords: new Float32Array(texCoords),
      uvs: new Float32Array(uvs),
      opacity: new Float32Array(opacity),
    };
  }

  private static getRenderableRectsFromRects(rects: Rect[]) {
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

  private static getRenderableCirclesFromCircles(circles: Circle[]) {
    const renderable: Renderable<Circle>[] = [];

    for (const c of circles) {
      renderable.push({
        shape: c,
        pos: vec2.create(),
        rot: 0,
      });
    }

    return renderable;
  }

  private static getRenderableTrianglesfromTriangles(triangles: Triangle[]) {
    const renderable: Renderable<Triangle>[] = [];

    for (const t of triangles) {
      renderable.push({
        shape: t,
        pos: vec2.create(),
        rot: 0,
      });
    }

    return renderable;
  }

  private static getRenderableShapesFromEntites(entities: Entity[]) {
    const rects: Renderable<Rect>[] = [];
    const circles: Renderable<Circle>[] = [];
    const triangles: Renderable<Triangle>[] = [];

    for (const e of entities) {
      const pieces = e.getPieces();

      for (const p of pieces) {
        if (p instanceof Rect) {
          rects.push({
            shape: p,
            pos: e.getPosition(),
            rot: e.getRotation(),
          });
        } else if (p instanceof Circle) {
          circles.push({
            shape: p,
            pos: e.getPosition(),
            rot: e.getRotation(),
          });
        } else if (p instanceof Triangle) {
          triangles.push({
            shape: p,
            pos: e.getPosition(),
            rot: e.getRotation(),
          });
        }
      }
    }

    return {
      rects,
      circles,
      triangles,
    };
  }

  /**
   * Gets the batch render queue.
   *
   * @returns the batch render queue
   */
  static getBatchQueue() {
    return this.batchQueue;
  }

  /**
   * Gets the maximum zIndex used by the queue.
   *
   * @returns The max zIndex of the queue
   */
  static getQueueMax() {
    return this.batchQueue.max;
  }

  /**
   * Gets the minimum zIndex used by the queue.
   *
   * @returns The min zIndex of the queue
   */
  static getQueueMin() {
    return this.batchQueue.min;
  }

  /**
   * Sets the maximum zIndex used by the queue.
   *
   * @param max The max zIndex of the queue
   */
  static setQueueMax(max: number) {
    this.batchQueue.max = max;
  }

  /**
   * Sets the minimum zIndex used by the queue.
   *
   * @param min The min zIndex of the queue
   */
  static setQueueMin(min: number) {
    this.batchQueue.min = min;
  }
}
