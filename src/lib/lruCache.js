// lib/lruCache.js
export class LRUCache {
  constructor(maxSize = 500) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  get(key) {
    const item = this.cache.get(key);
    if (item) {
      // Refresh it by deleting and re-setting to mark as "recently used"
      this.cache.delete(key);
      this.cache.set(key, item);
    }
    return item;
  }

  set(key, value) {
    // If the key is already present, delete it to re-insert it at the end
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    // If the cache is full, remove the oldest item (the first one)
    else if (this.cache.size === this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    this.cache.set(key, value);
  }
}