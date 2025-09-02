/**
 * AI Debug Utilities
 * Helper functions for debugging AI service responses and handling errors
 */

import { logError, logWarn, logDebug } from './logger';

/**
 * Validate AI service response structure
 */
export function validateAIResponse<T>(
  response: any, 
  expectedKeys: string[], 
  serviceName: string,
  context?: Record<string, any>
): response is T {
  if (!response) {
    logError(`AI service response validation failed: ${serviceName} returned null/undefined`, {
      component: 'AIDebugUtils',
      function: 'validateAIResponse',
      action: 'validation-failed',
      serviceName,
      expectedKeys,
      actualResponse: response,
      context,
      timestamp: new Date().toISOString()
    });
    return false;
  }

  const missingKeys = expectedKeys.filter(key => !(key in response));
  
  if (missingKeys.length > 0) {
    logError(`AI service response validation failed: ${serviceName} missing required keys`, {
      component: 'AIDebugUtils',
      function: 'validateAIResponse',
      action: 'validation-failed',
      serviceName,
      expectedKeys,
      missingKeys,
      actualResponse: response,
      actualKeys: Object.keys(response),
      context,
      timestamp: new Date().toISOString()
    });
    return false;
  }

  // Log successful validation
  logDebug(`AI service response validation passed: ${serviceName}`, {
    component: 'AIDebugUtils',
    function: 'validateAIResponse',
    action: 'validation-passed',
    serviceName,
    expectedKeys,
    actualKeys: Object.keys(response),
    context,
    timestamp: new Date().toISOString()
  });

  return true;
}

/**
 * Safe destructuring with fallback values
 */
export function safeDestructure<T>(
  response: any,
  key: string,
  fallback: T,
  serviceName: string,
  context?: Record<string, any>
): T {
  if (!response || !(key in response)) {
    logWarn(`AI service response missing key: ${serviceName}.${key}`, {
      component: 'AIDebugUtils',
      function: 'safeDestructure',
      action: 'missing-key',
      serviceName,
      key,
      fallback,
      actualResponse: response,
      context,
      timestamp: new Date().toISOString()
    });
    return fallback;
  }

  const value = response[key];
  
  // Log successful extraction
  logDebug(`AI service response key extracted: ${serviceName}.${key}`, {
    component: 'AIDebugUtils',
    function: 'safeDestructure',
    action: 'key-extracted',
    serviceName,
    key,
    value,
    context,
    timestamp: new Date().toISOString()
  });

  return value;
}

/**
 * Validate transcription response
 */
export function validateTranscriptionResponse(response: any, context?: Record<string, any>): response is { transcription: string } {
  return validateAIResponse<{ transcription: string }>(
    response, 
    ['transcription'], 
    'TranscriptionService',
    context
  );
}

/**
 * Validate title/summary response
 */
export function validateTitleSummaryResponse(response: any, context?: Record<string, any>): response is { title: string; summary: string; tags: string[] } {
  return validateAIResponse<{ title: string; summary: string; tags: string[] }>(
    response, 
    ['title', 'summary', 'tags'], 
    'TitleSummaryService',
    context
  );
}

/**
 * Validate sentiment response
 */
export function validateSentimentResponse(response: any, context?: Record<string, any>): response is { sentiment: string } {
  return validateAIResponse<{ sentiment: string }>(
    response, 
    ['sentiment'], 
    'SentimentService',
    context
  );
}

/**
 * Create fallback values for failed AI processing
 */
export function createFallbackValues(audioBlob?: Blob): {
  title: string;
  summary: string;
  tags: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
} {
  const timestamp = new Date();
  const dateString = timestamp.toLocaleDateString();
  const timeString = timestamp.toLocaleTimeString();
  
  const fallbackValues = {
    title: `Audio Recording - ${dateString} ${timeString}`,
    summary: 'Audio recording available. AI processing failed, but you can manually add title and summary.',
    tags: ['audio', 'recording', 'manual-input-needed'],
    sentiment: 'neutral' as const
  };

  // Log fallback values creation
  logDebug('Fallback values created for failed AI processing', {
    component: 'AIDebugUtils',
    function: 'createFallbackValues',
    action: 'fallback-created',
    fallbackValues,
    audioBlobInfo: audioBlob ? {
      size: audioBlob.size,
      type: audioBlob.type
    } : 'no-audio-blob',
    timestamp: new Date().toISOString()
  });

  return fallbackValues;
}

/**
 * Log AI service call attempt
 */
export function logAIServiceCall(
  serviceName: string,
  action: string,
  params: Record<string, any>,
  context?: Record<string, any>
): void {
  logDebug(`AI service call initiated: ${serviceName}`, {
    component: 'AIDebugUtils',
    function: 'logAIServiceCall',
    action: 'service-call-initiated',
    serviceName,
    serviceAction: action,
    params,
    context,
    timestamp: new Date().toISOString()
  });
}

/**
 * Log AI service call result
 */
export function logAIServiceResult(
  serviceName: string,
  action: string,
  result: any,
  success: boolean,
  context?: Record<string, any>
): void {
  const logLevel = success ? 'debug' : 'error';
  const logFunction = success ? logDebug : logError;
  
  logFunction(`AI service call ${success ? 'completed' : 'failed'}: ${serviceName}`, {
    component: 'AIDebugUtils',
    function: 'logAIServiceResult',
    action: success ? 'service-call-success' : 'service-call-failed',
    serviceName,
    serviceAction: action,
    success,
    result: success ? result : undefined,
    error: success ? undefined : result,
    context,
    timestamp: new Date().toISOString()
  });
}
