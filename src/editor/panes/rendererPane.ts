import { vec2 } from "gl-matrix";
import EditorPane from "./pane";

export default class RendererPane extends EditorPane {
  /**
   * Creates a {@link RendererPane}.
   *
   * @param pos The top left corner of the pane in the editor grid
   * @param width The width of the pane in columns
   * @param height The height of the pane in rows
   */
  constructor(pos: vec2, width: number, height: number) {
    super("renderer", pos, width, height);
  }
}
