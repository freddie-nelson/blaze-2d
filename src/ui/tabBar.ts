import BlazeTitlebar from "./titleBar";

import "./styles/tab-bar.css";
import BlazeElement from "./element";
import { Mouse } from "../input/mouse";

export default class BlazeTabBar extends BlazeTitlebar {
  tabs: string[];
  tabElements: BlazeElement<HTMLParagraphElement>[] = [];

  private activeTab: string;

  /**
   * Function that is called when `activeTab` changes.
   */
  activeCb: (tab: string) => void;

  /**
   * Creates an {@link BlazeTabBar} component.
   *
   * @param tabs The tab titles
   */
  constructor(...tabs: string[]) {
    super(tabs[0]);
    this.text.remove();
    this.element.classList.add("blzTabBar");

    this.tabs = tabs;
    this.createTabElements();
    this.markActive(tabs[0]);
  }

  /**
   * Creates and adds the tab elements to the bar.
   */
  createTabElements() {
    this.tabs.forEach((tab) => {
      const element = document.createElement("p");
      element.textContent = tab;
      this.element.appendChild(element);

      const blzElement = new BlazeElement(element);
      blzElement.mouse.addListener(Mouse.LEFT, (pressed) => {
        if (pressed) {
          this.markActive(tab);
        }
      });

      this.tabElements.push(blzElement);
    });
  }

  /**
   * Adds the `active` class to the element for the given tab id.
   *
   * @param tab The id of the tab to mark
   * @param fireCallback wether or not to call `activeCb`
   */
  markActive(tab: string, fireCallback = true) {
    this.tabElements.forEach((blzElement) => {
      blzElement.element.classList.remove("active");
    });

    this.tabs.forEach((t, i) => {
      if (t !== tab) return;

      const blzElement = this.tabElements[i];
      if (blzElement) {
        blzElement.element.classList.add("active");
      }

      this.activeTab = tab;
    });

    if (this.activeCb && fireCallback) this.activeCb(tab);
  }
}
