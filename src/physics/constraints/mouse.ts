import { vec2 } from "gl-matrix";
import Blaze from "../../blaze";
import { Mouse } from "../../input/mouse";
import CollisionObject from "../collisionObject";
import PivotConstraint from "./pivot";

/**
 * Constrains an {@link CollisionObject}'s position to the mouse's world position in the current {@link Camera}'s view.
 */
export default class MouseConstraint extends PivotConstraint {
  /**
   * Creates an {@link MouseConstraint}.
   *
   * @param obj The object to constrain
   */
  constructor(obj: CollisionObject) {
    super(obj, vec2.create());

    // compute point
    this.mouseListener();

    // calculate anchor
    vec2.sub(this.anchorA, this.point, this.a.getPosition());
    this.rotA = this.a.getRotation();

    Blaze.getCanvas().mouse.addListener(Mouse.MOVE, this.mouseListener);
  }

  /**
   * Removes the mouse constraint's listeners from the canvas.
   */
  remove() {
    Blaze.getCanvas().mouse.removeListener(Mouse.MOVE, this.mouseListener);
  }

  private mouseListener = () => {
    const mouse = this.getMousePosition();
    this.point = mouse;
  };

  /**
   * Gets the mouse's world position in the current camera's view.
   */
  private getMousePosition() {
    const pixel = Blaze.getCanvas().mouse.getMousePos();
    const world = Blaze.getScene().world.getCellFromPixel(pixel);

    return world;
  }
}
