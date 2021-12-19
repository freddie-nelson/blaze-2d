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

  /**
   * Removes the item at the given index from the list.
   *
   * @param index The index of the item to remove
   */
  removeItem(index: number): void;

  /**
   * Removes an item from the list.
   *
   * @param item The item to remove
   */
  removeItem(item: T): void;

  removeItem(item: number | T) {
    let index: number;
    if (typeof item === "number") {
      index = item;
    } else {
      index = this.items.findIndex((curr) => curr === item);
    }

    if (index < 0 || index >= this.items.length) return;

    this.items[index].element.remove();
    this.items.splice(index, 1);
  }

  /**
   * Removes all items from the list.
   */
  clearItems() {
    this.items.length = 0;
    this.element.replaceChildren();
  }
}
