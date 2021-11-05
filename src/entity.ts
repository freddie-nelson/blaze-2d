import { vec3 } from "gl-matrix";
import Object3D from "./object3d";
import Box from "./physics/box";
import Cuboid from "./shapes/cuboid";

/**
 * Represents a generic entity in 3D space.
 */
export default class Entity extends Object3D {
  private pieces: Cuboid[];
  boundingBox: Box;

  /**
   * Creates a new {@link Entity} instance with a position, bounding box and body pieces.
   *
   * @param position The entity's position in world space
   * @param boundingBox The entity's bounding box to use for collisions/physics
   * @param pieces The entity's body pieces for rendering
   */
  constructor(position: vec3, boundingBox: Box, pieces: Cuboid[] = []) {
    super();
    this.setPosition(position);

    this.boundingBox = boundingBox;
    this.pieces = pieces;
  }

  /**
   * Sets the entity's body pieces.
   *
   * @param pieces The entity's new pieces
   */
  setPieces(pieces: Cuboid[]) {
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
  addPiece(piece: Cuboid) {
    this.pieces.push(piece);
  }
}
