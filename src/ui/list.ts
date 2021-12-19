import Blaze from "../blaze";
import BlazeElement from "./element";

import "./styles/list.css";

export default class BlazeList<T extends BlazeElement<HTMLElement>> extends BlazeElement<HTMLDivElement> {
  items: T[];
  autoScroll: boolean;

  /**
   * Create a {@link BlazeList}.
   *
   * @param autoScroll Wether or not new items should be scrolled into view
   */
  constructor(autoScroll = true) {
    const element = document.createElement("div");
    element.classList.add("blzList");
    super(element);

    this.items = [];
    this.autoScroll = autoScroll;
  }

  /**
   * Adds the given items to the list.
   *
   * @param items The items to add
   */
  addItems(...items: T[]) {
    this.items.push(...items);

    for (const item of items) {
      this.element.appendChild(item.element);
    }

    const lastItem = items[items.length - 1];
    if (this.autoScroll) {
      if (
        this.element.scrollHeight - this.element.scrollTop <=
        this.element.clientHeight + lastItem.element.clientHeight * 6
      )
        this.element.scrollTo(0, this.element.scrollHeight);
    }
  }
}
