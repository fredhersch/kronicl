# Logging Guide for Troubleshooting

This guide explains how to use the comprehensive logging system to troubleshoot errors and debug issues during testing.

## Overview

The logging system provides:
- **Clear distinction** between info, warning, and error logging
- **Structured logging** with context and timestamps
- **Testing-specific features** for easier debugging
- **Configurable log levels** via environment variables
- **Memory-safe logging** with automatic cleanup

## Log Levels

The system uses 5 log levels (from lowest to highest priority):

1. **DEBUG** (0) - Detailed debugging information
2. **INFO** (1) - General information about application flow
3. **WARN** (2) - Warning messages for potential issues
4. **ERROR** (3) - Error messages for actual problems
5. **CRITICAL** (4) - Critical errors that may cause application failure

## Environment Configuration

Set log levels using environment variables:

```bash
# Set log level
NEXT_PUBLIC_LOG_LEVEL=DEBUG

# Enable test mode
NEXT_PUBLIC_TEST_MODE=true

# Enable debug mode
NEXT_PUBLIC_DEBUG_MODE=true
```

## Basic Usage

### Import the logger

```typescript
import { logger, logInfo, logError, logDebug, logWarn } from '@/lib/logger';
```

### Simple logging

```typescript
// Info logging
logInfo('User logged in successfully', { userId: '123' });

// Error logging
logError('Failed to fetch data', { endpoint: '/api/users' }, error);

// Debug logging
logDebug('Component state updated', { component: 'UserProfile', state: 'loading' });

// Warning logging
logWarn('API response was slow', { endpoint: '/api/data', responseTime: 5000 });
```

### Structured logging with context

```typescript
logger.info('Memory created successfully', {
  component: 'NewMemoryForm',
  function: 'handleSubmit',
  userId: user.uid,
  memoryId: newMemory.id,
  timestamp: new Date().toISOString()
});
```

## Testing Utilities

### Import testing utilities

```typescript
import { 
  createTestingUtils, 
  testUtils, 
  logTestStart, 
  logTestEnd,
  getTestLogs,
  getTestErrors 
} from '@/lib/testing-utils';
```

### Test-specific logging

```typescript
// Start a test
logTestStart('User Authentication Test', { testSuite: 'Auth' });

// Log test steps
logTestStep('User login attempt', { username: 'testuser' });

// Log assertions
logTestAssertion('User should be authenticated', true, { userId: '123' });

// End test
logTestEnd('User Authentication Test', { result: 'PASSED' });
```

### Accessing test logs

```typescript
// Get all logs since test started
const logs = getTestLogs();

// Get only error logs
const errors = getTestErrors();

// Get logs for specific component
const componentLogs = testUtils.getComponentLogs('Dashboard');

// Get logs for specific function
const functionLogs = testUtils.getFunctionLogs('handleSearch');

// Print test summary
testUtils.printTestSummary();

// Export logs as JSON
const jsonLogs = testUtils.exportTestLogs();
```

## Troubleshooting Examples

### 1. Debugging Component Lifecycle

```typescript
useEffect(() => {
  logger.info('Component mounted', {
    component: 'Dashboard',
    function: 'useEffect-mount',
    timestamp: new Date().toISOString()
  });

  return () => {
    logger.info('Component unmounting', {
      component: 'Dashboard',
      function: 'useEffect-cleanup',
      timestamp: new Date().toISOString()
    });
  };
}, []);
```

### 2. Debugging API Calls

```typescript
try {
  logInfo('Starting API call', {
    component: 'UserProfile',
    function: 'fetchUserData',
    endpoint: '/api/user',
    userId: user.id
  });

  const response = await fetch('/api/user');
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  
  logInfo('API call successful', {
    component: 'UserProfile',
    function: 'fetchUserData',
    responseStatus: response.status,
    dataSize: JSON.stringify(data).length
  });

  return data;
} catch (error) {
  logError('API call failed', {
    component: 'UserProfile',
    function: 'fetchUserData',
    endpoint: '/api/user',
    error: error instanceof Error ? error.message : 'Unknown error'
  }, error instanceof Error ? error : undefined);
  
  throw error;
}
```

