import Blaze from "@blz/blaze";
import Entity from "@blz/entity";
import RectCollider from "@blz/physics/collider/rect";
import Circle from "@blz/shapes/circle";
import Texture from "@blz/texture/texture";
import { vec2 } from "gl-matrix";
import { vec2SloppyEquals } from "@blz/utils/vectors";

export class SnakePiece extends Circle {
  direction = vec2.fromValues(0, 1);

  constructor(pos: vec2) {
    super(0.5, pos);
  }
}

export default class Snake extends Entity {
  texture: Texture;
  speed = 7;
  turnSpeed = 3;
  segmentDetail = 5;

  constructor(texture: Texture) {
    super(vec2.create(), new RectCollider(0, 0));

    this.texture = texture;
    this.eat();
  }

  update(delta: number) {
    const head = this.getPieces()[0];
    const keys = Blaze.getCanvas().keys;
    if (keys.isPressed("ArrowRight")) {
      vec2.rotate(head.direction, head.direction, vec2.create(), (-this.turnSpeed * Math.PI) / 180);
    } else if (keys.isPressed("ArrowLeft")) {
      vec2.rotate(head.direction, head.direction, vec2.create(), (this.turnSpeed * Math.PI) / 180);
    }

    this.move(delta);
  }

  move(delta: number) {
    const pieces = this.getPieces();
    const step = this.speed * this.segmentDetail * delta;

    for (let i = pieces.length - 1; i >= 0; i--) {
      const piece = pieces[i];
      if (!piece.direction) continue;

      if (i !== 0) {
        vec2.sub(piece.direction, pieces[i - 1].getPosition(), piece.getPosition());
      }

      piece.translate(vec2.scale(vec2.create(), piece.direction, step));
    }
  }

  eat() {
    const pieces = this.getPieces();

    let tail = pieces[pieces.length - 1];
    if (!tail) {
      tail = new SnakePiece(vec2.create());
      vec2.scale(tail.direction, tail.direction, 1 / this.segmentDetail);
    }

    for (let i = 1; i <= this.segmentDetail; i++) {
      const newTail = new SnakePiece(tail.getPosition());
      newTail.texture = this.texture;
      this.addPiece(newTail);

      newTail.translate(vec2.scale(vec2.create(), tail.direction, -i));

      const next = pieces[pieces.length - 2] || tail;
      vec2.sub(newTail.direction, next.getPosition(), newTail.getPosition());
    }
  }

  override getPieces() {
    return <SnakePiece[]>super.getPieces();
  }
}
