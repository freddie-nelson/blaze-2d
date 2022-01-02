export default class CollisionFilter {
  category = 0x0001;
  mask = 0xffffffff;
  group = 0;

  constructor(category = 0x001, mask = 0xffffffff, group = 0) {
    this.category = category;
    this.mask = mask;
    this.group = group;
  }

  /**
   * Determines wether this collision should be rejected or not.
   *
   * @param filter The filter to check against
   * @returns Wether or not the collision can occur
   */
  reject(filter: CollisionFilter) {
    return (
      (this.group !== 0 && this.group === filter.group) ||
      (this.mask & filter.category) === 0 ||
      (filter.mask & this.category) === 0
    );
  }
}
