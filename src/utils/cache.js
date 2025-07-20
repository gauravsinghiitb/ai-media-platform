// Intelligent caching utilities for frequently accessed data

// Cache entry structure
class CacheEntry {
  constructor(key, value, ttl = 300000) { // Default 5 minutes TTL
    this.key = key;
    this.value = value;
    this.createdAt = Date.now();
    this.lastAccessed = Date.now();
    this.accessCount = 0;
    this.ttl = ttl; // Time to live in milliseconds
  }

  // Check if entry is expired
  isExpired() {
    return Date.now() - this.createdAt > this.ttl;
  }

  // Update access statistics
  access() {
    this.lastAccessed = Date.now();
    this.accessCount++;
  }

  // Get age in milliseconds
  getAge() {
    return Date.now() - this.createdAt;
  }

  // Get time since last access
  getTimeSinceLastAccess() {
    return Date.now() - this.lastAccessed;
  }
}

// Main cache class
class Cache {
  constructor(maxSize = 100, cleanupInterval = 60000) { // Default 1 minute cleanup
    this.cache = new Map();
    this.maxSize = maxSize;
    this.cleanupInterval = cleanupInterval;
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0
    };

    // Start cleanup interval
    this.startCleanup();
  }

  // Set a value in cache
  set(key, value, ttl = 300000) {
    // Remove existing entry if it exists
    if (this.cache.has(key)) {
      this.delete(key);
    }

    // Check if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    const entry = new CacheEntry(key, value, ttl);
    this.cache.set(key, entry);
    this.stats.sets++;

    return entry;
  }

  // Get a value from cache
  get(key) {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (entry.isExpired()) {
      this.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update access statistics
    entry.access();
    this.stats.hits++;

    return entry.value;
  }

  // Check if key exists and is not expired
  has(key) {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (entry.isExpired()) {
      this.delete(key);
      return false;
    }
    
    return true;
  }

  // Delete a key from cache
  delete(key) {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
    }
    return deleted;
  }

  // Clear all cache entries
  clear() {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0
    };
  }

  // Get cache size
  size() {
    return this.cache.size;
  }

  // Get cache statistics
  getStats() {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;

    return {
      ...this.stats,
      hitRate: hitRate.toFixed(2) + '%',
      size: this.cache.size,
      maxSize: this.maxSize
    };
  }

  // Evict least recently used entry
  evictLRU() {
    let oldestKey = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
      this.stats.evictions++;
    }
  }

  // Clean up expired entries
  cleanup() {
    const now = Date.now();
    const expiredKeys = [];

    for (const [key, entry] of this.cache.entries()) {
      if (entry.isExpired()) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.delete(key));
  }

  // Start automatic cleanup
  startCleanup() {
    this.cleanupIntervalId = setInterval(() => {
      this.cleanup();
    }, this.cleanupInterval);
  }

  // Stop automatic cleanup
  stopCleanup() {
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
    }
  }

  // Get all keys
  keys() {
    return Array.from(this.cache.keys());
  }

  // Get all values
  values() {
    return Array.from(this.cache.values()).map(entry => entry.value);
  }

  // Get all entries
  entries() {
    return Array.from(this.cache.entries()).map(([key, entry]) => [key, entry.value]);
  }
}

// Specialized caches for different data types
class ImageCache extends Cache {
  constructor(maxSize = 50) {
    super(maxSize, 300000); // 5 minutes cleanup for images
  }

  // Preload image
  preloadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.set(url, img);
        resolve(img);
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  // Get image with fallback
  getImage(url, fallbackUrl = null) {
    const cached = this.get(url);
    if (cached) return cached;

    if (fallbackUrl) {
      return this.get(fallbackUrl);
    }

    return null;
  }
}

class UserDataCache extends Cache {
  constructor(maxSize = 200) {
    super(maxSize, 600000); // 10 minutes cleanup for user data
  }

  // Cache user profile
  cacheUserProfile(userId, profile) {
    this.set(`user_${userId}`, profile, 1800000); // 30 minutes TTL
  }

  // Get user profile
  getUserProfile(userId) {
    return this.get(`user_${userId}`);
  }

