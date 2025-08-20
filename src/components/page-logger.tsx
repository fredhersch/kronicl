'use client';

import React, { useEffect, Suspense } from 'react';
import { usePageLogging } from '@/hooks/use-page-logging';
import { logInfo } from '@/lib/logger-client';

/**
 * Fallback component that doesn't use any dynamic hooks
 * This ensures the component can render safely during SSR
 */
function PageLoggerFallback() {
  return null;
}

/**
 * Page Logger Component
 * Automatically logs page access, navigation, and user interactions
 * Add this to your layout for comprehensive page tracking
 */
function PageLoggerContent() {
  const { logPageEvent, getCurrentPageInfo } = usePageLogging();

  // Log additional page-specific information
  const logPageDetails = () => {
    if (typeof window === 'undefined') return;

    const pageInfo = getCurrentPageInfo();
    const additionalContext = {
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio
      },
      location: {
        href: window.location.href,
        origin: window.location.origin,
        protocol: window.location.protocol
      },
      performance: {
        navigationType: performance.getEntriesByType('navigation')[0]?.type || 'unknown',
        loadTime: performance.timing?.loadEventEnd - performance.timing?.navigationStart || 0
      }
    };

    logPageEvent('Page details captured', additionalContext);
  };

  // Log page details after a short delay to ensure all data is available
  useEffect(() => {
    const timer = setTimeout(logPageDetails, 100);
    return () => clearTimeout(timer);
  }, []);

  // This component doesn't render anything visible
  return null;
}

export function PageLogger() {
  return (
    <Suspense fallback={<PageLoggerFallback />}>
      <PageLoggerContent />
    </Suspense>
  );
}

export default PageLogger;
