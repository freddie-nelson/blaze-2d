import BlazeElement from "./element";

import "./styles/title-bar.css";

export default class BlazeTitleBar extends BlazeElement<HTMLDivElement> {
  text: HTMLParagraphElement;

  /**
   * Creates an {@link BlazeTitleBar} component.
   *
   * @param title The title
   */
  constructor(title: string) {
    const element = document.createElement("div");
    element.classList.add("blzTitleBar");
    super(element);

    this.text = document.createElement("p");
    this.text.textContent = title;
    this.element.appendChild(this.text);
  }
}
