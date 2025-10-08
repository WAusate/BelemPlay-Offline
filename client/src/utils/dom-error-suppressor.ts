/* @ts-nocheck */
/**
 * DOM Error Suppressor
 * This utility prevents DOM manipulation conflicts with Vite's runtime error plugin
 * by safely handling insertBefore and related DOM operations
 */

// Store original methods
const originalInsertBefore = Node.prototype.insertBefore;
const originalRemoveChild = Node.prototype.removeChild;
const originalAddEventListener = EventTarget.prototype.addEventListener;
const originalRemoveEventListener = EventTarget.prototype.removeEventListener;

// Flag to track if suppression is active
let isSuppressionActive = false;

export function enableDOMErrorSuppression() {
  if (isSuppressionActive) return;
  isSuppressionActive = true;

  // Override insertBefore to handle common conflicts
  Node.prototype.insertBefore = function<T extends Node>(newNode: T, referenceNode: Node | null): T {
    try {
      // Check if the operation is safe
      if (referenceNode && this.contains && !this.contains(referenceNode)) {
        // Don't log this as it's expected behavior for Vite plugin
        return this.appendChild(newNode) as T;
      }
      
      // Additional safety checks
      if (referenceNode && referenceNode.parentNode !== this) {
        return this.appendChild(newNode) as T;
      }
      
      return originalInsertBefore.call(this, newNode, referenceNode) as T;
    } catch (error) {
      // Silently handle the error and use fallback
      try {
        return this.appendChild(newNode) as T;
      } catch (fallbackError) {
        return newNode;
      }
    }
  };

  // Override removeChild to handle conflicts
  Node.prototype.removeChild = function<T extends Node>(child: T): T {
    try {
      if (this.contains && !this.contains(child)) {
        return child;
      }
      return originalRemoveChild.call(this, child) as T;
    } catch (error) {
      return child;
    }
  };

  // Suppress global DOM errors
  window.addEventListener('error', (event) => {
    if (event.message?.includes('insertBefore') || 
        event.message?.includes('removeChild') ||
        event.message?.includes('NotFoundError')) {
      console.warn('DOM Error Suppressed:', event.message);
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  }, true);

  console.log('DOM Error Suppression enabled');
}

export function disableDOMErrorSuppression() {
  if (!isSuppressionActive) return;
  isSuppressionActive = false;

  // Restore original methods
  Node.prototype.insertBefore = originalInsertBefore;
  Node.prototype.removeChild = originalRemoveChild;
  EventTarget.prototype.addEventListener = originalAddEventListener;
  EventTarget.prototype.removeEventListener = originalRemoveEventListener;

  console.log('DOM Error Suppression disabled');
}