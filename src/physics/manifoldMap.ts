import CollisionObject from "./collisionObject";
import Manifold from "./manifold";

export default class ManifoldMap {
  map: Map<CollisionObject, Map<CollisionObject, Manifold>> = new Map();

  constructor() {}

  getAllManifolds() {
    const maps = Array.from(this.map.values());
    const manifolds = [];

    for (const map of maps) {
      manifolds.push(...Array.from(map.values()));
    }

    return manifolds;
  }

  /**
   * Finds a manifold in the {@link ManifoldMap}.
   *
   * @param a The first collision object
   * @param b The second collision object
   * @returns The manifold for the collision between **a** and **b** or undefined.
   */
  getManifold(a: CollisionObject, b: CollisionObject): Manifold | undefined {
    let top = this.map.get(a);
    let usedA = true;
    if (!top) {
      top = this.map.get(b);
      if (!top) return undefined;

      usedA = false;
    }

    return usedA ? top.get(b) : top.get(a);
  }

  getManifoldKey(
    a: CollisionObject,
    b: CollisionObject
  ): { top: CollisionObject; key: CollisionObject } | undefined {
    let top = this.map.get(a);
    let usedA = true;
    if (!top) {
      top = this.map.get(b);
      if (!top) return undefined;

      usedA = false;
    }

    const k = { top: usedA ? a : b, key: usedA ? b : a };
    if (!top.has(k.key)) return undefined;

    return k;
  }

  addManifold(a: CollisionObject, b: CollisionObject, m: Manifold) {
    const old = this.getManifold(a, b);
    if (old) {
      if (old === m) return;

      old.update(m);
      if (old.isDead) {
        this.removeManifold(a, b);
        console.log("dead");
      } else return;
    }

    let map: Map<CollisionObject, Manifold>;
    let key = a;
    let key2 = b;

    if (this.map.has(a)) {
      map = this.map.get(a);
    } else if (this.map.has(b)) {
      map = this.map.get(b);
      key = b;
      key2 = a;
    } else {
      map = new Map();
    }

    map.set(key2, m);
    this.map.set(key, map);
  }

  removeManifold(a: CollisionObject, b: CollisionObject) {
    const key = this.getManifoldKey(a, b);
    if (!key) return;

    this.map.get(key.top).delete(key.key);
  }
}
