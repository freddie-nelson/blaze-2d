import { vec2 } from "gl-matrix";
import EditorPane from "./pane";

export default class PhysicsPane extends EditorPane {
  /**
   * Creates a {@link PhysicsPane}.
   *
   * @param pos The top left corner of the pane in the editor grid
   * @param width The width of the pane in columns
   * @param height The height of the pane in rows
   */
  constructor(pos: vec2, width: number, height: number) {
    super("physics", pos, width, height);
  }
}
