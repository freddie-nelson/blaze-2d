import Blaze from "@blz/blaze";
import Entity from "@blz/entity";
import { Mouse } from "@blz/input/mouse";
import MouseConstraint from "@blz/physics/constraints/mouse";

let picked: Entity;
let mouseConstraint: MouseConstraint;

export function mousePicker(cb: (picked: Entity, pick: boolean) => void, ...nameFilter: string[]) {
  const WORLD = Blaze.getScene().world;
  const PHYSICS = Blaze.getScene().physics;
  const CANVAS = Blaze.getCanvas();

  CANVAS.mouse.addListener(Mouse.LEFT, (pressed, pixelPos) => {
    if (pressed && !mouseConstraint) {
      const point = WORLD.getWorldFromPixel(pixelPos);

      picked = <Entity>PHYSICS.pick(point)[0];
      if (!picked || nameFilter.includes(picked.name)) return;

      mouseConstraint = new MouseConstraint(picked);
      PHYSICS.addConstraint(mouseConstraint);

      cb(picked, true);
    } else if (mouseConstraint) {
      mouseConstraint.remove();
      PHYSICS.removeConstraint(mouseConstraint);
      mouseConstraint = undefined;

      cb(picked, false);
      picked = undefined;
    }
  });
}
