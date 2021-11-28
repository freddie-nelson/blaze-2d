import { vec2 } from "gl-matrix";
import Collider from "./physics/collider/collider";
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

  /**
   * Creates a new {@link Entity} instance with a position, bounding box and body pieces.
   *
   * @param position The entity's position in world space
   * @param collider The entity's bounding box
   * @param pieces The entity's body pieces for rendering
   * @param mass The entity's mass in kg (0 for infinite mass)
   * @param name A name which can be used to identify the entity
   */
  constructor(position: vec2, collider: Collider, pieces: Shape[] = [], mass?: number, name = "") {
    super(collider, mass);
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
    this.fireEvent("update", delta || 0);
  }

  /**
   * Renders the entity's pieces.
   */
  render() {
    for (const p of this.pieces) {
      p.render(this.getPosition(), this.getRotation(), this.zIndex);
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
