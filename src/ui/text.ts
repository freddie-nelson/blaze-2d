import BlazeElement from "./element";

import "./styles/text.css";

export enum TextStyle {
  PRIMARY,
  SECONDARY,
  HIGHLIGHT,
}

export default class BlazeText<T extends HTMLParagraphElement | HTMLHeadingElement> extends BlazeElement<
  HTMLParagraphElement | HTMLHeadingElement
> {
  private text: string;
  size: number;
  bold: boolean;
  style: TextStyle;

  /**
   * Create a {@link BlazeText} with a {@link HTMLHeadingElement}.
   *
   * @param text The element's text
   * @param level The heading level (1 - 6)
   * @param size The text's size in `rem` units
   * @param bold Wether or not the text is bold
   * @param style The text's style (color)
   */
  constructor(text: string, level: number, size: number, bold?: boolean, style?: TextStyle);

  /**
   * Create a {@link BlazeText} with a {@link HTMLParagraphElement}.
   *
   * @param text The element's text
   * @param size The text's size in `rem` units
   * @param bold Wether or not the text is bold
   * @param style The text's style (color)
   */
  constructor(text: string, size: number, bold?: boolean, style?: TextStyle);

  constructor(text: string, level: number, size?: number | boolean, bold?: boolean | TextStyle, style?: TextStyle) {
    let element = document.createElement("p");
    if (typeof size === "number") {
      // when heading constructor
      if (level < 1 || level > 6) throw new Error("BlazeText: level must be between 1 and 6.");
      element = <HTMLHeadingElement>document.createElement(`h${level}`);
    }

    element.classList.add("blzText");
    element.textContent = text;
    super(element);

    if (typeof size === "number") {
      // when heading constructor
      this.size = <number>size;
      this.bold = <boolean>bold;
      this.style = style !== undefined ? <TextStyle>style : TextStyle.PRIMARY;
    } else {
      this.size = level;
      this.bold = <boolean>size;
      this.style = bold !== undefined ? <TextStyle>bold : TextStyle.PRIMARY;
    }

    this.applyStyles();
  }

  /**
   * Applies the `size`, `bold`, and `style` variables to the text's dom element.
   */
  applyStyles() {
    this.element.style.fontSize = "";
    this.element.style.fontWeight = "";
    this.element.classList.remove("blzText--primary", "blzText--secondary", "blzText--highlight");

    if (this.size) this.element.style.fontSize = `${this.size}rem`;
    if (this.bold) this.element.style.fontWeight = "bold";

    switch (this.style) {
      case TextStyle.PRIMARY:
        this.element.classList.add("blzText--primary");
        break;
      case TextStyle.SECONDARY:
        this.element.classList.add("blzText--secondary");
        break;
      case TextStyle.HIGHLIGHT:
        this.element.classList.add("blzText--highlight");
        break;
      default:
        break;
    }
  }

  /**
   * Sets the element's text.
   *
   * @param text The element's text
   */
  setText(text: string) {
    this.text = text;
    this.element.textContent = text;
  }

  /**
   * Gets the element's text.
   *
   * @returns The element's text
   */
  getText() {
    return this.text;
  }
}
