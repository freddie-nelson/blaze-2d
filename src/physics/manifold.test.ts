import { vec2 } from "gl-matrix";
import BoxCollider from "./collider/box";
import CollisionObject from "./collisionObject";
import EPA from "./epa";
import GJK from "./gjk";
import Manifold from "./manifold";

export default function testManifold() {
  // first example
  {
    const a = new CollisionObject(new BoxCollider(6, 5, vec2.fromValues(11, 6.5)));
    const b = new CollisionObject(new BoxCollider(8, 3, vec2.fromValues(8, 3.5)));

    const gjk = GJK(a.collider, b.collider);
    const epa = EPA(gjk.simplex, a.collider, b.collider);

    console.log(epa);

    const m = new Manifold(a, b, { hasCollision: true, ...epa }, vec2.fromValues(0, -9.8), 1);
    console.log("inc", m.edges[0]);
    console.log("ref", m.edges[1]);
    console.log(m.contactPoints);

    if (
      vec2.equals(m.contactPoints[0].point, vec2.fromValues(12, 5)) &&
      vec2.equals(m.contactPoints[1].point, vec2.fromValues(8, 5)) &&
      m.contactPoints.length === 2
    ) {
      console.log("first case passed.");
    }
  }

  // second example
  {
    const aCollider = new BoxCollider(6, 5, vec2.fromValues(5.5, 7.5));
    aCollider.rotate((30 * Math.PI) / 180);
    const a = new CollisionObject(aCollider);
    const b = new CollisionObject(new BoxCollider(8, 3, vec2.fromValues(8, 3.5)));

    const gjk = GJK(a.collider, b.collider);
    const epa = EPA(gjk.simplex, a.collider, b.collider);

    console.log(epa);

    const m = new Manifold(a, b, { hasCollision: true, ...epa }, vec2.fromValues(0, -9.8), 1);
    console.log("inc", m.edges[0]);
    console.log("ref", m.edges[1]);
    console.log(m.contactPoints);

    if (vec2.equals(m.contactPoints[0].point, vec2.fromValues(4, 5)) && m.contactPoints.length === 1) {
      console.log("second case passed.");
    }
  }
}
