import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { logInfo, logDebug } from '@/lib/logger-client';

interface PageAccessContext {
  previousPath?: string;
  searchParams?: string;
  referrer?: string;
  userAgent?: string;
  timestamp: string;
  sessionId?: string;
}

/**
 * Hook for automatically logging page access and navigation
 * Provides comprehensive tracking for debugging navigation issues
 */
export function usePageLogging() {
  // Ensure this hook only runs on the client side
  if (typeof window === 'undefined') {
    return {
      logPageEvent: () => {},
      getCurrentPageInfo: () => ({
        currentPath: '',
        previousPath: '',
        searchParams: '',
        sessionId: ''
      })
    };
  }

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previousPathRef = useRef<string | undefined>();
  const sessionIdRef = useRef<string>(generateSessionId());

  useEffect(() => {
    const currentPath = pathname;
    const currentSearchParams = searchParams.toString();
    const previousPath = previousPathRef.current;
    
    // Get referrer information
    const referrer = typeof window !== 'undefined' ? document.referrer : undefined;
    const userAgent = typeof window !== 'undefined' ? navigator.userAgent : undefined;
    
    // Create context for logging
    const context: PageAccessContext = {
      previousPath,
      searchParams: currentSearchParams || undefined,
      referrer,
      userAgent,
      timestamp: new Date().toISOString(),
      sessionId: sessionIdRef.current
    };

    // Log page access
    if (previousPath !== currentPath) {
      logInfo('Page accessed', {
        component: 'PageLogger',
        function: 'usePageLogging',
        action: 'page-access',
        currentPath,
        previousPath,
        navigationType: previousPath ? 'navigation' : 'initial-load',
        ...context
      });

      // Log additional navigation details
      if (previousPath) {
        logDebug('Navigation occurred', {
          component: 'PageLogger',
          function: 'usePageLogging',
          action: 'navigation',
          from: previousPath,
          to: currentPath,
          searchParamsChanged: previousPath !== currentPath,
          ...context
        });
      }
    }

    // Log search parameter changes if path is the same but params changed
    if (previousPath === currentPath && previousPathRef.current !== undefined) {
      const previousSearchParams = searchParams.toString();
      if (previousSearchParams !== currentSearchParams) {
        logDebug('Search parameters changed', {
          component: 'PageLogger',
          function: 'usePageLogging',
          action: 'search-params-change',
          path: currentPath,
          previousSearchParams,
          currentSearchParams,
          ...context
        });
      }
    }

    // Update previous path reference
    previousPathRef.current = currentPath;
  }, [pathname, searchParams]);

  // Log page visibility changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      const context: PageAccessContext = {
        previousPath: previousPathRef.current,
        timestamp: new Date().toISOString(),
        sessionId: sessionIdRef.current
      };

      logDebug('Page visibility changed', {
        component: 'PageLogger',
        function: 'usePageLogging',
        action: 'visibility-change',
        isVisible,
        currentPath: pathname,
        ...context
      });
    };

    const handleBeforeUnload = () => {
      const context: PageAccessContext = {
        previousPath: previousPathRef.current,
        timestamp: new Date().toISOString(),
        sessionId: sessionIdRef.current
      };

      logInfo('Page unload initiated', {
        component: 'PageLogger',
        function: 'usePageLogging',
        action: 'page-unload',
        currentPath: pathname,
        ...context
      });
    };

    const handlePageShow = (event: PageTransitionEvent) => {
      const context: PageAccessContext = {
        previousPath: previousPathRef.current,
        timestamp: new Date().toISOString(),
        sessionId: sessionIdRef.current
      };

      logDebug('Page show event', {
        component: 'PageLogger',
        function: 'usePageLogging',
        action: 'page-show',
        currentPath: pathname,
        persisted: event.persisted,
        ...context
      });
    };

    const handlePageHide = (event: PageTransitionEvent) => {
      const context: PageAccessContext = {
        previousPath: previousPathRef.current,
        timestamp: new Date().toISOString(),
        sessionId: sessionIdRef.current
      };

      logDebug('Page hide event', {
        component: 'PageLogger',
        function: 'usePageLogging',
        action: 'page-hide',
        currentPath: pathname,
        persisted: event.persisted,
        ...context
      });
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('pagehide', handlePageHide);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [pathname]);

  // Return utility functions for manual logging
  return {
    logPageEvent: (event: string, additionalContext?: Record<string, any>) => {
      const context: PageAccessContext = {
        previousPath: previousPathRef.current,
        timestamp: new Date().toISOString(),
        sessionId: sessionIdRef.current,
        ...additionalContext
      };

      logInfo(`Page event: ${event}`, {
        component: 'PageLogger',
        function: 'usePageLogging',
        action: 'manual-page-event',
        event,
        currentPath: pathname,
        ...context
      });
    },
    
    getCurrentPageInfo: () => ({
      currentPath: pathname,
      previousPath: previousPathRef.current,
      searchParams: searchParams.toString(),
      sessionId: sessionIdRef.current
    })
  };
}

/**
 * Generate a unique session ID for tracking user sessions
 */
function generateSessionId(): string {
  if (typeof window === 'undefined') {
    return `server-${Date.now()}`;
  }

  // Try to get existing session ID from sessionStorage
  let sessionId = sessionStorage.getItem('page-logger-session-id');
  
  if (!sessionId) {
    // Generate new session ID
    sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('page-logger-session-id', sessionId);
  }
  
  return sessionId;
}

/**
 * Higher-order component for automatic page logging
 * Wrap your app or specific components to enable automatic logging
 */
export function withPageLogging<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    logInitialLoad?: boolean;
    logNavigation?: boolean;
    logSearchParams?: boolean;
    logVisibility?: boolean;
  }
) {
  const defaultOptions = {
    logInitialLoad: true,
    logNavigation: true,
    logSearchParams: true,
    logVisibility: true,
    ...options
  };

  return function PageLoggedComponent(props: P) {
    usePageLogging();
    return <Component {...props} />;
  };
}
