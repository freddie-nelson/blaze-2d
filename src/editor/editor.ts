import { vec2 } from "gl-matrix";
import { System } from "../system";
import EditorPane from "./panes/pane";
import PhysicsPane from "./panes/physicsPane";
import RendererPane from "./panes/rendererPane";
import ScenePane from "./panes/scenePane";

import "./styles/editor.css";

/**
 * The number of rows and columns in the editor ui grid.
 */
export const EDITOR_GRID_SIZE = 24;

/**
 * Represents the editor.
 *
 * This class also manages the updating of all editor panes.
 *
 * The whole UI is split into 24 rows and 24 columns that fill the window.
 * The column/row indexes go from 0 to 23.
 */
export default class Editor implements System {
  // dom elements
  canvas: HTMLCanvasElement;
  editor: HTMLDivElement;

  panes: EditorPane[] = [];

  /**
   * Creates the editor UI.
   *
   * @param canvas The canvas used by {@link Blaze}, if none is provided then the editor will attempt to locate one.
   */
  constructor(canvas?: HTMLCanvasElement) {
    if (!canvas) this.canvas = document.querySelector("canvas#blzCanvas") || document.querySelector("canvas");
    else this.canvas = canvas;

    this.createUI();
  }

  /**
   * Update the editor.
   */
  update() {
    this.panes.forEach((p) => p.update());
  }

  /**
   * Create and inject the editor's UI.
   */
  createUI() {
    // remove old ui
    this.removeUI();

    // add default panes
    this.defaultLayout();

    // editor ui container
    // contains all elements in the ui
    this.editor = document.createElement("div");
    this.editor.id = "blzEditor";

    // add panes
    this.panes.forEach((p) => {
      this.editor.appendChild(p.element);
    });
    this.refreshPanes();

    // add editor to dom
    document.body.prepend(this.editor);
  }

  /**
   * Remove the editor's UI from the dom.
   */
  removeUI() {
    this.canvas?.remove();
    this.editor?.remove();
  }

  /**
   * Setup the default layout.
   */
  defaultLayout() {
    this.panes.length = 0;

    const scenePane = new ScenePane(this.canvas, vec2.fromValues(5, 0), 14, 19);
    this.panes.push(scenePane);

    const rendererPane = new RendererPane(vec2.fromValues(19, 0), 5, 12);
    this.panes.push(rendererPane);

    const physicsPane = new PhysicsPane(vec2.fromValues(19, 12), 5, 12);
    this.panes.push(physicsPane);
  }

  /**
   * Refresh the layout of the editor's panes.
   */
  refreshPanes() {
    const layout = this.getGridLayout();
    const style = this.gridLayoutToCSS(layout);

    this.editor.style.cssText = style;
  }

  /**
   * Returns the `grid-template-areas` style representing the given grid layout.
   *
   * @param layout `grid-template-areas` style tag
   */
  private gridLayoutToCSS(layout: { [index: number]: string[] }) {
    let style = "grid-template-areas:";

    for (let i = 0; i < EDITOR_GRID_SIZE; i++) {
      const row = layout[i];
      style += `"${row.join(" ")}" `;
    }

    style += ";";

    return style;
  }

  /**
   * Get the grid layout for the current panes in the editor.
   *
   * @returns The grid layout
   */
  private getGridLayout() {
    const layout = this.emptyGridLayout();

    for (const p of this.panes) {
      const startRow = p.pos[1];
      const endRow = startRow + p.height;
      const startCol = p.pos[0];

      for (let row = startRow; row < endRow; row++) {
        layout[row].splice(startCol, p.width, ...Array(p.width).fill(p.id));
      }
    }

    return layout;
  }

  /**
   * Creates an object with arrays for each row in the UI with lengths of `EDITOR_GRID_SIZE` and filled with `"."`.
   *
   * @returns The empty grid layout
   */
  private emptyGridLayout() {
    const layout: { [index: number]: string[] } = {};

    for (let i = 0; i < EDITOR_GRID_SIZE; i++) {
      layout[i] = Array(EDITOR_GRID_SIZE).fill(".");
    }

    return layout;
  }
}
