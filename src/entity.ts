import { vec2 } from "gl-matrix";
import Camera from "./camera/camera";
import Box from "./physics/box";
import RigidBody from "./physics/rigidbody";
import Shape from "./shapes/shape";

/**
 * Represents a generic entity in 3D space.
 */
export default class Entity extends RigidBody {
  name = "";

  private pieces: Shape[];
  zIndex = 0;

  boundingBox: Box;
  stickyBoundingBox = true;

  hasPhysics = false;

  /**
   * Creates a new {@link Entity} instance with a position, bounding box and body pieces.
   *
   * @param position The entity's position in world space
   * @param boundingBox The entity's bounding box to use for collisions/physics
   * @param pieces The entity's body pieces for rendering
   */
  constructor(position: vec2, boundingBox: Box, pieces: Shape[] = [], name = "") {
    super();
    this.setPosition(position);

    this.boundingBox = boundingBox;
    this.pieces = pieces;

    this.name = name;
  }

  /**
   * Updates the entity's physics and stick bounds.
   *
   * @param delta Time since last tick
   */
  update(delta?: number) {
    if (this.stickyBoundingBox) {
      if (!vec2.exactEquals(this.getPosition(), this.boundingBox.getPosition())) {
        this.boundingBox.setPosition(vec2.clone(this.getPosition()));
      }

      this.boundingBox.setRotation(this.getRotation());
    }

    if (this.hasPhysics) {
      // TODO physics system
    }
  }

  /**
   * Renders the entity's pieces.
   *
   * @param camera The camera to use for rendering
   * @param worldCellToClipSpaceScale The world cell to clip space cell scale value
   */
  render(camera: Camera, worldCellToClipSpaceScale: vec2) {
    const position = vec2.clone(this.getPosition());
    vec2.sub(position, position, camera.getPosition());

    // if (this.name) console.log(this.name);

    for (const p of this.pieces) {
      p.render(position, this.zIndex, worldCellToClipSpaceScale);
    }
  }

  /**
   * Sets the entity's body pieces.
   *
   * @param pieces The entity's new pieces
   */
  setPieces(pieces: Shape[]) {
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
  addPiece(piece: Shape) {
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
