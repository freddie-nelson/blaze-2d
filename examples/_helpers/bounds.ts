import Blaze from "@blz/blaze";
import Entity from "@blz/entity";
import Rect from "@blz/shapes/rect";
import RectCollider from "@blz/physics/collider/rect";
import { vec2 } from "gl-matrix";
import Texture from "@blz/texture/texture";
import Viewport from "@blz/camera/viewport";

export default function createBounds(thickness: number, tex: Texture) {
  const CANVAS = Blaze.getCanvas();
  const WORLD = Blaze.getScene().world;
  const PHYSICS = Blaze.getScene().physics;
  const CAMERA = WORLD.getCamera();

  CAMERA.viewport = new Viewport(vec2.create(), CANVAS.element.clientWidth, CANVAS.element.clientHeight);

  const min = WORLD.getCellFromPixel(vec2.fromValues(0, CANVAS.element.clientHeight));
  const max = WORLD.getCellFromPixel(vec2.fromValues(CANVAS.element.clientWidth, 0));

  const BOUNDS = {
    min,
    max,
    width: max[0] * 2,
    height: max[1] * 2,
  };

  const boundsEntities = [
    new Entity(vec2.fromValues(0, BOUNDS.max[1]), new RectCollider(BOUNDS.width, thickness)),
    new Entity(vec2.fromValues(0, BOUNDS.min[1]), new RectCollider(BOUNDS.width, thickness)),
    new Entity(vec2.fromValues(BOUNDS.max[0], 0), new RectCollider(thickness, BOUNDS.height)),
    new Entity(vec2.fromValues(BOUNDS.min[0], 0), new RectCollider(thickness, BOUNDS.height)),
  ];

  boundsEntities.forEach((bounds) => {
    bounds.name = "bounds";
    bounds.isStatic = true;
    bounds.setMass(0);

    const collider = <RectCollider>bounds.collider;
    const rect = new Rect(collider.getWidth(), collider.getHeight());
    rect.texture = tex;
    bounds.addPiece(rect);
  });

  WORLD.addEntities(...boundsEntities);
  PHYSICS.addBodies(...boundsEntities);

  return BOUNDS;
}
