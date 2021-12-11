import AABB from "./aabb";

export default class AABBNode {
  /**
   * An {@link AABB} containing the node's children, if the node has no children then this {@link AABB} contains the {@link CollisionObject}.
   */
  aabb: AABB;

  parent: AABBNode;

  // children
  left: AABBNode;
  right: AABBNode;

  childrenCrossed = false;

  /**
   * Create a {@link AABBNode} from a {@link AABB}.
   *
   * @param aabb The node's AABB
   */
  constructor(aabb: AABB);

  /**
   * Create a {@link AABBNode} from left and right child nodes.
   *
   * @param left The node's left child
   * @param right The node's right child
   * @param margin The margin to use when creating the fat AABB
   */
  constructor(left: AABBNode, right: AABBNode, margin: number);

  constructor(left: AABB | AABBNode, right?: AABBNode, margin?: number) {
    if (left instanceof AABB) {
      this.aabb = left;
    } else {
      left.parent = this;
      right.parent = this;

      this.left = left;
      this.right = right;
      this.updateAABB(margin);
    }
  }

  /**
   * Determines wether or not this node is a leaf node.
   *
   * @returns Wether or not this node is a leaf node
   */
  isLeaf(): boolean {
    return !this.left;
  }

  /**
   * Updates the node's {@link AABB}.
   *
   * If the node is a leaf node the {@link AABB} is created from the current `aabb`'s `obj`.
   *
   * Otherwise the {@link AABB} is the union of the node's children's AABBs.
   *
   * @param margin The margin to use when creating the fat AABB
   */
  updateAABB(margin: number) {
    if (this.isLeaf()) {
      this.aabb.setMinMaxFromCollisionObj(this.aabb.obj, margin);
    } else {
      if (this.aabb) this.aabb.union(this.left.aabb, this.right.aabb, margin);
      else this.aabb = new AABB(this.left.aabb, this.right.aabb, margin);
    }
  }

  /**
   * Replaces one of the node's children with a new node.
   *
   * @param oldChild The old child to replace
   * @param newChild The new child
   */
  replaceChild(oldChild: AABBNode, newChild: AABBNode) {
    if (this.left === oldChild) {
      newChild.parent = this;
      this.left = newChild;
    } else if (this.right === oldChild) {
      newChild.parent = this;
      this.right = newChild;
    }
  }

  /**
   * Gets this node's sibling.
   *
   * @returns this node's sibling
   */
  sibling(): AABBNode | undefined {
    if (!this.parent) return undefined;

    return this === this.parent.left ? this.parent.right : this.parent.left;
  }
}
