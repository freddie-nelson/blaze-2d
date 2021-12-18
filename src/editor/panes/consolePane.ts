import { vec2 } from "gl-matrix";
import Blaze from "../../blaze";
import BatchRenderer from "../../renderer/batchRenderer";
import Renderer from "../../renderer/renderer";
import BlazeDropdown from "../../ui/dropdown";
import BlazeHeading from "../../ui/heading";
import BlazeInput from "../../ui/input";
import BlazeStat from "../../ui/stat";
import { TextStyle } from "../../ui/text";
import EditorPane from "./pane";

export default class ConsolePane extends EditorPane {
  /**
   * Creates a {@link ConsolePane}.
   *
   * @param pos The top left corner of the pane in the editor grid
   * @param width The width of the pane in columns
   * @param height The height of the pane in rows
   */
  constructor(pos?: vec2, width?: number, height?: number) {
    super("console", pos, width, height);
  }

  /**
   * Update console.
   */
  update() {}
}
