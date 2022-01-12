import { vec2 } from "gl-matrix";
import Blaze from "../../blaze";
import { BLZTouch } from "../../input/touch";
import CollisionObject from "../collisionObject";
import PivotConstraint from "./pivot";

/**
 * Constrains an {@link CollisionObject}'s position to a {@link BLZTouch}'s world position in the current {@link Camera}'s view.
 */
export default class TouchConstraint extends PivotConstraint {
  touch: BLZTouch;

  /**
   * Creates an {@link TouchConstraint}.
   *
   * @param obj The object to constrain
   * @param touch The touch to constrain the object to
   */
  constructor(obj: CollisionObject, touch: BLZTouch) {
    super(obj, vec2.create());

    this.touch = touch;

    // compute point
    this.touchListener();

    // calculate anchor
    vec2.sub(this.anchorA, this.point, this.a.getPosition());
    this.rotA = this.a.getRotation();

    this.touch.addListener("move", this.touchListener);
  }

  /**
   * Removes the touch constraint's listeners from it's {@link BLZTouch}.
   */
  remove() {
    this.touch.removeListener("move", this.touchListener);
  }

  private touchListener = () => {
    const touch = this.getTouchPosition();
    this.point = touch;
  };

  /**
   * Gets the touch's world position in the current camera's view.
   */
  private getTouchPosition() {
    const pixel = this.touch.pos;
    const world = Blaze.getScene().world.getWorldFromPixel(pixel);

    return world;
  }
}
