import { vec2 } from "gl-matrix";
import { EDITOR_GRID_SIZE } from "../editor";

import "../styles/editor-pane.css";

export default class EditorPane {
  element: HTMLDivElement;

  readonly id: string;

  pos: vec2;
  width: number;
  height: number;

  /**
   * Creates an {@link EditorPane}.
   *
   * @param id The pane's ID (must be a valid HTML id)
   * @param pos The top left corner of the pane in the editor grid
   * @param width The width of the pane in columns
   * @param height The height of the pane in rows
   */
  constructor(id: string, pos: vec2, width: number, height: number) {
    this.id = id;

    // validation
    if (pos[0] < 0 || pos[0] >= EDITOR_GRID_SIZE || pos[1] < 0 || pos[1] >= EDITOR_GRID_SIZE)
      throw new Error("EditorPane: Position must be between 0 and EDITOR_GRID_SIZE - 1.");
    if (width < 0 || width > EDITOR_GRID_SIZE)
      throw new Error("EditorPane: Width must be between 0 and EDITOR_GRID_SIZE.");
    if (height < 0 || height > EDITOR_GRID_SIZE)
      throw new Error("EditorPane: Height must be between 0 and EDITOR_GRID_SIZE.");

    this.pos = pos;
    this.width = width;
    this.height = height;

    this.element = document.createElement("div");
    this.element.classList.add("blaze-editor-pane");
    this.element.style.cssText = `grid-area: ${this.id};`;
    this.element.id = id;
  }

  /**
   * Perform pane updates.
   */
  update() {}
}
