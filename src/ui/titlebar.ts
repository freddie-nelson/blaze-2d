import BlazeElement from "./element";

import "./styles/titlebar.css";

export default class BlazeTitlebar extends BlazeElement<HTMLDivElement> {
  /**
   * Creates an {@link BlazeTitlebar} component.
   *
   * @param title The title
   */
  constructor(title: string) {
    const element = document.createElement("div");
    element.textContent = title;
    element.classList.add("blzTitlebar");

    super(element);
  }
}
