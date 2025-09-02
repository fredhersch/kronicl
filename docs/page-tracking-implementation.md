# Page Tracking Implementation for File Uploads

This document details the comprehensive page tracking system implemented to monitor file uploads, memory creation, and user interactions throughout the application.

## Overview

The page tracking system now provides complete visibility into:
- **Page navigation** and user flow
- **File upload processes** with page context
- **Audio recording sessions** with page tracking
- **Form submissions** and validation
- **AI processing** with page context
- **Error handling** with page-specific information

## Components with Page Tracking

### 1. New Memory Page (`/memories/new`)

#### Page Load Tracking
```typescript
useEffect(() => {
  if (user) {
    logPageEvent('New Memory Page Loaded', {
      userId: user.uid,
      pagePath: '/memories/new',
      pageTitle: 'Create New Memory',
      userEmail: user.email
    });
  }
}, [user, logPageEvent]);
```

#### Navigation Context
- **Current Path**: `/memories/new`
- **Previous Path**: Tracked from navigation history
- **Session ID**: Unique identifier for user session
- **User Context**: User ID and email for debugging

### 2. New Memory Form Component

#### Form Submission Tracking
```typescript
// Log form submission start with page context
logInfo('Memory form submission started', {
  component: 'NewMemoryForm',
  function: 'onSubmit',
  action: 'submission-start',
  userId: userId,
  pageContext: {
    currentPath: pageInfo.currentPath,
    previousPath: pageInfo.previousPath,
    searchParams: pageInfo.searchParams,
    sessionId: pageInfo.sessionId
  },
  mediaFileCount: mediaFiles.length,
  hasAudioBlob: !!audioBlob,
  // ... form data
});

// Log page event for form submission
logPageEvent('Memory Form Submission Started', {
  userId: userId,
  formData: {
    title: data.title,
    mediaFileCount: mediaFiles.length,
    hasAudioBlob: !!audioBlob,
    location: data.location
  },
  pagePath: pageInfo.currentPath
});
```

#### File Upload Tracking
```typescript
// Log upload preparation with page context
logInfo('Preparing file uploads', {
  component: 'NewMemoryForm',
  function: 'onSubmit',
  action: 'upload-preparation',
  userId: userId,
  pageContext: {
    currentPath: pageInfo.currentPath,
    sessionId: pageInfo.sessionId
  },
  mediaFiles: mediaFiles.map(file => ({
    name: file.name,
    size: file.size,
    type: file.type
  })),
  audioBlobSize: audioBlob?.size || 0,
  timestamp: new Date().toISOString()
});

// Log page event for file upload preparation
logPageEvent('File Upload Preparation Started', {
  userId: userId,
  fileCount: mediaFiles.length,
  totalFileSize: mediaFiles.reduce((total, file) => total + file.size, 0),
  hasAudio: !!audioBlob,
  pagePath: pageInfo.currentPath
});
```

#### Individual File Upload Tracking
```typescript
// Log individual file upload start with page context
logDebug('Starting individual file upload', {
  component: 'NewMemoryForm',
  function: 'onSubmit',
  action: 'individual-upload-start',
  userId: userId,
  pageContext: {
    currentPath: pageInfo.currentPath,
    sessionId: pageInfo.sessionId
  },
  fileIndex: index + 1,
  totalFiles: mediaFiles.length,
  fileName: file.name,
  fileId: fileId,
  storagePath: `memories/${userId}/${fileName}`,
  timestamp: new Date().toISOString()
});

// Log page event for individual file upload
logPageEvent('Individual File Upload Started', {
  userId: userId,
  fileIndex: index + 1,
  fileName: file.name,
  fileSize: file.size,
  fileType: file.type,
  pagePath: pageInfo.currentPath
});
```

### 3. File Selection & Validation Tracking

#### Media File Selection
```typescript
// Log file selection with page context
logInfo('Media files selected', {
  component: 'NewMemoryForm',
  function: 'addMediaFiles',
  action: 'files-selected',
  userId: userId,
  pageContext: {
    currentPath: pageInfo.currentPath,
    sessionId: pageInfo.sessionId
  },
  newFilesCount: newFiles.length,
  newFiles: newFiles.map(file => ({
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: new Date(file.lastModified).toISOString()
  })),
  existingFilesCount: mediaFiles.length,
  timestamp: new Date().toISOString()
});

// Log page event for file selection
logPageEvent('Media Files Selected', {
  userId: userId,
  newFilesCount: newFiles.length,
  totalFilesAfter: mediaFiles.length + newFiles.length,
  fileTypes: newFiles.map(f => f.type),
  totalSize: newFiles.reduce((total, file) => total + file.size, 0),
  pagePath: pageInfo.currentPath
});
```

#### File Input Changes
```typescript
// Log file input change with page context
logDebug('File input changed', {
  component: 'NewMemoryForm',
  function: 'handleFileChange',
  action: 'input-change',
  userId: userId,
  pageContext: {
    currentPath: pageInfo.currentPath,
    sessionId: pageInfo.sessionId
  },
  filesSelected: files.length,
  files: files.map(file => ({
    name: file.name,
    size: file.size,
    type: file.type
  })),
  timestamp: new Date().toISOString()
});

// Log page event for file input change
logPageEvent('File Input Changed', {
  userId: userId,
  filesSelected: files.length,
  fileNames: files.map(f => f.name),
  totalSize: files.reduce((total, file) => total + file.size, 0),
  pagePath: pageInfo.currentPath
});
```

### 4. Audio Recording Tracking

