/**
 * Simple in-memory cache handler for Next.js builds
 */
module.exports = class MemoryCacheHandler {
  constructor(options) {
    this.cache = new Map();
    this.options = options || {};
  }

  async get(key) {
    if (this.cache.has(key)) {
      const { value, expires } = this.cache.get(key);
      
      // Check if entry has expired
      if (expires && expires < Date.now()) {
        this.cache.delete(key);
        return null;
      }
      
      return value;
    }
    
    return null;
  }

  async set(key, value, options = {}) {
    const { ttl } = options;
    
    const expires = ttl ? Date.now() + ttl * 1000 : null;
    this.cache.set(key, { value, expires });
    
    return true;
  }
}; 