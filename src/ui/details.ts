import BlazeElement from "./element";
import BlazeHeading from "./heading";

import "./styles/details.css";

export default class BlazeDetails extends BlazeElement<HTMLDetailsElement> {
  summary: HTMLElement;
  summaryText: BlazeHeading;
  content: HTMLElement;

  /**
   * Create a {@link BlazeDetails}.
   *
   * @param summary The detail's summary text
   * @param content An {@link HTMLElement} to place inside the details tag
   * @param size The summary tag's font size in `rem` units, if none is given then size will be `auto`
   */
  constructor(summary: string, content: HTMLElement, size?: number) {
    const element = document.createElement("details");
    element.classList.add("blzDetails");
    super(element);

    this.summary = document.createElement("summary");
    this.summaryText = new BlazeHeading(summary, 1, size);
    this.summary.appendChild(this.summaryText.element);

    this.content = content;

    this.element.appendChild(this.summary);
    this.element.appendChild(this.content);
  }

  /**
   * Sets the summary tag's font size.
   *
   * @param size The summary tag's new font size in `rem` units
   */
  setSize(size: number) {
    this.summaryText.size = size;
    this.summaryText.applyStyles();
  }
}
