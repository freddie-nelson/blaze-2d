import Logger from "../logger";
import CollisionObject from "./collisionObject";
import Manifold from "./manifold";

/**
 * Represents a 2 layered {@link Map} containing {@link Manifold}s for {@link CollisionObject} pairs.
 */
export default class ManifoldMap {
  map: Map<CollisionObject, Map<CollisionObject, Manifold>> = new Map();

  constructor() {}

  /**
   * Gets all the manifolds in the map and returns them as a contiguous array.
   *
   * @returns All the manifolds in the map as an array
   */
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

  /**
   * Finds the correct key in the map for objects `a` and `b`.
   *
   * @param a An object in the key
   * @param b An object in the key
   * @returns The manifold key or undefined
   */
  getManifoldKey(a: CollisionObject, b: CollisionObject): { top: CollisionObject; key: CollisionObject } | undefined {
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

  /**
   * Adds a manifold to the map with the top level key being `a` and inner key being `b`.
   *
   * If a manifold is already in the map with key [b, a] then that manifold will be updated instead.
   *
   * @param a The first object for the key
   * @param b The second object for the key
   * @param m The manifold to insert
   */
  addManifold(a: CollisionObject, b: CollisionObject, m: Manifold) {
    const old = this.getManifold(a, b);
    if (old) {
      if (old === m) return;

      old.update(m);
      if (old.isDead) {
        // Logger.log("manifoldMap", "dead map");
        this.removeManifold(a, b);
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

  /**
   * Removes the manifold involving objects `a` and `b`.
   *
   * @param a An object in the manifold
   * @param b Another object in the manifold
   * @returns Wether or not a manifold was removed
   */
  removeManifold(a: CollisionObject, b: CollisionObject) {
    const key = this.getManifoldKey(a, b);
    if (!key) {
      // console.log(a, b);
      return false;
    }

    return this.map.get(key.top).delete(key.key);
  }

  /**
   * Removes all manifolds involving the given object.
   *
   * @param obj The obj to remove manifolds of
   */
  removeManifoldsInvolving(obj: CollisionObject) {
    this.map.delete(obj);
    this.map.forEach((m) => {
      m.delete(obj);
    });
  }

  /**
   * Removes all manifolds in the map which have `isDead` set to true.
   */
  removeDeadManifolds() {
    const keys = this.map.keys();

    for (const top of keys) {
      const innerKeys = this.map.get(top).keys();

      for (const inner of innerKeys) {
        if (this.map.get(top).get(inner).isDead) this.map.get(top).delete(inner);
      }
    }
  }

  /**
   * Sets `isDead` to true for every manifold in the map.
   */
  killAllManifolds() {
    const maps = this.map.values();

    for (const map of maps) {
      const inners = map.values();
      for (const inner of inners) {
        inner.kill();
      }
    }
  }
}
