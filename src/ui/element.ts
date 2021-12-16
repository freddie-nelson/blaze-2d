import KeyboardHandler from "../input/keyboard";
import MouseHandler from "../input/mouse";

/**
 * Provides a streamlined api to interact with UI elements in blaze.
 */
export default class BlazeElement<T extends HTMLElement> {
  readonly element: T;
  readonly mouse: MouseHandler;
  readonly keys: KeyboardHandler;

  /**
   * Creates a {@link BlazeElement}.
   *
   * @param element An HTML element
   */
  constructor(element: T) {
    this.element = element;
    this.element.classList.add("blzElement");

    this.mouse = new MouseHandler(element);
    this.keys = new KeyboardHandler(element);
  }
}
