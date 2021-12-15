import BlazeText from "./text";

import "./styles/heading.css";

export default class BlazeHeading extends BlazeText<HTMLHeadingElement> {
  private autoSize: boolean;

  /**
   * Create a {@link BlazeHeading}.
   *
   * @param text The heading's text
   * @param level The heading level (1 - 6)
   * @param size The heading's font size in `rem` units, if none is given then size will be `auto`
   */
  constructor(text: string, level = 1, size?: number) {
    if (level < 1 || level > 6) throw new Error("BlazeHeading: level must be between 1 and 6.");

    super(text, level, size || 1, true);

    this.element.classList.add("blzHeading");
    this.size = undefined;
    this.applyStyles();
  }
}
