import BlazeText, { TextStyle } from "./text";

import "./styles/stat.css";

export default class BlazeStat<T> extends BlazeText<HTMLParagraphElement> {
  readonly name: string;
  private value: T;
  readonly size: number;

  /**
   * Create a {@link BlazeStat}.
   *
   * @param name The stat's name
   * @param value The stat's default value
   * @param size The stat's font size in `rem` units, if none is given then size will be `auto`
   * @param bold Wether or not the stat's text is bold
   * @param style The style of the element's text
   */
  constructor(name: string, value?: T, size?: number, bold?: boolean, style?: TextStyle) {
    super("", size, bold, style);

    this.element.classList.add("blzStat");

    this.name = name;
    this.value = value;
    this.refresh();
  }

  /**
   * Update the stat's dom elements.
   */
  refresh() {
    const text = `${this.name}: ${this.valueToString()}`;
    this.setText(text);
  }

  private valueToString() {
    const type = typeof this.value;
    if (type === "number" || type === "string" || type === "boolean" || type === "bigint") {
      return String(this.value);
    } else if (this.value.toString) {
      return this.value.toString();
    }
  }

  /**
   * Sets the stat's value.
   *
   * @param value The stat's value
   */
  setValue(value: T) {
    this.value = value;
    this.refresh();
  }

  /**
   * Gets the stat's value.
   *
   * @returns The stat's value
   */
  getValue() {
    return this.value;
  }
}
