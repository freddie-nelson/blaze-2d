import { vec2 } from "gl-matrix";
import Object2D from "./object2d";
import Box from "./physics/box";
import { renderRect } from "./renderer";
import Rect from "./shapes/rect";

/**
 * Represents a generic entity in 3D space.
 */
export default class Entity extends Object2D {
  private pieces: Rect[];
  boundingBox: Box;

  /**
   * Creates a new {@link Entity} instance with a position, bounding box and body pieces.
   *
   * @param position The entity's position in world space
   * @param boundingBox The entity's bounding box to use for collisions/physics
   * @param pieces The entity's body pieces for rendering
   */
  constructor(position: vec2, boundingBox: Box, pieces: Rect[] = []) {
    super();
    this.setPosition(position);

    this.boundingBox = boundingBox;
    this.pieces = pieces;
  }

  update(delta?: number) {}

  render(gl: WebGL2RenderingContext, scale: { width: number; height: number }) {
    const position = this.getPosition();

    for (const p of this.pieces) {
      renderRect(gl, p, position, 1, vec2.fromValues(scale.width, scale.height));
    }
  }

  /**
   * Sets the entity's body pieces.
   *
   * @param pieces The entity's new pieces
   */
  setPieces(pieces: Rect[]) {
    this.pieces = pieces;
  }

  /**
   * Gets the entity's body pieces.
   *
   * @returns The entity's pieces
   */
  getPieces() {
    return this.pieces;
  }

  /**
   * Adds a body piece to the entity.
   *
   * @param piece The piece to add to the entity
   */
  addPiece(piece: Rect) {
    this.pieces.push(piece);
  }
}
