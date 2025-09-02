/**
 * Example test file demonstrating the logging system
 * This shows how to use logging for troubleshooting during testing
 */

import { render, screen, waitFor } from '@testing-library/react';
import { testUtils, logTestStart, logTestEnd, logTestStep, logTestAssertion } from '../testing-utils';
import { logger, logInfo, logError, logDebug } from '../logger';

// Example component for testing
const TestComponent = () => {
  logInfo('TestComponent rendered', {
    component: 'TestComponent',
    function: 'render',
    timestamp: new Date().toISOString()
  });

  return <div data-testid="test-component">Test Component</div>;
};

describe('Logging System Tests', () => {
  beforeEach(() => {
    // Clear logs before each test for clean state
    testUtils.clearLogs();
    logTestStart('Logging System Test Suite');
  });

  afterEach(() => {
    logTestEnd('Logging System Test Suite');
  });

  test('Component logging works correctly', () => {
    logTestStep('Testing component logging');
    
    render(<TestComponent />);
    
    // Verify component rendered
    expect(screen.getByTestId('test-component')).toBeInTheDocument();
    
    // Check that logs were created
    const logs = testUtils.getComponentLogs('TestComponent');
    logTestAssertion('Component should generate logs', logs.length > 0, {
      logCount: logs.length,
      component: 'TestComponent'
    });
    
    expect(logs.length).toBeGreaterThan(0);
    
    // Verify log content
    const renderLog = logs.find(log => log.context.function === 'render');
    logTestAssertion('Render log should exist', !!renderLog, {
      foundRenderLog: !!renderLog,
      availableFunctions: logs.map(l => l.context.function)
    });
    
    expect(renderLog).toBeDefined();
    expect(renderLog?.message).toBe('TestComponent rendered');
  });

  test('Error logging captures errors correctly', () => {
    logTestStep('Testing error logging');
    
    const testError = new Error('Test error message');
    
    logError('Test error occurred', {
      component: 'TestComponent',
      function: 'testError',
      testId: 'error-test-1'
    }, testError);
    
    // Get error logs
    const errors = testUtils.getTestErrors();
    logTestAssertion('Error should be logged', errors.length > 0, {
      errorCount: errors.length,
      testId: 'error-test-1'
    });
    
    expect(errors.length).toBeGreaterThan(0);
    
    // Verify error log content
    const errorLog = errors[0];
    expect(errorLog.message).toBe('Test error occurred');
    expect(errorLog.context.testId).toBe('error-test-1');
    expect(errorLog.stack).toBe(testError.stack);
  });

  test('Log levels work correctly', () => {
    logTestStep('Testing log levels');
    
    // Test different log levels
    logDebug('Debug message', { level: 'DEBUG' });
    logInfo('Info message', { level: 'INFO' });
    logger.warn('Warning message', { level: 'WARN' });
    logError('Error message', { level: 'ERROR' });
    
    const logs = testUtils.getTestLogs();
    
    // Verify all levels are present
    const levels = logs.map(log => log.level);
    logTestAssertion('All log levels should be present', 
      levels.includes(0) && levels.includes(1) && levels.includes(2) && levels.includes(3), {
        presentLevels: levels,
        expectedLevels: [0, 1, 2, 3]
      });
    
    expect(levels).toContain(0); // DEBUG
    expect(levels).toContain(1); // INFO
    expect(levels).toContain(2); // WARN
    expect(levels).toContain(3); // ERROR
  });

  test('Context logging provides structured data', () => {
    logTestStep('Testing context logging');
    
    const testContext = {
      component: 'TestComponent',
      function: 'testContext',
      userId: 'user123',
      sessionId: 'session456',
      testData: { key: 'value', number: 42 }
    };
    
    logInfo('Context test message', testContext);
    
    const logs = testUtils.getTestLogs();
    const contextLog = logs.find(log => log.context.function === 'testContext');
    
    logTestAssertion('Context log should exist', !!contextLog, {
      foundContextLog: !!contextLog,
      availableFunctions: logs.map(l => l.context.function)
    });
    
    expect(contextLog).toBeDefined();
    
    // Verify all context fields are present
    Object.keys(testContext).forEach(key => {
      expect(contextLog?.context[key]).toEqual(testContext[key as keyof typeof testContext]);
    });
  });

  test('Test utilities provide filtered access to logs', () => {
    logTestStep('Testing log filtering utilities');
    
    // Generate logs for different components and functions
    logInfo('Component A message', { component: 'ComponentA', function: 'func1' });
    logInfo('Component A message 2', { component: 'ComponentA', function: 'func2' });
    logInfo('Component B message', { component: 'ComponentB', function: 'func1' });
    
    // Test component filtering
    const componentALogs = testUtils.getComponentLogs('ComponentA');
    expect(componentALogs).toHaveLength(2);
    
    // Test function filtering
    const func1Logs = testUtils.getFunctionLogs('func1');
    expect(func1Logs).toHaveLength(2);
    
    // Test text search
    const componentBLogs = testUtils.getLogsContaining('ComponentB');
    expect(componentBLogs).toHaveLength(1);
    
    logTestAssertion('Log filtering works correctly', true, {
      componentACount: componentALogs.length,
      func1Count: func1Logs.length,
      componentBCount: componentBLogs.length
    });
  });

  test('Performance logging works', async () => {
    logTestStep('Testing performance logging');
    
    const startTime = performance.now();
    
    // Simulate some work
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    logInfo('Performance test completed', {
      component: 'TestComponent',
      function: 'performanceTest',
      durationMs: duration,
      startTime: startTime,
      endTime: endTime
    });
    
    const logs = testUtils.getTestLogs();
    const perfLog = logs.find(log => log.context.function === 'performanceTest');
    
    logTestAssertion('Performance log should exist', !!perfLog, {
      foundPerfLog: !!perfLog,
      duration: duration
    });
    
    expect(perfLog).toBeDefined();
    expect(perfLog?.context.durationMs).toBeGreaterThan(0);
    
    // Verify performance is reasonable
    expect(duration).toBeLessThan(100); // Should complete in under 100ms
  });

  test('Log export functionality works', () => {
    logTestStep('Testing log export');
    
    // Generate some test logs
    logInfo('Export test message 1', { testId: 'export-1' });
    logInfo('Export test message 2', { testId: 'export-2' });
    
    const exportedLogs = testUtils.exportTestLogs();
    const parsedLogs = JSON.parse(exportedLogs);
    
    logTestAssertion('Logs should export correctly', !!parsedLogs, {
      exportSuccess: !!parsedLogs,
      exportedLogCount: parsedLogs.logs?.length || 0
    });
    
    expect(parsedLogs).toHaveProperty('testRunId');
    expect(parsedLogs).toHaveProperty('testStartTime');
    expect(parsedLogs).toHaveProperty('totalLogs');
    expect(parsedLogs).toHaveProperty('logs');
    expect(parsedLogs.logs.length).toBeGreaterThan(0);
  });

  test('Test summary provides clear overview', () => {
    logTestStep('Testing test summary');
    
    // Generate logs of different levels
    logDebug('Debug message for summary', { summary: 'test' });
    logInfo('Info message for summary', { summary: 'test' });
    logger.warn('Warning message for summary', { summary: 'test' });
    logError('Error message for summary', { summary: 'test' });
    
    // Capture console output to verify summary
    const consoleSpy = jest.spyOn(console, 'group').mockImplementation();
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    
    testUtils.printTestSummary();
    
    // Verify summary was printed
    expect(consoleSpy).toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalled();
    
    // Clean up
    consoleSpy.mockRestore();
    consoleLogSpy.mockRestore();
    
    logTestAssertion('Test summary should be printed', true, {
      summaryPrinted: true
    });
  });
});

