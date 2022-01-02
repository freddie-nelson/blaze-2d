import Blaze from "@blz/blaze";
import Entity from "@blz/entity";
import RectCollider from "@blz/physics/collider/rect";
import Rect from "@blz/shapes/rect";
import Texture from "@blz/texture/texture";
import { vec2 } from "gl-matrix";

export function boxPyramid(
  tex: Texture,
  size: number,
  mass: number,
  base: number,
  diff: number,
  spacing: number,
  startX: number,
  startY: number,
) {
  const WORLD = Blaze.getScene().world;
  const PHYSICS = Blaze.getScene().physics;

  const boxes = [];

  for (let row = 0; row < base; row += diff) {
    for (let col = 0; col < base - row; col++) {
      const x = startX - col * size - (row * size) / 2 - (spacing * base) / 2 - spacing * (col + row / 2);
      const y = startY + (row / diff) * size;

      const rect = new Rect(size, size);
      rect.texture = tex;

      const box = new Entity(vec2.fromValues(x, y), new RectCollider(size, size), [rect], mass);
      box.staticFriction = 0.5;
      box.dynamicFriction = 0.5;

      WORLD.addEntity(box);
      PHYSICS.addBody(box);

      boxes.push(box);
    }
  }

  return boxes;
}

export function boxGrid(
  texs: Texture | Texture[],
  size: number,
  mass: number,
  rows: number,
  cols: number,
  spacing: number,
  startX: number,
  startY: number,
) {
  const WORLD = Blaze.getScene().world;
  const PHYSICS = Blaze.getScene().physics;

  const boxes = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 1; col < cols; col++) {
      const x = startX + col * size - (cols * size) / 2 - (spacing * cols) / 2 + spacing * col;
      const y = startY + size / 2 + row * size;

      const rect = new Rect(size, size);
      rect.texture = texs instanceof Array ? texs[Math.floor(Math.random() * texs.length)] : texs;

      const collider = new RectCollider(size, size);

      const box = new Entity(vec2.fromValues(x, y), collider, [rect], mass);

      WORLD.addEntity(box);
      PHYSICS.addBody(box);

      boxes.push(box);
    }
  }

  return boxes;
}