### 3. Debugging State Changes

```typescript
const [memories, setMemories] = useState<Memory[]>([]);

const updateMemories = useCallback((newMemories: Memory[]) => {
  logDebug('Updating memories state', {
    component: 'Dashboard',
    function: 'updateMemories',
    previousCount: memories.length,
    newCount: newMemories.length,
    timestamp: new Date().toISOString()
  });

  setMemories(newMemories);
}, [memories]);
```

### 4. Debugging User Interactions

```typescript
const handleSearch = (query: string) => {
  logDebug('Search query received', {
    component: 'Dashboard',
    function: 'handleSearch',
    searchQuery: query,
    queryLength: query.length,
    currentMemoryCount: memories.length
  });

  // ... search logic ...

  logInfo('Search completed', {
    component: 'Dashboard',
    function: 'handleSearch',
    searchQuery: query,
    resultsCount: filteredMemories.length
  });
};
```

## Console Output

The logger formats messages clearly in the console:

```
[14:30:25] INFO     Dashboard component mounted [{"component":"Dashboard","function":"useEffect-mount","timestamp":"2024-01-15T14:30:25.123Z"}]
[14:30:26] DEBUG    Auth state changed [{"component":"Dashboard","function":"useEffect-auth","loading":false,"hasUser":true,"userId":"user123"}]
[14:30:27] ERROR    Firestore snapshot error [{"component":"Dashboard","function":"onSnapshot-error","userId":"user123","error":"Permission denied","errorCode":"permission-denied"}]
```

## Best Practices

### 1. Use appropriate log levels
- **DEBUG**: Detailed technical information
- **INFO**: General flow and successful operations
- **WARN**: Potential issues that don't break functionality
- **ERROR**: Actual errors that affect functionality
- **CRITICAL**: Errors that may cause application failure

### 2. Include relevant context
```typescript
// Good
logError('Failed to save memory', {
  component: 'NewMemoryForm',
  function: 'handleSubmit',
  userId: user.uid,
  memoryData: { title: memory.title, hasAudio: !!memory.audio }
}, error);

// Avoid
logError('Failed to save memory', {}, error);
```

### 3. Use consistent naming
- Use `component` and `function` fields consistently
- Use descriptive function names in context
- Include relevant IDs (userId, memoryId, etc.)

### 4. Handle errors gracefully
```typescript
try {
  // ... operation ...
} catch (error) {
  logError('Operation failed', context, error);
  
  // Provide fallback behavior
  setError('Operation failed, please try again');
}
```

## Testing Scenarios

### 1. Component Testing
```typescript
import { render, screen } from '@testing-library/react';
import { testUtils, logTestStart, logTestEnd } from '@/lib/testing-utils';

test('Dashboard renders correctly', () => {
  logTestStart('Dashboard Render Test');
  
  // Clear previous logs
  testUtils.clearLogs();
  
  render(<Dashboard />);
  
  // Check for expected logs
  const logs = testUtils.getComponentLogs('Dashboard');
  expect(logs.length).toBeGreaterThan(0);
  
  logTestEnd('Dashboard Render Test');
});
```

### 2. Error Testing
```typescript
test('Handles API errors gracefully', async () => {
  logTestStart('API Error Handling Test');
  
  // Mock failed API call
  server.use(
    rest.get('/api/memories', (req, res, ctx) => {
      return res(ctx.status(500));
    })
  );
  
  render(<Dashboard />);
  
  // Wait for error to occur
  await waitFor(() => {
    const errors = testUtils.getTestErrors();
    expect(errors.length).toBeGreaterThan(0);
  });
  
  logTestEnd('API Error Handling Test');
});
```

