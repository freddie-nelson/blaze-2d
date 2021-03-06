import { vec2 } from "gl-matrix";
import Blaze from "../../blaze";
import Logger, { LogType } from "../../logger";
import BatchRenderer from "../../renderer/batchRenderer";
import Renderer from "../../renderer/renderer";
import BlazeDropdown from "../../ui/dropdown";
import BlazeHeading from "../../ui/heading";
import BlazeInput from "../../ui/input";
import BlazeList from "../../ui/list";
import BlazeStat from "../../ui/stat";
import BlazeText, { TextStyle } from "../../ui/text";
import EditorPane from "./pane";

export default class ConsolePane extends EditorPane {
  // elements
  private messages = new BlazeList();

  /**
   * Creates a {@link ConsolePane}.
   *
   * @param pos The top left corner of the pane in the editor grid
   * @param width The width of the pane in columns
   * @param height The height of the pane in rows
   */
  constructor(pos?: vec2, width?: number, height?: number) {
    super("console", pos, width, height);

    this.element.style.display = "flex";
    this.element.style.flexDirection = "column";

    this.messages.element.style.flexGrow = "1";
    this.element.appendChild(this.messages.element);

    Logger.addListener((type, str) => this.addMessage(type, str));
  }

  /**
   * Update console.
   */
  update() {}

  private addMessage(type: LogType, str: string) {
    let bold = false;
    let style = TextStyle.PRIMARY;

    switch (type) {
      case "log":
        bold = false;
        style = TextStyle.PRIMARY;
        break;
      case "error":
        bold = true;
        style = TextStyle.ERROR;
        break;
      case "warning":
        bold = false;
        style = TextStyle.WARNING;
        break;
      default:
        break;
    }

    const msg = new BlazeText(str, 0.8, bold, style);
    msg.element.style.marginBottom = "0.15rem";

    this.messages.addItems(msg);
  }
}