// Example of testing error scenarios
describe('Error Handling Tests', () => {
  beforeEach(() => {
    testUtils.clearLogs();
  });

  test('Handles undefined errors gracefully', () => {
    logTestStep('Testing undefined error handling');
    
    // Test logging with undefined error
    logError('Undefined error test', {
      component: 'TestComponent',
      function: 'undefinedErrorTest'
    }, undefined);
    
    const errors = testUtils.getTestErrors();
    expect(errors.length).toBeGreaterThan(0);
    
    const errorLog = errors[0];
    expect(errorLog.message).toBe('Undefined error test');
    expect(errorLog.stack).toBeUndefined();
    
    logTestAssertion('Undefined error handled gracefully', true, {
      errorLogged: true,
      stackUndefined: !errorLog.stack
    });
  });

  test('Handles string errors gracefully', () => {
    logTestStep('Testing string error handling');
    
    // Test logging with string error
    logError('String error test', {
      component: 'TestComponent',
      function: 'stringErrorTest'
    }, 'String error message' as any);
    
    const errors = testUtils.getTestErrors();
    expect(errors.length).toBeGreaterThan(0);
    
    const errorLog = errors[0];
    expect(errorLog.message).toBe('String error test');
    
    logTestAssertion('String error handled gracefully', true, {
      errorLogged: true
    });
  });
});
