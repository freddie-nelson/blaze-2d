import BlazeText from "./text";

import "./styles/heading.css";
import Logger from "../logger";

export default class BlazeHeading extends BlazeText<HTMLHeadingElement> {
  /**
   * Create a {@link BlazeHeading}.
   *
   * @param text The heading's text
   * @param level The heading level (1 - 6)
   * @param size The heading's font size in `rem` units, if none is given then size will be `auto`
   */
  constructor(text: string, level = 1, size?: number) {
    if (level < 1 || level > 6) throw Logger.error("BlazeHeading", "level must be between 1 and 6.");

    super(text, level, size === undefined ? 0 : size, true);

    this.element.classList.add("blzHeading");
    if (size === undefined) {
      this.size = undefined;
      this.applyStyles();
    }
  }
}
