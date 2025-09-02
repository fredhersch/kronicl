/**
 * Testing utilities for troubleshooting and debugging
 * Provides easy access to logs and test-specific functionality
 */

import { logger, LogLevel, type LogEntry, type LogContext } from './logger';

/**
 * Testing utilities class for easy access to logging and debugging
 */
export class TestingUtils {
  private testRunId: string;
  private testStartTime: Date;

  constructor(testName?: string) {
    this.testRunId = testName || `test-${Date.now()}`;
    this.testStartTime = new Date();
    
    logger.testLog('Testing utilities initialized', {
      testRunId: this.testRunId,
      testStartTime: this.testStartTime.toISOString(),
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get all logs since test started
   */
  getTestLogs(): LogEntry[] {
    const logs = logger.getLogs();
    return logs.filter(log => {
      const logTime = new Date(log.timestamp);
      return logTime >= this.testStartTime;
    });
  }

  /**
   * Get logs by level since test started
   */
  getTestLogsByLevel(level: LogLevel): LogEntry[] {
    return this.getTestLogs().filter(log => log.level === level);
  }

  /**
   * Get only error logs since test started
   */
  getTestErrors(): LogEntry[] {
    return this.getTestLogs().filter(log => 
      log.level === LogLevel.ERROR || log.level === LogLevel.CRITICAL
    );
  }

  /**
   * Get logs for a specific component since test started
   */
  getComponentLogs(componentName: string): LogEntry[] {
    return this.getTestLogs().filter(log => 
      log.context.component === componentName
    );
  }

  /**
   * Get logs for a specific function since test started
   */
  getFunctionLogs(functionName: string): LogEntry[] {
    return this.getTestLogs().filter(log => 
      log.context.function === functionName
    );
  }

  /**
   * Get logs containing specific text since test started
   */
  getLogsContaining(searchText: string): LogEntry[] {
    return this.getTestLogs().filter(log => 
      log.message.toLowerCase().includes(searchText.toLowerCase()) ||
      JSON.stringify(log.context).toLowerCase().includes(searchText.toLowerCase())
    );
  }

  /**
   * Export test logs as JSON string
   */
  exportTestLogs(): string {
    const testLogs = this.getTestLogs();
    return JSON.stringify({
      testRunId: this.testRunId,
      testStartTime: this.testStartTime.toISOString(),
      totalLogs: testLogs.length,
      logs: testLogs
    }, null, 2);
  }

  /**
   * Print test summary to console
   */
  printTestSummary(): void {
    const testLogs = this.getTestLogs();
    const errors = testLogs.filter(log => 
      log.level === LogLevel.ERROR || log.level === LogLevel.CRITICAL
    );
    const warnings = testLogs.filter(log => log.level === LogLevel.WARN);
    const info = testLogs.filter(log => log.level === LogLevel.INFO);
    const debug = testLogs.filter(log => log.level === LogLevel.DEBUG);

    console.group(`🧪 Test Summary: ${this.testRunId}`);
    console.log(`📊 Total Logs: ${testLogs.length}`);
    console.log(`❌ Errors: ${errors.length}`);
    console.log(`⚠️  Warnings: ${warnings.length}`);
    console.log(`ℹ️  Info: ${info.length}`);
    console.log(`🔍 Debug: ${debug.length}`);
    console.log(`⏱️  Duration: ${Date.now() - this.testStartTime.getTime()}ms`);
    
    if (errors.length > 0) {
      console.group('❌ Errors:');
      errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.message}`);
        console.log(`   Context:`, error.context);
        if (error.stack) {
          console.log(`   Stack:`, error.stack);
        }
      });
      console.groupEnd();
    }
    
    console.groupEnd();
  }

  /**
   * Clear all logs (useful for starting fresh in a test)
   */
  clearLogs(): void {
    logger.clearLogs();
    logger.testLog('Logs cleared', {
      testRunId: this.testRunId,
      action: 'clear-logs',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Set log level for testing
   */
  setLogLevel(level: LogLevel): void {
    logger.setLogLevel(level);
    logger.testLog(`Log level set to ${LogLevel[level]}`, {
      testRunId: this.testRunId,
      action: 'set-log-level',
      newLevel: LogLevel[level],
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get current log level
   */
  getCurrentLogLevel(): LogLevel {
    return logger.getCurrentLogLevel();
  }

  /**
   * Check if we're in test mode
   */
  isTestMode(): boolean {
    return logger.isTestMode();
  }

  /**
   * Get test run ID
   */
  getTestRunId(): string {
    return this.testRunId;
  }

  /**
   * Get test start time
   */
  getTestStartTime(): Date {
    return this.testStartTime;
  }
}

/**
 * Create a new testing utilities instance
 */
export function createTestingUtils(testName?: string): TestingUtils {
  return new TestingUtils(testName);
}

/**
 * Global testing utilities instance for quick access
 */
export const testUtils = createTestingUtils('global-test');

/**
 * Convenience functions for quick testing
 */
export const getTestLogs = () => testUtils.getTestLogs();
export const getTestErrors = () => testUtils.getTestErrors();
export const getComponentLogs = (component: string) => testUtils.getComponentLogs(component);
export const getFunctionLogs = (functionName: string) => testUtils.getFunctionLogs(functionName);
export const printTestSummary = () => testUtils.printTestSummary();
export const clearTestLogs = () => testUtils.clearLogs();
export const exportTestLogs = () => testUtils.exportTestLogs();

/**
 * Test-specific logging functions
 */
export const logTestStart = (testName: string, context?: LogContext) => {
  logger.testLog(`Test started: ${testName}`, {
    testName,
    action: 'test-start',
    ...context
  });
};

export const logTestEnd = (testName: string, context?: LogContext) => {
  logger.testLog(`Test ended: ${testName}`, {
    testName,
    action: 'test-end',
    ...context
  });
};

export const logTestStep = (stepName: string, context?: LogContext) => {
  logger.testLog(`Test step: ${stepName}`, {
    stepName,
    action: 'test-step',
    ...context
  });
};

export const logTestAssertion = (assertion: string, passed: boolean, context?: LogContext) => {
  const level = passed ? LogLevel.INFO : LogLevel.ERROR;
  const message = `Test assertion: ${assertion} - ${passed ? 'PASSED' : 'FAILED'}`;
  
  if (passed) {
    logger.testLog(message, {
      assertion,
      passed,
      action: 'test-assertion',
      ...context
    });
  } else {
    logger.testError(message, {
      assertion,
      passed,
      action: 'test-assertion',
      ...context
    });
  }
};