#### Recording Start
```typescript
// Log recording start attempt with page context
logInfo('Audio recording started', {
  component: 'NewMemoryForm',
  function: 'startRecording',
  action: 'recording-start',
  userId: userId,
  pageContext: {
    currentPath: pageInfo.currentPath,
    sessionId: pageInfo.sessionId
  },
  timestamp: new Date().toISOString()
});

// Log page event for recording start
logPageEvent('Audio Recording Started', {
  userId: userId,
  pagePath: pageInfo.currentPath,
  timestamp: new Date().toISOString()
});
```

#### Recording Stop
```typescript
// Log recording stop request with page context
logInfo('Recording stop requested', {
  component: 'NewMemoryForm',
  function: 'stopRecording',
  action: 'stop-requested',
  userId: userId,
  pageContext: {
    currentPath: pageInfo.currentPath,
    sessionId: pageInfo.sessionId
  },
  recordingTime: recordingTime,
  mediaRecorderState: mediaRecorderRef.current.state,
  timestamp: new Date().toISOString()
});

// Log page event for recording stop
logPageEvent('Audio Recording Stopped', {
  userId: userId,
  recordingTime,
  pagePath: pageInfo.currentPath,
  timestamp: new Date().toISOString()
});
```

### 5. Navigation & Success Tracking

#### Successful Memory Creation
```typescript
// Log navigation with page context
logInfo('Navigating to dashboard after successful memory creation', {
  component: 'NewMemoryForm',
  function: 'onSubmit',
  action: 'navigation-success',
  userId: userId,
  memoryId: memoryDoc.id,
  pageContext: {
    currentPath: pageInfo.currentPath,
    sessionId: pageInfo.sessionId
  },
  fromPath: '/memories/new',
  toPath: '/',
  timestamp: new Date().toISOString()
});

// Log page event for navigation
logPageEvent('Memory Creation Success - Navigating to Dashboard', {
  userId: userId,
  memoryId: memoryDoc.id,
  fromPath: pageInfo.currentPath,
  toPath: '/',
  mediaCount: mediaItems.length,
  hasAudio: !!audioUrl
});
```

## Page Context Information

### Session Tracking
- **Session ID**: Unique identifier for user session
- **Current Path**: Current page being accessed
- **Previous Path**: Previous page in navigation history
- **Search Parameters**: URL query parameters
- **Timestamp**: When the event occurred

### User Context
- **User ID**: Firebase user identifier
- **User Email**: User's email address
- **Page Title**: Human-readable page name
- **Component**: React component name
- **Function**: Function or method name

## Log Analysis Examples

### Track User Journey Through File Upload
```typescript
// Get all page events for a specific user
const userPageEvents = testUtils.getLogsContaining('page');
const userJourney = userPageEvents
  .filter(log => log.context.userId === 'specific-user-id')
  .map(log => ({
    event: log.message,
    timestamp: log.timestamp,
    pagePath: log.context.pagePath,
    additionalData: log.context
  }));

console.log('User Journey:', userJourney);
```

### Monitor File Upload Success Rates
```typescript
// Get upload-related logs
const uploadLogs = testUtils.getLogsContaining('upload');
const uploadStats = uploadLogs.reduce((stats, log) => {
  const action = log.context.action;
  if (action === 'upload-start') stats.started++;
  if (action === 'upload-completed') stats.completed++;
  if (action === 'upload-failed') stats.failed++;
  return stats;
}, { started: 0, completed: 0, failed: 0 });

console.log('Upload Success Rate:', (uploadStats.completed / uploadStats.started) * 100 + '%');
```

### Analyze Page Performance
```typescript
// Get page load and navigation logs
const pageLogs = testUtils.getLogsContaining('page');
const pagePerformance = pageLogs.reduce((perf, log) => {
  const pagePath = log.context.pagePath;
  if (!perf[pagePath]) perf[pagePath] = { loads: 0, errors: 0 };
  
  if (log.message.includes('Loaded')) perf[pagePath].loads++;
  if (log.message.includes('Error')) perf[pagePath].errors++;
  
  return perf;
}, {});

console.log('Page Performance:', pagePerformance);
```

## Quick Filter Buttons

The logs page now includes quick filter buttons for common log types:

- **Page Logs**: Filter for page navigation and user interaction logs
- **Upload Logs**: Filter for file upload and processing logs
- **Recording Logs**: Filter for audio recording and AI processing logs

## Benefits of Page Tracking

### 1. **Complete User Journey Visibility**
- Track user navigation from page to page
- Monitor time spent on each page
- Identify user flow patterns and bottlenecks

### 2. **Enhanced Debugging**
- Page context for all file upload operations
- Session tracking for user-specific issues
- Navigation history for reproducing bugs

### 3. **Performance Monitoring**
- Page load times and user interaction metrics
- File upload success rates by page
- Audio processing performance tracking

### 4. **User Experience Analysis**
- Identify where users encounter issues
- Track completion rates for memory creation
- Monitor file upload abandonment patterns

### 5. **Error Correlation**
- Connect errors to specific pages and user sessions
- Track error patterns across different user flows
- Correlate AI service failures with page context

## Testing the Page Tracking

### 1. **Navigate to New Memory Page**
- Check logs for "New Memory Page Loaded" event
- Verify page context includes correct path and user info

### 2. **Select Files**
- Check logs for "Media Files Selected" and "File Input Changed" events
- Verify page context is included in all logs

### 3. **Start Audio Recording**
- Check logs for "Audio Recording Started" event
- Verify page context and user information

### 4. **Submit Form**
- Check logs for "Memory Form Submission Started" event
- Verify file upload tracking includes page context
- Check navigation logs after successful creation

### 5. **View Logs**
- Use quick filter buttons to see different log types
- Filter by component "NewMemoryForm" to see form-specific logs
- Search for "page" to see all page-related events

This comprehensive page tracking system provides complete visibility into the file upload process, making it easy to debug issues, monitor performance, and understand user behavior throughout the memory creation workflow.
