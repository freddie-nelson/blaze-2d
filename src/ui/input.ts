import BlazeElement from "./element";
import BlazeText, { TextStyle } from "./text";

import "./styles/input.css";

export default class BlazeInput extends BlazeElement<HTMLDivElement> {
  private name: string;
  private placeholder: string;
  private size: number;

  private value: string;

  private input: HTMLInputElement;
  private label: BlazeText<HTMLParagraphElement>;

  /**
   * Create a {@link BlazeInput}.
   *
   * @param name The input's `name` attribute
   * @param placeholder The input's placeholder
   * @param size The input's font size in `rem` units
   */
  constructor(name: string, placeholder: string, size: number) {
    const element = document.createElement("div");
    element.classList.add("blzInput");
    super(element);

    this.input = document.createElement("input");
    this.input.name = name;
    this.input.placeholder = placeholder;
    this.input.style.fontSize = `${size}rem`;
    this.element.appendChild(this.input);

    this.name = name;
    this.placeholder = placeholder;
    this.size = size;

    this.input.addEventListener("input", () => {
      this.value = this.input.value;
    });
  }

  /**
   * Sets the input's value.
   *
   * @param value The input's new value
   */
  setValue(value: string) {
    this.value = value;
    this.input.value = value;
  }

  /**
   * Gets the input's current value.
   *
   * @returns The input's current value
   */
  getValue() {
    return this.value;
  }

  /**
   * Sets the input's name.
   *
   * @param name The input's new `name` attribute
   */
  setName(name: string) {
    this.name = name;
    this.input.name = name;
  }

  /**
   * Gets the input's `name` attribute.
   *
   * @returns The input's `name` attribute
   */
  getName() {
    return this.name;
  }

  /**
   * Sets the input's placeholder.
   *
   * @param name The input's new `placeholder` attribute
   */
  setPlaceholder(placeholder: string) {
    this.placeholder = placeholder;
    this.input.placeholder = placeholder;
  }

  /**
   * Gets the input's `placeholder` attribute.
   *
   * @returns The input's `placeholder` attribute
   */
  getPlaceholder() {
    return this.placeholder;
  }

  /**
   * Sets the input's font size.
   *
   * @param size The input's font size in `rem` units
   */
  setSize(size: number) {
    this.size = size;
    this.input.style.fontSize = `${size}rem`;
  }

  /**
   * Gets the input's font size.
   *
   * @returns The input's font size in `rem` units
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
