import CollisionObject from "../collisionObject";
import CollisionPair from "../collisionPair";
import AABB from "./aabb";
import AABBNode from "./aabbNode";

/**
 * Represents a tree data structure which contains nodes that store {@link AABB}s.
 *
 * This tree is used to speed up the physics engine's broadphase.
 *
 * @see [Intro to AABB Trees](https://www.azurefromthetrenches.com/introductory-guide-to-aabb-tree-collision-detection/)
 * @see [Physics Broadphase - AABB Tree](http://allenchou.net/2014/02/game-physics-broadphase-dynamic-aabb-tree/)
 */
export default class AABBTree {
  root: AABBNode;
  margin = 0.1;

  pairs: CollisionPair[];

  constructor() {}

  /**
   * Updates the tree.
   */
  update() {
    if (!this.root) return;

    if (this.root.isLeaf()) {
      this.root.updateAABB(this.margin);
      return;
    }

    // update nodes and find invalid nodes
    const invalidNodes: AABBNode[] = [];
    const stack = [this.root];

    while (stack.length > 0) {
      const node = stack.pop();

      if (node.isLeaf()) {
        const fat = node.aabb;
        const tight = new AABB(fat.obj, 0);

        if (!fat.contains(tight)) invalidNodes.push(node);
      } else {
        stack.push(node.left, node.right);
      }
    }

    // re-insert invalid nodes
    for (const node of invalidNodes) {
      // remove node
      this.removeNode(node);

      // re-insert node
      node.updateAABB(this.margin);
      this.addNode(node, this.root);
    }
  }

  /**
   * Obtains all the pairs of {@link CollisionObject}s which could possibly be colliding.
   *
   * @returns An array containing the {@link CollisionPair}s
   */
  collectPairs(): CollisionPair[] {
    if (!this.root || this.root.isLeaf()) return [];

    this.pairs = [];
    this.clearChildrenCrossedFlag();
    this.collectPairsHelper(this.root.left, this.root.right);

    return this.pairs;
  }

  /**
   * Sets the `childrenCrossed` flag to false on all nodes in the tree.
   */
  private clearChildrenCrossedFlag() {
    if (!this.root) return;
    if (this.root.isLeaf()) this.root.childrenCrossed = false;

    const stack = [this.root];

    while (stack.length > 0) {
      const node = stack.pop();
      node.childrenCrossed = false;

      if (!node.isLeaf()) {
        stack.push(node.left, node.right);
      }
    }
  }

  private crossChildren(n: AABBNode) {
    if (n.childrenCrossed) return;

    this.collectPairsHelper(n.left, n.right);
    n.childrenCrossed = true;
  }

  /**
   * Collects {@link CollisionPair}s.
   *
   * @param a An {@link AABBNode} to check for pairs
   * @param b An {@link AABBNode} to check for pairs
   */
  private collectPairsHelper(a: AABBNode, b: AABBNode) {
    if (a.isLeaf()) {
      // 2 leaves so check for collision
      if (b.isLeaf()) {
        // found potential collision
        if (a.aabb.intersects(b.aabb)) this.pairs.push({ a: a.aabb.obj, b: b.aabb.obj });
      } else {
        // leaf / branch, 2 cross checks
        this.crossChildren(b);

        this.collectPairsHelper(a, b.left);
        this.collectPairsHelper(a, b.right);
      }
    } else {
      // branch / leaf, 2 cross checks
      if (b.isLeaf()) {
        this.crossChildren(a);

        this.collectPairsHelper(a.left, b);
        this.collectPairsHelper(a.right, b);
      } else {
        // 2 branches, 4 cross checks
        this.crossChildren(a);
        this.crossChildren(b);

        this.collectPairsHelper(a.left, b.left);
        this.collectPairsHelper(a.left, b.right);
        this.collectPairsHelper(a.right, b.left);
        this.collectPairsHelper(a.right, b.right);
      }
    }
  }

  /**
   * Inserts an aabb into the tree.
   *
   * @param aabb The {@link AABB} to insert
   */
  add(aabb: AABB) {
    if (!this.root) {
      this.root = new AABBNode(aabb);
      return;
    }

    const node = new AABBNode(aabb);
    this.addNode(node, this.root);
  }

  /**
   * Removes the leaf node containing the {@link AABB} bounding the given {@link CollisionObject}.
   *j
   * @param obj The {@link CollisionObject} to remove
   */
  remove(obj: CollisionObject): void {
    if (!this.root) return;

    const stack = [this.root];

    while (stack.length > 0) {
      const node = stack.pop();

      // remove node
      // TODO make this comparison a passed in function and use function overloading to allow removing of CollisionObject, AABB, Node
      if (node.aabb?.obj === obj) {
        if (!node.isLeaf()) return;

        this.removeNode(node);
      }

      if (!node.isLeaf()) stack.push(node.left, node.right);
    }
  }

  /**
   * Remove the given node and replace the parent with the node's sibling
   *
   * @param node The node to remove
   */
  private removeNode(node: AABBNode) {
    const parent = node.parent;
    if (!parent) {
      this.root = undefined;
      return;
    }

    const n = node.sibling();
    if (!parent.parent) this.root = n;
    else parent.parent.replaceChild(parent, n);
  }

  /**
   * Inserts a node into the tree.
   *
   * @param node The {@link AABBNode} to insert
   */
  private addNode(node: AABBNode, parent: AABBNode) {
    // parent is leaf so simply split
    if (parent.isLeaf()) {
      const pParent = parent.parent;
      const newParent = new AABBNode(parent, node, this.margin);

      if (pParent) pParent.replaceChild(parent, newParent);
      else if (parent === this.root) this.root = newParent;

      // console.log(this.root);
      return;
    }

    // console.log("not leaf");

    // parent is branch, compute area diffs between pre-insert and post-insert
    const left = parent.left.aabb;
    const right = parent.right.aabb;

    const leftNext = new AABB(left, node.aabb, this.margin);
    const rightNext = new AABB(right, node.aabb, this.margin);

    const areaDiffLeft = leftNext.area() - left.area();
    const areaDiffRight = rightNext.area() - right.area();

    // insert into child that gives less area increase
    if (areaDiffLeft < areaDiffRight) this.addNode(node, parent.left);
    else this.addNode(node, parent.right);

    // update parent AABB
    parent.updateAABB(this.margin);
  }
}