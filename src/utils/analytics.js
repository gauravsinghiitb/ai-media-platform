// Analytics utilities for tracking user engagement and content performance

// Event types
export const ANALYTICS_EVENTS = {
  // User interactions
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  USER_SIGNUP: 'user_signup',
  USER_PROFILE_VIEW: 'user_profile_view',
  
  // Content interactions
  POST_VIEW: 'post_view',
  POST_LIKE: 'post_like',
  POST_UNLIKE: 'post_unlike',
  POST_COMMENT: 'post_comment',
  POST_SHARE: 'post_share',
  POST_SAVE: 'post_save',
  POST_UNSAVE: 'post_unsave',
  
  // Video interactions
  VIDEO_PLAY: 'video_play',
  VIDEO_PAUSE: 'video_pause',
  VIDEO_COMPLETE: 'video_complete',
  VIDEO_SEEK: 'video_seek',
  
  // Contribution interactions
  CONTRIBUTION_CREATE: 'contribution_create',
  CONTRIBUTION_VIEW: 'contribution_view',
  CONTRIBUTION_LIKE: 'contribution_like',
  CONTRIBUTION_COMMENT: 'contribution_comment',
  
  // Search and discovery
  SEARCH_PERFORMED: 'search_performed',
  FILTER_APPLIED: 'filter_applied',
  CATEGORY_SELECTED: 'category_selected',
  TAG_SELECTED: 'tag_selected',
  
  // Navigation
  PAGE_VIEW: 'page_view',
  NAVIGATION_CLICK: 'navigation_click',
  
  // Performance
  CONTENT_LOAD_TIME: 'content_load_time',
  ERROR_OCCURRED: 'error_occurred'
};

// Analytics class
class Analytics {
  constructor() {
    this.events = [];
    this.sessionId = this.generateSessionId();
    this.userId = null;
    this.isEnabled = true;
  }

  // Generate unique session ID
  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Set user ID for tracking
  setUserId(userId) {
    this.userId = userId;
  }

  // Enable/disable analytics
  setEnabled(enabled) {
    this.isEnabled = enabled;
  }

  // Track an event
  track(eventName, properties = {}) {
    if (!this.isEnabled) return;

    const event = {
      eventName,
      properties,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: this.userId,
      userAgent: navigator.userAgent,
      url: window.location.href,
      referrer: document.referrer
    };

    this.events.push(event);
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Analytics Event:', event);
    }

    // Send to analytics service (implement as needed)
    this.sendToAnalyticsService(event);
  }

  // Send event to analytics service
  async sendToAnalyticsService(event) {
    try {
      // Store in localStorage for persistence
      const storedEvents = JSON.parse(localStorage.getItem('analytics_events') || '[]');
      storedEvents.push(event);
      
      // Keep only last 100 events
      if (storedEvents.length > 100) {
        storedEvents.splice(0, storedEvents.length - 100);
      }
      
      localStorage.setItem('analytics_events', JSON.stringify(storedEvents));

      // Here you would typically send to your analytics service
      // await fetch('/api/analytics', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(event)
      // });
    } catch (error) {
      console.error('Failed to send analytics event:', error);
    }
  }

  // Get analytics data
  getAnalyticsData() {
    return {
      events: this.events,
      sessionId: this.sessionId,
      userId: this.userId
    };
  }

  // Get stored events from localStorage
  getStoredEvents() {
    try {
      return JSON.parse(localStorage.getItem('analytics_events') || '[]');
    } catch (error) {
      console.error('Failed to parse stored events:', error);
      return [];
    }
  }

  // Clear stored events
  clearStoredEvents() {
    localStorage.removeItem('analytics_events');
  }
}

// Content performance tracking
export class ContentPerformanceTracker {
  constructor() {
    this.metrics = new Map();
  }

  // Track content load time
  trackLoadTime(contentId, loadTime) {
    this.metrics.set(`load_${contentId}`, {
      type: 'load_time',
      contentId,
      loadTime,
      timestamp: Date.now()
    });
  }

  // Track content engagement
  trackEngagement(contentId, engagementType, value = 1) {
    const key = `engagement_${contentId}_${engagementType}`;
    const existing = this.metrics.get(key) || { count: 0, totalValue: 0 };
    
    this.metrics.set(key, {
      type: 'engagement',
      contentId,
      engagementType,
      count: existing.count + 1,
      totalValue: existing.totalValue + value,
      timestamp: Date.now()
    });
  }

  // Get content performance metrics
  getContentMetrics(contentId) {
    const metrics = [];
    for (const [key, value] of this.metrics.entries()) {
      if (key.includes(contentId)) {
        metrics.push(value);
      }
    }
    return metrics;
  }

  // Calculate engagement score
  calculateEngagementScore(contentId) {
    const metrics = this.getContentMetrics(contentId);
    let score = 0;

    metrics.forEach(metric => {
      if (metric.type === 'engagement') {
        switch (metric.engagementType) {
          case 'view':
            score += metric.count * 1;
            break;
          case 'like':
            score += metric.count * 2;
            break;
          case 'comment':
            score += metric.count * 3;
            break;
          case 'share':
            score += metric.count * 4;
            break;
          case 'save':
            score += metric.count * 2;
            break;
          default:
            score += metric.count;
        }
      }
    });

    return score;
  }
}