  // Cache user posts
  cacheUserPosts(userId, posts) {
    this.set(`posts_${userId}`, posts, 900000); // 15 minutes TTL
  }

  // Get user posts
  getUserPosts(userId) {
    return this.get(`posts_${userId}`);
  }
}

class ContentCache extends Cache {
  constructor(maxSize = 100) {
    super(maxSize, 300000); // 5 minutes cleanup for content
  }

  // Cache post data
  cachePost(postId, post) {
    this.set(`post_${postId}`, post, 1200000); // 20 minutes TTL
  }

  // Get post data
  getPost(postId) {
    return this.get(`post_${postId}`);
  }

  // Cache trending content
  cacheTrendingContent(content) {
    this.set('trending_content', content, 300000); // 5 minutes TTL
  }

  // Get trending content
  getTrendingContent() {
    return this.get('trending_content');
  }

  // Cache search results
  cacheSearchResults(query, results) {
    this.set(`search_${query}`, results, 600000); // 10 minutes TTL
  }

  // Get search results
  getSearchResults(query) {
    return this.get(`search_${query}`);
  }
}

// Cache manager for coordinating multiple caches
class CacheManager {
  constructor() {
    this.caches = {
      general: new Cache(100),
      images: new ImageCache(50),
      users: new UserDataCache(200),
      content: new ContentCache(100)
    };
  }

  // Get cache by type
  getCache(type) {
    return this.caches[type] || this.caches.general;
  }

  // Set value in specific cache
  set(type, key, value, ttl) {
    return this.getCache(type).set(key, value, ttl);
  }

  // Get value from specific cache
  get(type, key) {
    return this.getCache(type).get(key);
  }

  // Check if key exists in specific cache
  has(type, key) {
    return this.getCache(type).has(key);
  }

  // Delete key from specific cache
  delete(type, key) {
    return this.getCache(type).delete(key);
  }

  // Clear specific cache
  clear(type) {
    return this.getCache(type).clear();
  }

  // Clear all caches
  clearAll() {
    Object.values(this.caches).forEach(cache => cache.clear());
  }

  // Get statistics for all caches
  getStats() {
    const stats = {};
    for (const [type, cache] of Object.entries(this.caches)) {
      stats[type] = cache.getStats();
    }
    return stats;
  }

  // Stop all cleanup intervals
  stopAll() {
    Object.values(this.caches).forEach(cache => cache.stopCleanup());
  }
}

// Create global cache manager instance
export const cacheManager = new CacheManager();

// Convenience functions
export const cacheGet = (type, key) => cacheManager.get(type, key);
export const cacheSet = (type, key, value, ttl) => cacheManager.set(type, key, value, ttl);
export const cacheHas = (type, key) => cacheManager.has(type, key);
export const cacheDelete = (type, key) => cacheManager.delete(type, key);
export const cacheClear = (type) => cacheManager.clear(type);

// Cache decorator for functions
export const withCache = (cacheType, keyGenerator, ttl = 300000) => {
  return (fn) => {
    return async (...args) => {
      const key = typeof keyGenerator === 'function' ? keyGenerator(...args) : keyGenerator;
      
      // Check cache first
      const cached = cacheGet(cacheType, key);
      if (cached !== null) {
        return cached;
      }

      // Execute function and cache result
      try {
        const result = await fn(...args);
        cacheSet(cacheType, key, result, ttl);
        return result;
      } catch (error) {
        console.error('Cache function error:', error);
        throw error;
      }
    };
  };
};

// Cache middleware for React components
export const withCacheHOC = (cacheType, keyGenerator, ttl = 300000) => {
  return (WrappedComponent) => {
    return (props) => {
      const key = typeof keyGenerator === 'function' ? keyGenerator(props) : keyGenerator;
      const cachedData = cacheGet(cacheType, key);
      
      return <WrappedComponent {...props} cachedData={cachedData} />;
    };
  };
};

export default {
  Cache,
  ImageCache,
  UserDataCache,
  ContentCache,
  CacheManager,
  cacheManager,
  cacheGet,
  cacheSet,
  cacheHas,
  cacheDelete,
  cacheClear,
  withCache,
  withCacheHOC
}; 