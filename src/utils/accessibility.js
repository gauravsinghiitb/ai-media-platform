import React from 'react';

// Accessibility utilities for ARIA labels, keyboard navigation, and screen reader support

// ARIA labels and descriptions
export const ARIA_LABELS = {
  // Navigation
  NAVIGATION_MENU: 'Main navigation menu',
  SEARCH_BUTTON: 'Search for posts, users, and contributions',
  USER_MENU: 'User account menu',
  LOGOUT_BUTTON: 'Logout from your account',
  
  // Content
  LIKE_BUTTON: 'Like this post',
  UNLIKE_BUTTON: 'Unlike this post',
  COMMENT_BUTTON: 'Add a comment',
  SHARE_BUTTON: 'Share this post',
  SAVE_BUTTON: 'Save this post',
  UNSAVE_BUTTON: 'Remove from saved posts',
  CONTRIBUTE_BUTTON: 'Contribute to this post',
  REMIX_BUTTON: 'Remix this content',
  
  // Video controls
  PLAY_BUTTON: 'Play video',
  PAUSE_BUTTON: 'Pause video',
  MUTE_BUTTON: 'Mute video audio',
  UNMUTE_BUTTON: 'Unmute video audio',
  VOLUME_SLIDER: 'Video volume control',
  PROGRESS_BAR: 'Video progress bar',
  FULLSCREEN_BUTTON: 'Enter fullscreen mode',
  EXIT_FULLSCREEN_BUTTON: 'Exit fullscreen mode',
  
  // Forms
  SEARCH_INPUT: 'Search for content',
  COMMENT_INPUT: 'Write your comment',
  UPLOAD_BUTTON: 'Upload new content',
  SUBMIT_BUTTON: 'Submit form',
  CANCEL_BUTTON: 'Cancel action',
  
  // User interface
  CLOSE_BUTTON: 'Close dialog',
  EXPAND_BUTTON: 'Expand content',
  COLLAPSE_BUTTON: 'Collapse content',
  LOADING_SPINNER: 'Loading content',
  ERROR_MESSAGE: 'Error occurred',
  SUCCESS_MESSAGE: 'Action completed successfully'
};

// Keyboard navigation utilities
export class KeyboardNavigation {
  constructor() {
    this.focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    this.currentFocusIndex = 0;
    this.focusableNodes = [];
  }

  // Get all focusable elements in a container
  getFocusableElements(container = document) {
    const elements = container.querySelectorAll(this.focusableElements);
    return Array.from(elements).filter(el => {
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden' && !el.disabled;
    });
  }

  // Set up keyboard navigation for a container
  setupKeyboardNavigation(container, options = {}) {
    const {
      onEnter = null,
      onEscape = null,
      onArrowUp = null,
      onArrowDown = null,
      onArrowLeft = null,
      onArrowRight = null,
      cycleFocus = true
    } = options;

    this.focusableNodes = this.getFocusableElements(container);
    this.currentFocusIndex = 0;

    const handleKeyDown = (event) => {
      switch (event.key) {
        case 'Enter':
          if (onEnter) onEnter(event);
          break;
        case 'Escape':
          if (onEscape) onEscape(event);
          break;
        case 'ArrowUp':
          event.preventDefault();
          if (onArrowUp) onArrowUp(event);
          else this.moveFocus('up', cycleFocus);
          break;
        case 'ArrowDown':
          event.preventDefault();
          if (onArrowDown) onArrowDown(event);
          else this.moveFocus('down', cycleFocus);
          break;
        case 'ArrowLeft':
          event.preventDefault();
          if (onArrowLeft) onArrowLeft(event);
          else this.moveFocus('left', cycleFocus);
          break;
        case 'ArrowRight':
          event.preventDefault();
          if (onArrowRight) onArrowRight(event);
          else this.moveFocus('right', cycleFocus);
          break;
        case 'Tab':
          this.handleTabNavigation(event);
          break;
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    
    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }

  // Move focus in specified direction
  moveFocus(direction, cycle = true) {
    if (this.focusableNodes.length === 0) return;

    let newIndex = this.currentFocusIndex;

    switch (direction) {
      case 'up':
      case 'left':
        newIndex = cycle ? 
          (newIndex - 1 + this.focusableNodes.length) % this.focusableNodes.length :
          Math.max(0, newIndex - 1);
        break;
      case 'down':
      case 'right':
        newIndex = cycle ?
          (newIndex + 1) % this.focusableNodes.length :
          Math.min(this.focusableNodes.length - 1, newIndex + 1);
        break;
    }

    this.setFocus(newIndex);
  }

  // Set focus to specific index
  setFocus(index) {
    if (index >= 0 && index < this.focusableNodes.length) {
      this.currentFocusIndex = index;
      this.focusableNodes[index].focus();
    }
  }

  // Handle tab navigation
  handleTabNavigation(event) {
    const currentElement = event.target;
    const currentIndex = this.focusableNodes.indexOf(currentElement);
    
    if (currentIndex !== -1) {
      this.currentFocusIndex = currentIndex;
    }
  }

  // Trap focus within a container
  trapFocus(container) {
    const focusableElements = this.getFocusableElements(container);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (event) => {
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    
    // Focus first element
    if (firstElement) {
      firstElement.focus();
    }

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }
}

// Screen reader utilities
export class ScreenReader {
  constructor() {
    this.liveRegion = null;
    this.createLiveRegion();
  }

  // Create live region for announcements
  createLiveRegion() {
    this.liveRegion = document.createElement('div');
    this.liveRegion.setAttribute('aria-live', 'polite');
    this.liveRegion.setAttribute('aria-atomic', 'true');
    this.liveRegion.style.position = 'absolute';
    this.liveRegion.style.left = '-10000px';
    this.liveRegion.style.width = '1px';
    this.liveRegion.style.height = '1px';
    this.liveRegion.style.overflow = 'hidden';
    document.body.appendChild(this.liveRegion);
  }

  // Announce message to screen readers
  announce(message, priority = 'polite') {
    if (!this.liveRegion) return;

    this.liveRegion.setAttribute('aria-live', priority);
    this.liveRegion.textContent = message;

    // Clear message after announcement
    setTimeout(() => {
      this.liveRegion.textContent = '';
    }, 1000);
  }

  // Announce page title
  announcePageTitle(title) {
    this.announce(`Page loaded: ${title}`);
  }

  // Announce loading state
  announceLoading(message = 'Loading content') {
    this.announce(message);
  }

  // Announce error
  announceError(message) {
    this.announce(`Error: ${message}`, 'assertive');
  }

  // Announce success
  announceSuccess(message) {
    this.announce(`Success: ${message}`);
  }

  // Clean up live region
  destroy() {
    if (this.liveRegion && this.liveRegion.parentNode) {
      this.liveRegion.parentNode.removeChild(this.liveRegion);
    }
  }
}

// Focus management utilities
export class FocusManager {
  constructor() {
    this.focusStack = [];
    this.lastFocusedElement = null;
  }

  // Save current focus
  saveFocus() {
    this.lastFocusedElement = document.activeElement;
  }

  // Restore previous focus
  restoreFocus() {
    if (this.lastFocusedElement && this.lastFocusedElement.focus) {
      this.lastFocusedElement.focus();
    }
  }

  // Push focus to stack
  pushFocus(element) {
    this.focusStack.push(document.activeElement);
    if (element && element.focus) {
      element.focus();
    }
  }

  // Pop focus from stack
  popFocus() {
    const previousFocus = this.focusStack.pop();
    if (previousFocus && previousFocus.focus) {
      previousFocus.focus();
    }
  }

  // Focus first focusable element in container
  focusFirst(container) {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }

  // Focus last focusable element in container
  focusLast(container) {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length > 0) {
      focusableElements[focusableElements.length - 1].focus();
    }
  }
}

// Accessibility hooks for React
export const useAccessibility = () => {
  const keyboardNav = new KeyboardNavigation();
  const screenReader = new ScreenReader();
  const focusManager = new FocusManager();

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      screenReader.destroy();
    };
  }, []);

  return {
    keyboardNav,
    screenReader,
    focusManager,
    ARIA_LABELS
  };
};

