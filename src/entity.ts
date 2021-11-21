import { vec2 } from "gl-matrix";
import Camera from "./camera/camera";
import Box from "./physics/box";
import RigidBody from "./physics/rigidbody";
import Shape from "./shapes/shape";
import validateZIndex from "./utils/validators";

/**
 * Represents a generic entity in 3D space.
 */
export default class Entity extends RigidBody {
  name = "";

  private pieces: Shape[];
  private zIndex = 0;

  stickyBounds = true;

  /**
   * Creates a new {@link Entity} instance with a position, bounding box and body pieces.
   *
   * @param position The entity's position in world space
   * @param bounds The entity's bounding box
   * @param pieces The entity's body pieces for rendering
   */
  constructor(position: vec2, bounds: Box, pieces: Shape[] = [], name = "", gravity = 9.8) {
    super(bounds);
    this.setPosition(position);

    this.pieces = pieces;
    this.name = name;
  }

  /**
   * Sets the events that can be attached to in `listeners`.
   */
  protected setupEvents() {
    super.setupEvents();

    this.listeners.update = [];
  }

  /**
   * Updates the entity's physics and bounds.
   *
   * @param delta Time since last tick
   */
  update(delta?: number) {
    if (this.stickyBounds) {
      if (!vec2.exactEquals(this.getPosition(), this.bounds.getPosition())) {
        this.bounds.setPosition(vec2.clone(this.getPosition()));
      }

      this.bounds.setRotation(this.getRotation());
    }

    // console.log(this.bounds.getPosition());

    this.fireEvent("update", delta || 0);
  }

  /**
   * Renders the entity's pieces.
   *
   * @param worldCellToClipSpaceScale The world cell to clip space cell scale value
   */
  render(worldCellToClipSpaceScale: vec2) {
    // if (this.name) console.log(this.name);

    for (const p of this.pieces) {
      p.render(this.getPosition(), this.getRotation(), this.zIndex, worldCellToClipSpaceScale);
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
   * Sets the entites z index.
   *
   * @throws When {@link validateZIndex} returns a string.
   *
   * @param zIndex The entites new zIndex
   */
  setZIndex(zIndex: number) {
    const valid = validateZIndex(zIndex);
    if (valid !== true) throw new Error(valid);

    this.zIndex = zIndex;
  }

  /**
   * Gets the entities z index.
   *
   * @returns The entities z index
   */
  getZIndex() {
    return this.zIndex;
  }
}
