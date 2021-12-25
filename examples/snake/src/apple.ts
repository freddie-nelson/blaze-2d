import Entity from "@blz/entity";
import CircleCollider from "@blz/physics/collider/circle";
import Circle from "@blz/shapes/circle";
import Texture from "@blz/texture/texture";
import { vec2 } from "gl-matrix";

export default class Apple extends Entity {
  constructor(appleTex: Texture, leafTex: Texture) {
    const apple = new Circle(0.5);
    apple.texture = appleTex;

    const leaf = new Circle(0.15, vec2.fromValues(0.12, 0.48));
    leaf.texture = leafTex;

    super(vec2.create(), new CircleCollider(0.5), [apple, leaf], 0, "apple");
  }
}
