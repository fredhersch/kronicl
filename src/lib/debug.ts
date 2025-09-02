/**
 * Debug utility for controlling debug information display
 * Can be controlled via URL parameter (?debug=true) or environment variable
 */

let manualDebugMode: boolean | null = null;

export function isDebugMode(): boolean {
  // If manually set, use that value
  if (manualDebugMode !== null) {
    return manualDebugMode;
  }

  // Check URL parameter first (highest priority) - client-side only
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const debugParam = urlParams.get('debug');
    
    if (debugParam === 'true' || debugParam === '1') {
      return true;
    }
    
    if (debugParam === 'false' || debugParam === '0') {
      return false;
    }
  }

  // Check environment variable second
  if (process.env.NEXT_PUBLIC_DEBUG_MODE === 'true') {
    return true;
  }
  
  if (process.env.NEXT_PUBLIC_DEBUG_MODE === 'false') {
    return false;
  }

  // Default to development mode
  return process.env.NODE_ENV === 'development';
}

export function debugLog(...args: any[]): void {
  if (isDebugMode()) {
    console.log(...args);
  }
}

export function debugWarn(...args: any[]): void {
  if (isDebugMode()) {
    console.warn(...args);
  }
}

export function debugError(...args: any[]): void {
  if (isDebugMode()) {
    console.error(...args);
  }
}

// Utility to set debug mode programmatically
export function setDebugMode(enabled: boolean): void {
  manualDebugMode = enabled;
}

// Utility to clear manual debug mode (allows URL/env to take effect)
export function clearManualDebugMode(): void {
  manualDebugMode = null;
}

// Utility to get current debug status
export function getDebugStatus() {
  const isDebug = isDebugMode();
  
  // Determine source using same priority logic
  let source = 'Default (development mode)';
  
  if (manualDebugMode !== null) {
    source = 'Manual override';
  } else if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const debugParam = urlParams.get('debug');
    
    if (debugParam === 'true' || debugParam === '1' || debugParam === 'false' || debugParam === '0') {
      source = 'URL parameter';
    } else if (process.env.NEXT_PUBLIC_DEBUG_MODE === 'true' || process.env.NEXT_PUBLIC_DEBUG_MODE === 'false') {
      source = 'Environment variable';
    }
  } else if (process.env.NEXT_PUBLIC_DEBUG_MODE === 'true' || process.env.NEXT_PUBLIC_DEBUG_MODE === 'false') {
    source = 'Environment variable';
  }
    
  return { enabled: isDebug, source };
}
