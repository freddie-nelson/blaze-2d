import Blaze from "@blz/blaze";
import Entity from "@blz/entity";
import CircleCollider from "@blz/physics/collider/circle";
import Circle from "@blz/shapes/circle";
import Texture from "@blz/texture/texture";
import GJK from "@blz/physics/gjk";
import { vec2 } from "gl-matrix";

export class SnakePiece extends Circle {
  direction = vec2.fromValues(0, 1);
  collider: CircleCollider;

  constructor(pos: vec2) {
    super(0.5, pos);

    this.collider = new CircleCollider(0.5, pos);
  }

  override setPosition(pos: vec2) {
    if (this.collider) this.collider.setPosition(pos);
    super.setPosition(pos);
  }
}

export default class Snake extends Entity {
  texture: Texture;
  isDead = false;
  speed = 7;
  turnSpeed = 3;
  segmentDetail = 5;

  constructor(texture: Texture) {
    super(vec2.create(), new CircleCollider(0));

    this.texture = texture;
    this.eat();
  }

  update(delta: number) {
    if (this.isDead) return;

    const head = this.getPieces()[0];
    const keys = Blaze.getCanvas().keys;
    if (keys.isPressed("ArrowRight")) {
      vec2.rotate(head.direction, head.direction, vec2.create(), (-this.turnSpeed * Math.PI) / 180);
    } else if (keys.isPressed("ArrowLeft")) {
      vec2.rotate(head.direction, head.direction, vec2.create(), (this.turnSpeed * Math.PI) / 180);
    }

    this.move(delta);
    this.collide();
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

  collide() {
    // check body collisions
    const pieces = this.getPieces();
    const head = pieces[0];

    for (let i = this.segmentDetail * 2; i < pieces.length; i++) {
      if (GJK(head.collider, pieces[i].collider).collision) {
        this.isDead = true;
        console.log("dead");
        break;
      }
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
