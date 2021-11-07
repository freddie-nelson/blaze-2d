import { vec2 } from "gl-matrix";
import Camera from "./camera/camera";
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
  stickyBoundingBox = true;

  name = "";

  /**
   * Creates a new {@link Entity} instance with a position, bounding box and body pieces.
   *
   * @param position The entity's position in world space
   * @param boundingBox The entity's bounding box to use for collisions/physics
   * @param pieces The entity's body pieces for rendering
   */
  constructor(position: vec2, boundingBox: Box, pieces: Rect[] = [], name = "") {
    super();
    this.setPosition(position);

    this.boundingBox = boundingBox;
    this.pieces = pieces;

    this.name = name;
  }

  update(delta?: number) {
    if (this.stickyBoundingBox) {
      if (!vec2.exactEquals(this.getPosition(), this.boundingBox.getPosition())) {
        this.boundingBox.setPosition(vec2.clone(this.getPosition()));
      }

      this.boundingBox.setRotation(this.getRotation());
    }
  }

  render(gl: WebGL2RenderingContext, camera: Camera, worldCellToClipSpaceScale: vec2) {
    const position = vec2.clone(this.getPosition());
    vec2.sub(position, position, camera.getPosition());

    // if (this.name) console.log(this.name);

    for (const p of this.pieces) {
      renderRect(gl, p, position, 1, worldCellToClipSpaceScale);
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

  /**
   * Calculates the center point of the entities bounding box in world space, with an origin point added to it.
   *
   * Rotations are not taken into account.
   *
   * @param origin The origin in world space to get the center relative to.
   */
  getCenter(origin = vec2.fromValues(0, 0)) {
    const center = vec2.fromValues(this.boundingBox.getWidth() / 2, this.boundingBox.getHeight() / 2);
    vec2.add(center, center, this.getPosition());
    vec2.add(center, center, origin);
    return center;
  }
}
