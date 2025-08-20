/**
 * Comprehensive logging utility for troubleshooting and debugging
 * Provides clear distinction between info, warning, and error logging
 * Includes testing-specific features and structured logging
 */

import { isDebugMode } from './debug';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4
}

export interface LogContext {
  component?: string;
  function?: string;
  userId?: string;
  sessionId?: string;
  testRun?: string;
  timestamp?: string;
  [key: string]: any;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context: LogContext;
  timestamp: string;
  stack?: string;
}

class Logger {
  private logLevel: LogLevel;
  private isTestEnvironment: boolean;
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000; // Prevent memory leaks
  private storageKey = 'memory-lane-logs';

  constructor() {
    this.logLevel = this.getLogLevelFromEnv();
    this.isTestEnvironment = this.detectTestEnvironment();
    
    // Load existing logs from storage if available
    this.loadLogsFromStorage();
    
    // Log logger initialization
    this.info('Logger initialized', {
      logLevel: LogLevel[this.logLevel],
      isTestEnvironment: this.isTestEnvironment,
      debugMode: isDebugMode()
    });
  }

  private getLogLevelFromEnv(): LogLevel {
    const level = process.env.NEXT_PUBLIC_LOG_LEVEL?.toUpperCase();
    switch (level) {
      case 'DEBUG': return LogLevel.DEBUG;
      case 'INFO': return LogLevel.INFO;
      case 'WARN': return LogLevel.WARN;
      case 'ERROR': return LogLevel.ERROR;
      case 'CRITICAL': return LogLevel.CRITICAL;
      default: return process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO;
    }
  }

  private detectTestEnvironment(): boolean {
    return (
      typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || 
       window.location.hostname === '127.0.0.1' ||
       window.location.search.includes('test=true'))
    ) || 
    process.env.NODE_ENV === 'test' ||
    process.env.NEXT_PUBLIC_TEST_MODE === 'true';
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel || this.isTestEnvironment || isDebugMode();
  }

  private loadLogsFromStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            this.logs = parsed;
          }
        }
      } catch (error) {
        console.warn('Failed to load logs from storage:', error);
      }
    }
  }

  private saveLogsToStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(this.logs));
      } catch (error) {
        console.warn('Failed to save logs to storage:', error);
      }
    }
  }

  private createLogEntry(
    level: LogLevel, 
    message: string, 
    context: LogContext = {},
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      context: {
        ...context
      },
      timestamp: new Date().toISOString()
    };

    if (error && error.stack) {
      entry.stack = error.stack;
    }

    // Store log entry for testing/debugging
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift(); // Remove oldest log
    }

    // Save to storage
    this.saveLogsToStorage();

    return entry;
  }

  private formatMessage(entry: LogEntry): string {
    const levelStr = LogLevel[entry.level].padEnd(8);
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    
    let contextStr = '';
    if (Object.keys(entry.context).length > 0) {
      try {
        // Safely stringify context, handling circular references
        const contextCopy = { ...entry.context };
        // Remove any potential circular references
        delete contextCopy.timestamp; // Remove timestamp from context display
        contextStr = ` [${JSON.stringify(contextCopy)}]`;
      } catch (error) {
        contextStr = ' [Context serialization error]';
      }
    }
    
    return `[${timestamp}] ${levelStr} ${entry.message}${contextStr}`;
  }

  private logToConsole(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return;

    const formattedMessage = this.formatMessage(entry);
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        console.error(formattedMessage);
        if (entry.stack) {
          console.error('Stack trace:', entry.stack);
        }
        break;
    }
  }

  // Public logging methods
  debug(message: string, context: LogContext = {}): void {
    const entry = this.createLogEntry(LogLevel.DEBUG, message, context);
    this.logToConsole(entry);
  }

  info(message: string, context: LogContext = {}): void {
    const entry = this.createLogEntry(LogLevel.INFO, message, context);
    this.logToConsole(entry);
  }

  warn(message: string, context: LogContext = {}): void {
    const entry = this.createLogEntry(LogLevel.WARN, message, context);
    this.logToConsole(entry);
  }

  error(message: string, context: LogContext = {}, error?: Error): void {
    const entry = this.createLogEntry(LogLevel.ERROR, message, context, error);
    this.logToConsole(entry);
  }

  critical(message: string, context: LogContext = {}, error?: Error): void {
    const entry = this.createLogEntry(LogLevel.CRITICAL, message, context, error);
    this.logToConsole(entry);
  }

  // Testing-specific methods
  testLog(message: string, context: LogContext = {}): void {
    if (this.isTestEnvironment) {
      this.info(`[TEST] ${message}`, context);
    }
  }

  testError(message: string, context: LogContext = {}, error?: Error): void {
    if (this.isTestEnvironment) {
      this.error(`[TEST ERROR] ${message}`, context, error);
    }
  }

  // Utility methods
  getLogs(level?: LogLevel): LogEntry[] {
    if (level !== undefined) {
      return this.logs.filter(log => log.level === level);
    }
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
    this.saveLogsToStorage();
  }

  exportLogs(): string {
    try {
      // Safely stringify logs, handling potential circular references
      const cleanLogs = this.logs.map(log => ({
        level: log.level,
        message: log.message,
        context: { ...log.context },
        timestamp: log.timestamp,
        stack: log.stack
      }));
      
      // Remove timestamp from context to avoid duplication
      cleanLogs.forEach(log => {
        delete log.context.timestamp;
      });
      
      return JSON.stringify(cleanLogs, null, 2);
    } catch (error) {
      console.warn('Failed to export logs:', error);
      return '[]';
    }
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
    this.info(`Log level changed to ${LogLevel[level]}`);
  }

  getCurrentLogLevel(): LogLevel {
    return this.logLevel;
  }

  isTestMode(): boolean {
    return this.isTestEnvironment;
  }
}

// Create singleton instance
export const logger = new Logger();

// Convenience functions for direct import
export const logDebug = (message: string, context?: LogContext) => logger.debug(message, context);
export const logInfo = (message: string, context?: LogContext) => logger.info(message, context);
export const logWarn = (message: string, context?: LogContext) => logger.warn(message, context);
export const logError = (message: string, context?: LogContext, error?: Error) => logger.error(message, context, error);
export const logCritical = (message: string, context?: LogContext, error?: Error) => logger.critical(message, context, error);
export const logTest = (message: string, context?: LogContext) => logger.testLog(message, context);
export const logTestError = (message: string, context?: LogContext, error?: Error) => logger.testError(message, context, error);
