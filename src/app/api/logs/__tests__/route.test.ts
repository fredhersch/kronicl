/**
 * Tests for the logs API endpoint
 * This ensures the logging system works correctly via HTTP requests
 */

import { NextRequest } from 'next/server';
import { GET, POST, DELETE } from '../route';
import { logger, LogLevel } from '@/lib/logger';

// Mock the logger
jest.mock('@/lib/logger', () => ({
  logger: {
    getLogs: jest.fn(),
    clearLogs: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    critical: jest.fn(),
  },
  LogLevel: {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    CRITICAL: 4,
  },
}));

const mockLogger = logger as jest.Mocked<typeof logger>;

describe('Logs API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock logger.getLogs to return test data
    mockLogger.getLogs.mockReturnValue([
      {
        level: LogLevel.INFO,
        message: 'Test log message',
        context: { component: 'TestComponent', function: 'testFunction' },
        timestamp: '2024-01-15T10:00:00.000Z'
      },
      {
        level: LogLevel.ERROR,
        message: 'Test error message',
        context: { component: 'TestComponent', function: 'testError' },
        timestamp: '2024-01-15T10:01:00.000Z',
        stack: 'Error: Test error\n    at testFunction'
      }
    ]);
  });

  describe('GET /api/logs', () => {
    it('should return all logs in JSON format by default', async () => {
      const request = new NextRequest('http://localhost:3000/api/logs');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('logs');
      expect(data.logs).toHaveLength(2);
      expect(data.totalLogs).toBe(2);
      expect(data.filters.level).toBe('all');
    });

    it('should filter logs by level', async () => {
      const request = new NextRequest('http://localhost:3000/api/logs?level=3');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.logs).toHaveLength(1);
      expect(data.logs[0].level).toBe(LogLevel.ERROR);
      expect(data.filters.level).toBe('ERROR');
    });

    it('should filter logs by component', async () => {
      const request = new NextRequest('http://localhost:3000/api/logs?component=TestComponent');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.logs).toHaveLength(2);
      expect(data.filters.component).toBe('TestComponent');
    });

    it('should filter logs by function', async () => {
      const request = new NextRequest('http://localhost:3000/api/logs?function=testFunction');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.logs).toHaveLength(1);
      expect(data.logs[0].context.function).toBe('testFunction');
      expect(data.filters.function).toBe('testFunction');
    });

    it('should search logs by text', async () => {
      const request = new NextRequest('http://localhost:3000/api/logs?search=error');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.logs).toHaveLength(1);
      expect(data.logs[0].message).toContain('error');
      expect(data.filters.search).toBe('error');
    });

    it('should limit results', async () => {
      const request = new NextRequest('http://localhost:3000/api/logs?limit=1');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.logs).toHaveLength(1);
      expect(data.filters.limit).toBe('1');
    });

    it('should return logs in text format', async () => {
      const request = new NextRequest('http://localhost:3000/api/logs?format=text');
      const response = await GET(request);
      const text = await response.text();

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toContain('text/plain');
      expect(text).toContain('Test log message');
      expect(text).toContain('Test error message');
    });

    it('should return logs in CSV format', async () => {
      const request = new NextRequest('http://localhost:3000/api/logs?format=csv');
      const response = await GET(request);
      const csv = await response.text();

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toContain('text/csv');
      expect(response.headers.get('Content-Disposition')).toContain('attachment');
      expect(csv).toContain('Timestamp,Level,Message,Component,Function,UserId,Context');
      expect(csv).toContain('Test log message');
    });

    it('should clear logs when clear=true', async () => {
      const request = new NextRequest('http://localhost:3000/api/logs?clear=true');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockLogger.clearLogs).toHaveBeenCalled();
    });

    it('should handle invalid level parameter gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/logs?level=invalid');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.logs).toHaveLength(2); // Should return all logs
    });

    it('should handle invalid limit parameter gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/logs?limit=invalid');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.logs).toHaveLength(2); // Should return all logs
    });
  });

  describe('DELETE /api/logs', () => {
    it('should clear all logs', async () => {
      const request = new NextRequest('http://localhost:3000/api/logs', {
        method: 'DELETE'
      });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockLogger.clearLogs).toHaveBeenCalled();
      expect(data.message).toBe('All logs cleared successfully');
    });
  });

  describe('POST /api/logs', () => {
    it('should create a log entry with specified level', async () => {
      const request = new NextRequest('http://localhost:3000/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: LogLevel.WARN,
          message: 'Custom warning message',
          context: { component: 'CustomComponent' }
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Custom warning message',
        { component: 'CustomComponent' }
      );
      expect(data.message).toBe('Log entry created successfully');
    });

    it('should create a log entry with default INFO level when no level specified', async () => {
      const request = new NextRequest('http://localhost:3000/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Custom info message',
          context: { component: 'CustomComponent' }
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Custom info message',
        { component: 'CustomComponent' }
      );
    });

    it('should handle missing message field', async () => {
      const request = new NextRequest('http://localhost:3000/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: LogLevel.INFO,
          context: { component: 'CustomComponent' }
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Message is required');
    });

    it('should handle invalid level gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 999, // Invalid level
          message: 'Custom message',
          context: { component: 'CustomComponent' }
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      // Should default to INFO level
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Custom message',
        { component: 'CustomComponent' }
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle logger errors gracefully', async () => {
      // Mock logger.getLogs to throw an error
      mockLogger.getLogs.mockImplementation(() => {
        throw new Error('Logger error');
      });

      const request = new NextRequest('http://localhost:3000/api/logs');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to retrieve logs');
      expect(data.message).toBe('Logger error');
    });

    it('should handle logger.clearLogs errors gracefully', async () => {
      // Mock logger.clearLogs to throw an error
      mockLogger.clearLogs.mockImplementation(() => {
        throw new Error('Clear logs error');
      });

      const request = new NextRequest('http://localhost:3000/api/logs', {
        method: 'DELETE'
      });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to clear logs');
      expect(data.message).toBe('Clear logs error');
    });
  });
});
