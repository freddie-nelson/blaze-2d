import { vec2 } from "gl-matrix";
import Logger from "../../logger";
import BlazeElement from "../../ui/element";
import BlazeTitleBar from "../../ui/titleBar";
import { EDITOR_GRID_SIZE } from "../editor";

import "../styles/editor-pane.css";

export default class EditorPane extends BlazeElement<HTMLDivElement> {
  protected titlebar: BlazeTitleBar;

  readonly id: string;
  readonly domId: string;

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
  constructor(id: string, pos = vec2.create(), width = 1, height = 1) {
    // validation
    if (pos[0] < 0 || pos[0] >= EDITOR_GRID_SIZE || pos[1] < 0 || pos[1] >= EDITOR_GRID_SIZE)
      throw Logger.error("EditorPane", "Position must be between 0 and EDITOR_GRID_SIZE - 1.");
    if (width < 0 || width > EDITOR_GRID_SIZE)
      throw Logger.error("EditorPane", "Width must be between 0 and EDITOR_GRID_SIZE.");
    if (height < 0 || height > EDITOR_GRID_SIZE)
      throw Logger.error("EditorPane", "Height must be between 0 and EDITOR_GRID_SIZE.");

    const element = document.createElement("div");
    element.classList.add("blzEditorPane");
    element.style.cssText = `grid-area: ${id};`;
    super(element);

    this.id = id;
    this.domId = `blz${id}`;
    this.element.id = this.domId;

    this.pos = pos;
    this.width = width;
    this.height = height;

    this.addTitlebar();
  }

  /**
   * Perform pane updates.
   */
  update() {}

  /**
   * Create and append a {@link BlazeTitleBar} to the pane.
   */
  addTitlebar() {
    this.removeTitlebar();

    this.titlebar = new BlazeTitleBar(this.id);
    this.element.appendChild(this.titlebar.element);
  }

  /**
   * Remove the pane's titlebar if it exists.
   */
  removeTitlebar() {
    if (!this.titlebar) return;

    this.titlebar.element.remove();
  }
}