// Accessibility HOC for React components
export const withAccessibility = (WrappedComponent) => {
  return (props) => {
    const accessibility = useAccessibility();
    
    return (
      <WrappedComponent
        {...props}
        accessibility={accessibility}
      />
    );
  };
};

// Skip link component
export const SkipLink = ({ targetId, children = 'Skip to main content' }) => {
  const handleClick = (event) => {
    event.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView();
    }
  };

  return (
    <a
      href={`#${targetId}`}
      onClick={handleClick}
      style={{
        position: 'absolute',
        top: '-40px',
        left: '6px',
        background: '#000000',
        color: '#FFFFFF',
        padding: '8px 16px',
        textDecoration: 'none',
        borderRadius: '4px',
        zIndex: 1000,
        transition: 'top 0.3s'
      }}
      onFocus={(e) => {
        e.target.style.top = '6px';
      }}
      onBlur={(e) => {
        e.target.style.top = '-40px';
      }}
    >
      {children}
    </a>
  );
};

// Accessibility button component
export const AccessibleButton = ({ 
  children, 
  onClick, 
  ariaLabel, 
  ariaDescribedBy,
  disabled = false,
  className = '',
  style = {},
  ...props 
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      className={className}
      style={{
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        ...style
      }}
      {...props}
    >
      {children}
    </button>
  );
};

// Accessibility input component
export const AccessibleInput = ({
  type = 'text',
  label,
  id,
  error,
  helperText,
  required = false,
  className = '',
  style = {},
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = error ? `${inputId}-error` : undefined;
  const helperId = helperText ? `${inputId}-helper` : undefined;

  return (
    <div style={{ marginBottom: '16px' }}>
      <label
        htmlFor={inputId}
        style={{
          display: 'block',
          marginBottom: '4px',
          fontWeight: '600',
          color: '#FFFFFF'
        }}
      >
        {label}
        {required && <span style={{ color: '#FF6B6B' }}> *</span>}
      </label>
      
      <input
        id={inputId}
        type={type}
        required={required}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={[errorId, helperId].filter(Boolean).join(' ')}
        className={className}
        style={{
          width: '100%',
          padding: '12px',
          border: `1px solid ${error ? '#FF6B6B' : '#333333'}`,
          borderRadius: '8px',
          background: '#1a1a1a',
          color: '#FFFFFF',
          fontSize: '16px',
          ...style
        }}
        {...props}
      />
      
      {error && (
        <div
          id={errorId}
          role="alert"
          style={{
            color: '#FF6B6B',
            fontSize: '14px',
            marginTop: '4px'
          }}
        >
          {error}
        </div>
      )}
      
      {helperText && (
        <div
          id={helperId}
          style={{
            color: '#CCCCCC',
            fontSize: '14px',
            marginTop: '4px'
          }}
        >
          {helperText}
        </div>
      )}
    </div>
  );
};

// Create global instances
export const keyboardNavigation = new KeyboardNavigation();
export const screenReader = new ScreenReader();
export const focusManager = new FocusManager();

export default {
  ARIA_LABELS,
  KeyboardNavigation,
  ScreenReader,
  FocusManager,
  useAccessibility,
  withAccessibility,
  SkipLink,
  AccessibleButton,
  AccessibleInput,
  keyboardNavigation,
  screenReader,
  focusManager
}; 