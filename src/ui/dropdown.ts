import BlazeElement from "./element";
import BlazeText, { TextStyle } from "./text";

import "./styles/dropdown.css";

export default class BlazeDropdown extends BlazeElement<HTMLDivElement> {
  private size: number;

  private selected: string;
  private options: string[];

  private select: HTMLSelectElement;
  private label: BlazeText<HTMLParagraphElement>;

  /**
   * Callback that is called whenever the dropdown's selected option changes.
   */
  onSelect: (selected: string) => void;

  /**
   * Create a {@link BlazeDropdown}.
   *
   * @param selected The initially selected option
   * @param options The options in the dropdown
   * @param size The dropdown's font size in `rem` units
   */
  constructor(selected: string, options: string[], size: number) {
    const element = document.createElement("div");
    element.classList.add("blzDropdown");
    super(element);

    this.select = document.createElement("select");
    this.element.appendChild(this.select);

    this.setOptions(options);
    this.setSelected(selected);

    this.size = size;

    this.element.addEventListener("input", () => {
      this.selected = this.select.value;
      if (this.onSelect) this.onSelect(this.selected);
    });
  }

  /**
   * Sets the dropdown's selected option.
   *
   * @param selected The dropdown's new selected option
   */
  setSelected(selected: string) {
    this.selected = selected;
    this.select.value = selected;

    if (this.onSelect) this.onSelect(this.selected);
  }

  /**
   * Gets the dropdown's currently selected option.
   *
   * @returns The dropdown's currently selected option
   */
  getSelected() {
    return this.selected;
  }

  /**
   * Sets the options in the dropdown.
   *
   * @param options The dropdown's new options
   */
  setOptions(options: string[]) {
    this.options = options;

    const optionElements = options.map((opt) => {
      const element = document.createElement("option");
      element.value = opt;
      element.textContent = opt;
      return element;
    });

    this.select.replaceChildren(...optionElements);
  }

  /**
   * Gets the dropdown's options.
   *
   * @returns The dropdown's options
   */
  getOptions() {
    return this.options;
  }

  /**
   * Adds an option to the dropdown.
   *
   * @param option The option to add
   */
  addOption(option: string) {
    this.options.push(option);
    this.setOptions(this.options);
  }

  /**
   * Sets the dropdown's font size.
   *
   * @param size The dropdown's font size in `rem` units
   */
  setSize(size: number) {
    this.size = size;
    this.select.style.fontSize = `${size}rem`;
  }

  /**
   * Gets the dropdown's font size.
   *
   * @returns The dropdown's font size in `rem` units
   */
  getSize() {
    return this.size;
  }

  /**
   * Add a label above or to the side of the input.
   *
   * @param label The label's text
   * @param aside Wether the label is above or to the side of the input
   */
  addLabel(label: string, aside = false) {
    if (aside) {
      this.label = new BlazeText(label, this.size * 0.9, false, TextStyle.SECONDARY);
      this.element.style.flexDirection = "row";
      this.label.element.style.marginRight = `${this.size * 0.5}rem`;
      this.element.style.alignItems = "center";
    } else {
      this.label = new BlazeText(label, this.size * 0.8, false, TextStyle.SECONDARY);
      this.element.style.flexDirection = "column";
      this.element.style.alignItems = "";
      this.label.element.style.marginBottom = `${this.size * 0.3}rem`;
    }

    this.element.prepend(this.label.element);
  }

  /**
   * Remove the input's label.
   */
  removeLabel() {
    if (!this.label) return;

    this.label.element.remove();
  }
}