// User behavior tracking
export class UserBehaviorTracker {
  constructor() {
    this.behaviors = new Map();
    this.sessionStartTime = Date.now();
  }

  // Track user behavior
  trackBehavior(behaviorType, properties = {}) {
    const behavior = {
      type: behaviorType,
      properties,
      timestamp: Date.now(),
      sessionDuration: Date.now() - this.sessionStartTime
    };

    if (!this.behaviors.has(behaviorType)) {
      this.behaviors.set(behaviorType, []);
    }
    
    this.behaviors.get(behaviorType).push(behavior);
  }

  // Get behavior patterns
  getBehaviorPatterns() {
    const patterns = {};
    
    for (const [type, behaviors] of this.behaviors.entries()) {
      patterns[type] = {
        count: behaviors.length,
        frequency: behaviors.length / (Date.now() - this.sessionStartTime) * 1000, // per second
        lastOccurrence: behaviors[behaviors.length - 1]?.timestamp,
        averageSessionDuration: behaviors.reduce((sum, b) => sum + b.sessionDuration, 0) / behaviors.length
      };
    }
    
    return patterns;
  }

  // Get user preferences based on behavior
  getUserPreferences() {
    const patterns = this.getBehaviorPatterns();
    const preferences = {
      favoriteCategories: [],
      activeHours: [],
      engagementLevel: 'low'
    };

    // Analyze patterns to determine preferences
    if (patterns[ANALYTICS_EVENTS.POST_LIKE]?.count > 10) {
      preferences.engagementLevel = 'high';
    } else if (patterns[ANALYTICS_EVENTS.POST_LIKE]?.count > 5) {
      preferences.engagementLevel = 'medium';
    }

    return preferences;
  }
}

// Trending content analyzer
export class TrendingAnalyzer {
  constructor() {
    this.contentScores = new Map();
  }

  // Calculate trending score for content
  calculateTrendingScore(content) {
    const now = Date.now();
    const createdAt = new Date(content.createdAt || now).getTime();
    const ageInHours = (now - createdAt) / (1000 * 60 * 60);
    
    // Engagement metrics
    const likes = content.likedBy?.length || 0;
    const comments = content.comments?.length || 0;
    const shares = content.shares || 0;
    const views = content.views || 0;
    const contributions = content.contributionCount || 0;
    
    // Weight factors
    const likeWeight = 1;
    const commentWeight = 2;
    const shareWeight = 3;
    const viewWeight = 0.1;
    const contributionWeight = 4;
    
    // Time decay factor (content loses relevance over time)
    const timeDecay = Math.exp(-ageInHours / 24); // 24-hour half-life
    
    // Calculate score
    const engagementScore = (
      likes * likeWeight +
      comments * commentWeight +
      shares * shareWeight +
      views * viewWeight +
      contributions * contributionWeight
    );
    
    const trendingScore = engagementScore * timeDecay;
    
    this.contentScores.set(content.id, {
      score: trendingScore,
      engagementScore,
      timeDecay,
      ageInHours,
      timestamp: now
    });
    
    return trendingScore;
  }

  // Get trending content
  getTrendingContent(contentList, limit = 10) {
    const scoredContent = contentList.map(content => ({
      ...content,
      trendingScore: this.calculateTrendingScore(content)
    }));
    
    return scoredContent
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, limit);
  }

  // Get content insights
  getContentInsights(contentId) {
    const scoreData = this.contentScores.get(contentId);
    if (!scoreData) return null;
    
    return {
      trendingScore: scoreData.score,
      engagementScore: scoreData.engagementScore,
      timeDecay: scoreData.timeDecay,
      ageInHours: scoreData.ageInHours,
      performance: this.getPerformanceLevel(scoreData.score)
    };
  }

  // Get performance level
  getPerformanceLevel(score) {
    if (score > 100) return 'viral';
    if (score > 50) return 'trending';
    if (score > 20) return 'popular';
    if (score > 10) return 'good';
    return 'normal';
  }
}

// Create global analytics instance
export const analytics = new Analytics();
export const contentTracker = new ContentPerformanceTracker();
export const behaviorTracker = new UserBehaviorTracker();
export const trendingAnalyzer = new TrendingAnalyzer();

// Convenience functions
export const trackEvent = (eventName, properties = {}) => {
  analytics.track(eventName, properties);
};

export const trackContentEngagement = (contentId, engagementType, value = 1) => {
  contentTracker.trackEngagement(contentId, engagementType, value);
  trackEvent(`content_${engagementType}`, { contentId, value });
};

export const trackUserBehavior = (behaviorType, properties = {}) => {
  behaviorTracker.trackBehavior(behaviorType, properties);
};

export const getTrendingContent = (contentList, limit = 10) => {
  return trendingAnalyzer.getTrendingContent(contentList, limit);
};

export default {
  analytics,
  contentTracker,
  behaviorTracker,
  trendingAnalyzer,
  trackEvent,
  trackContentEngagement,
  trackUserBehavior,
  getTrendingContent,
  ANALYTICS_EVENTS
}; 