### 3. Performance Testing
```typescript
test('Component performance', () => {
  logTestStart('Performance Test');
  
  const startTime = performance.now();
  render(<Dashboard />);
  const endTime = performance.now();
  
  const renderTime = endTime - startTime;
  logTestStep('Component render time', { renderTimeMs: renderTime });
  
  expect(renderTime).toBeLessThan(100); // Should render in under 100ms
  
  logTestEnd('Performance Test');
});
```

## Debugging in Production

For production debugging, you can:

1. **Enable debug mode** via URL parameter: `?debug=true`
2. **Set log level** via environment variable: `NEXT_PUBLIC_LOG_LEVEL=DEBUG`
3. **Access logs** via browser console
4. **Export logs** for analysis: `testUtils.exportTestLogs()`
5. **View logs via web interface** at `/logs`
6. **Access logs via API** at `/api/logs`

## URL Endpoint for Logs

The logging system provides a REST API endpoint for accessing logs programmatically or via HTTP requests.

### API Endpoint: `/api/logs`

#### GET `/api/logs` - Retrieve Logs

**Query Parameters:**
- `level` - Filter by log level (0-4)
- `component` - Filter by component name
- `function` - Filter by function name
- `search` - Search in messages and context
- `limit` - Limit number of results (50, 100, 500, 1000)
- `format` - Response format (json, csv, text)
- `clear` - Clear all logs (true/false)

**Examples:**
```bash
# Get all logs
GET /api/logs

# Get only error logs
GET /api/logs?level=3

# Get logs for specific component
GET /api/logs?component=Dashboard

# Search for specific text
GET /api/logs?search=authentication

# Get last 100 logs in CSV format
GET /api/logs?limit=100&format=csv

# Get logs and clear them
GET /api/logs?clear=true
```

#### DELETE `/api/logs` - Clear All Logs

Clears all stored logs and returns success message.

#### POST `/api/logs` - Create Log Entry

Creates a new log entry programmatically.

**Request Body:**
```json
{
  "level": 1,
  "message": "Custom log message",
  "context": {
    "component": "CustomComponent",
    "function": "customFunction",
    "userId": "user123"
  }
}
```

### Web Interface: `/logs`

A user-friendly web interface is available at `/logs` that provides:
- **Real-time log viewing** with automatic refresh
- **Advanced filtering** by level, component, function, and text
- **Multiple export formats** (JSON, CSV, Text)
- **Log management** (clear all logs)
- **Responsive design** for mobile and desktop

### Integration Examples

#### cURL Examples
```bash
# Get all logs
curl http://localhost:3000/api/logs

# Get error logs only
curl "http://localhost:3000/api/logs?level=3"

# Export logs as CSV
curl "http://localhost:3000/api/logs?format=csv" -o logs.csv

# Clear all logs
curl -X DELETE http://localhost:3000/api/logs
```

#### JavaScript/Fetch Examples
```typescript
// Get filtered logs
const response = await fetch('/api/logs?level=3&component=Dashboard');
const logs = await response.json();

// Clear all logs
await fetch('/api/logs', { method: 'DELETE' });

// Create custom log entry
await fetch('/api/logs', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    level: 1,
    message: 'Custom log message',
    context: { component: 'TestComponent' }
  })
});
```

#### Testing Integration
```typescript
// In your tests, you can verify logs via API
test('Logs are created correctly', async () => {
  // Perform some action that generates logs
  
  // Check logs via API
  const response = await fetch('/api/logs');
  const data = await response.json();
  
  expect(data.logs.length).toBeGreaterThan(0);
  expect(data.logs.some(log => log.context.component === 'Dashboard')).toBe(true);
});
```

## Memory Management

The logger automatically manages memory by:
- Limiting stored logs to 1000 entries
- Automatically removing oldest logs when limit is reached
- Providing `clearLogs()` method for manual cleanup

This prevents memory leaks during long testing sessions.
