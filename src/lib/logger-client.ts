/**
 * Client-side logger utility that syncs logs to the server
 * Ensures logs are available both locally and via the /api/logs endpoint
 */

import { logger, LogLevel, LogContext } from './logger';

// Debounce function to avoid sending too many requests
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Send logs to server API
async function sendLogsToServer(logs: any[]): Promise<void> {
  try {
    // Only send if we're in the browser
    if (typeof window === 'undefined') return;

    // Send each log individually to avoid payload size issues
    for (const log of logs) {
      await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          level: log.level,
          message: log.message,
          context: log.context
        })
      });
    }
  } catch (error) {
    console.warn('Failed to sync logs to server:', error);
  }
}

// Debounced version of sendLogsToServer
const debouncedSendLogs = debounce(sendLogsToServer, 1000);

// Override the original logger methods to also sync to server
const originalDebug = logger.debug.bind(logger);
const originalInfo = logger.info.bind(logger);
const originalWarn = logger.warn.bind(logger);
const originalError = logger.error.bind(logger);
const originalCritical = logger.critical.bind(logger);

// Enhanced logging methods that sync to server
logger.debug = (message: string, context: LogContext = {}) => {
  originalDebug(message, context);
  // Sync to server in background
  debouncedSendLogs([{ level: LogLevel.DEBUG, message, context }]);
};

logger.info = (message: string, context: LogContext = {}) => {
  originalInfo(message, context);
  // Sync to server in background
  debouncedSendLogs([{ level: LogLevel.INFO, message, context }]);
};

logger.warn = (message: string, context: LogContext = {}) => {
  originalWarn(message, context);
  // Sync to server in background
  debouncedSendLogs([{ level: LogLevel.WARN, message, context }]);
};

logger.error = (message: string, context: LogContext = {}, error?: Error) => {
  originalError(message, context, error);
  // Sync to server in background
  debouncedSendLogs([{ level: LogLevel.ERROR, message, context, error }]);
};

logger.critical = (message: string, context: LogContext = {}, error?: Error) => {
  originalCritical(message, context, error);
  // Sync to server in background
  debouncedSendLogs([{ level: LogLevel.CRITICAL, message, context, error }]);
};

// Export the enhanced logger
export { logger };

// Also export the convenience functions
export const logDebug = (message: string, context?: LogContext) => logger.debug(message, context);
export const logInfo = (message: string, context?: LogContext) => logger.info(message, context);
export const logWarn = (message: string, context?: LogContext) => logger.warn(message, context);
export const logError = (message: string, context?: LogContext, error?: Error) => logger.error(message, context, error);
export const logCritical = (message: string, context?: LogContext, error?: Error) => logger.critical(message, context, error);
export const logTest = (message: string, context?: LogContext) => logger.testLog(message, context);
export const logTestError = (message: string, context?: LogContext, error?: Error) => logger.testError(message, context, error);

// Function to manually sync all current logs to server
export async function syncAllLogsToServer(): Promise<void> {
  const logs = logger.getLogs();
  await sendLogsToServer(logs);
}

// Function to check if logs are syncing properly
export async function checkLogSync(): Promise<boolean> {
  try {
    const response = await fetch('/api/logs?limit=1');
    return response.ok;
  } catch {
    return false;
  }
}
