import { vec2 } from "gl-matrix";
import EditorPane from "./pane";

export default class ScenePane extends EditorPane {
  canvas: HTMLCanvasElement;

  /**
   * Creates a {@link ScenePane}.
   *
   * @param canvas The canvas used by blaze
   * @param pos The top left corner of the pane in the editor grid
   * @param width The width of the pane in columns
   * @param height The height of the pane in rows
   */
  constructor(canvas: HTMLCanvasElement, pos: vec2, width: number, height: number) {
    super("scene", pos, width, height);

    this.element.appendChild(canvas);
  }
}
