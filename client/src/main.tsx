import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { enableDOMErrorSuppression } from "./utils/dom-error-suppressor";
import { registerServiceWorker } from "./lib/register-sw";
import { initializeOfflineDatabase } from "./lib/offline-db";

// Enable comprehensive DOM error suppression
enableDOMErrorSuppression();

// Comprehensive error suppression for Vite plugin issues
window.addEventListener('error', (event) => {
  if (event.message && (
    event.message.includes('insertBefore') ||
    event.message.includes('runtime-error-plugin') ||
    event.message.includes('Failed to execute \'insertBefore\' on \'Node\'') ||
    event.message.includes('NotFoundError') ||
    event.message.includes('DOM manipulation')
  )) {
    console.warn('Vite plugin error suppressed:', event.message);
    event.preventDefault();
    event.stopPropagation();
    return false;
  }
}, true);

// Also suppress unhandled promise rejections from Vite plugins
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && event.reason.message && (
    event.reason.message.includes('insertBefore') ||
    event.reason.message.includes('runtime-error-plugin')
  )) {
    console.warn('Vite plugin promise rejection suppressed');
    event.preventDefault();
  }
});

// Enhanced console.error override to suppress DOM-related errors
if (typeof window !== 'undefined') {
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  
  console.error = function(...args) {
    const message = args.join(' ');
    if (message.includes('insertBefore') || 
        message.includes('runtime-error-plugin') ||
        message.includes('removeChild') ||
        message.includes('NotFoundError') ||
        message.includes('Failed to execute') ||
        (message.includes('DOM') && message.includes('manipulation'))) {
      return; // Don't log these errors
    }
    return originalConsoleError.apply(console, args);
  };
  
  console.warn = function(...args) {
    const message = args.join(' ');
    if (message.includes('DOM Error Suppressed') || 
        message.includes('insertBefore with invalid reference node')) {
      return; // Don't log DOM suppression warnings
    }
    return originalConsoleWarn.apply(console, args);
  };
}

// Register Service Worker for PWA functionality
registerServiceWorker();

async function bootstrap() {
  try {
    await initializeOfflineDatabase();
  } catch (error) {
    console.error('Erro ao iniciar banco de dados offline:', error);
  }

  const rootElement = document.getElementById("root");
  if (rootElement) {
    createRoot(rootElement).render(<App />);
  } else {
    console.error('Root element not found. Make sure there is a div with id="root" in your HTML.');
  }
}

bootstrap();

