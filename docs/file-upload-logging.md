# File Upload Component Logging Guide

This document details the comprehensive logging system implemented in the file upload component (`NewMemoryForm`) to track all client-server interactions during file uploads.

## Overview

The file upload component now includes detailed logging for:
- **File Selection & Validation**
- **Upload Process & Progress**
- **Audio Recording & Processing**
- **AI Content Generation**
- **Database Operations**
- **Error Handling & Recovery**

## Logging Categories

### 1. File Selection & Validation

#### File Input Change
```typescript
logDebug('File input changed', {
  component: 'NewMemoryForm',
  function: 'handleFileChange',
  action: 'input-change',
  userId: userId,
  filesSelected: files.length,
  files: files.map(file => ({
    name: file.name,
    size: file.size,
    type: file.type
  })),
  timestamp: new Date().toISOString()
});
```

#### File Validation
```typescript
logDebug('Validating file selection', {
  component: 'NewMemoryForm',
  function: 'addMediaFiles',
  action: 'validation-check',
  userId: userId,
  totalFiles: combinedFiles.length,
  imageCount,
  videoCount,
  isValid: !(videoCount > 1 || (videoCount > 0 && imageCount > 0) || imageCount > 3),
  timestamp: new Date().toISOString()
});
```

#### Validation Failures
```typescript
logWarn('Invalid file selection', {
  component: 'NewMemoryForm',
  function: 'addMediaFiles',
  action: 'validation-failed',
  userId: userId,
  imageCount,
  videoCount,
  reason: videoCount > 1 ? 'too-many-videos' : 
          (videoCount > 0 && imageCount > 0) ? 'mixed-media-types' : 
          'too-many-images',
  timestamp: new Date().toISOString()
});
```

### 2. File Upload Process

#### Upload Initiation
```typescript
logInfo('File upload initiated', {
  component: 'NewMemoryForm',
  function: 'uploadFile',
  action: 'upload-start',
  fileName: file.name,
  fileSize: file.size,
  fileType: file.type,
  filePath: path,
  userId: userId,
  timestamp: new Date().toISOString()
});
```

#### Upload Task Creation
```typescript
logDebug('Upload task created', {
  component: 'NewMemoryForm',
  function: 'uploadFile',
  action: 'task-created',
  fileName: file.name,
  storagePath: path,
  uploadTaskId: uploadTask.snapshot?.ref?.name || 'unknown',
  timestamp: new Date().toISOString()
});
```

#### Progress Updates
```typescript
logDebug('Upload progress update', {
  component: 'NewMemoryForm',
  function: 'uploadFile',
  action: 'progress-update',
  fileName: file.name,
  progress: Math.round(progress),
  bytesTransferred,
  totalBytes,
  state,
  uploadTaskId: snapshot.ref.name,
  timestamp: new Date().toISOString()
});
```

#### Upload Completion
```typescript
logInfo('File upload completed successfully', {
  component: 'NewMemoryForm',
  function: 'uploadFile',
  action: 'upload-completed',
  fileName: file.name,
  filePath: path,
  uploadTaskId: uploadTask.snapshot.ref.name,
  finalBytesTransferred: uploadTask.snapshot.bytesTransferred,
  totalBytes: uploadTask.snapshot.totalBytes,
  userId: userId,
  timestamp: new Date().toISOString()
});
```

### 3. Audio Recording & Processing

#### Recording Start
```typescript
logInfo('Audio recording started', {
  component: 'NewMemoryForm',
  function: 'startRecording',
  action: 'recording-start',
  userId: userId,
  timestamp: new Date().toISOString()
});
```

#### Microphone Access
```typescript
logDebug('Microphone access granted', {
  component: 'NewMemoryForm',
  function: 'startRecording',
  action: 'microphone-access',
  userId: userId,
  streamActive: stream.active,
  trackCount: stream.getTracks().length,
  timestamp: new Date().toISOString()
});
```

#### Audio Data Collection
```typescript
logDebug('Audio data available', {
  component: 'NewMemoryForm',
  function: 'startRecording',
  action: 'data-available',
  userId: userId,
  dataSize: event.data.size,
  chunksCount: chunks.length,
  timestamp: new Date().toISOString()
});
```

#### Recording Stop
```typescript
logInfo('Audio recording stopped', {
  component: 'NewMemoryForm',
  function: 'startRecording',
  action: 'recording-stop',
  userId: userId,
  totalChunks: chunks.length,
  recordingTime: recordingTime,
  timestamp: new Date().toISOString()
});
```

#### AI Processing Start
```typescript
logInfo('AI processing started for audio', {
  component: 'NewMemoryForm',
  function: 'startRecording',
  action: 'ai-processing-start',
  userId: userId,
  audioBlobSize: blob.size,
  timestamp: new Date().toISOString()
});
```

#### Transcription Success
```typescript
logInfo('Audio transcription completed', {
  component: 'NewMemoryForm',
  function: 'startRecording',
  action: 'transcription-completed',
  userId: userId,
  transcriptionLength: transcription.length,
  timestamp: new Date().toISOString()
});
```

#### AI Content Generation
```typescript
logInfo('AI content generation completed', {
  component: 'NewMemoryForm',
  function: 'startRecording',
  action: 'ai-generation-completed',
  userId: userId,
  generatedTitle: title,
  generatedSummary: summary,
  generatedTags: tags,
  generatedSentiment: sentiment,
  timestamp: new Date().toISOString()
});
```

### 4. Form Submission & Database Operations

#### Submission Start
```typescript
logInfo('Memory form submission started', {
  component: 'NewMemoryForm',
  function: 'onSubmit',
  action: 'submission-start',
  userId: userId,
  mediaFileCount: mediaFiles.length,
  hasAudioBlob: !!audioBlob,
  formData: {
    title: data.title,
    summary: data.summary,
    date: data.date.toISOString(),
    location: data.location,
    tags: data.tags,
    latitude,
    longitude
  },
  timestamp: new Date().toISOString()
});
```

#### Upload Preparation
```typescript
logInfo('Preparing file uploads', {
  component: 'NewMemoryForm',
  function: 'onSubmit',
  action: 'upload-preparation',
  userId: userId,
  mediaFiles: mediaFiles.map(file => ({
    name: file.name,
    size: file.size,
    type: file.type
  })),
  audioBlobSize: audioBlob?.size || 0,
  timestamp: new Date().toISOString()
});
```

#### Media Upload Start
```typescript
logInfo('Starting media file uploads', {
  component: 'NewMemoryForm',
  function: 'onSubmit',
  action: 'media-upload-start',
  userId: userId,
  totalFiles: mediaFiles.length,
  timestamp: new Date().toISOString()
});
```

#### Individual File Upload
```typescript
logDebug('Starting individual file upload', {
  component: 'NewMemoryForm',
  function: 'onSubmit',
  action: 'individual-upload-start',
  userId: userId,
  fileIndex: index + 1,
  totalFiles: mediaFiles.length,
  fileName: file.name,
  fileId: fileId,
  storagePath: `memories/${userId}/${fileName}`,
  timestamp: new Date().toISOString()
});
```

#### Database Save
```typescript
logInfo('Preparing to save memory to database', {
  component: 'NewMemoryForm',
  function: 'onSubmit',
  action: 'database-save-prep',
  userId: userId,
  memoryData: {
    title: data.title,
    summary: data.summary,
    date: data.date.toISOString(),
    location: data.location,
    tags: data.tags,
    mediaCount: mediaItems.length,
    hasAudio: !!audioUrl,
    latitude,
    longitude,
    sentiment
  },
  timestamp: new Date().toISOString()
});
```

#### Navigation
```typescript
logInfo('Navigating to dashboard after successful memory creation', {
  component: 'NewMemoryForm',
  function: 'onSubmit',
  action: 'navigation-success',
  userId: userId,
  memoryId: memoryDoc.id,
  fromPath: '/memories/new',
  toPath: '/',
  timestamp: new Date().toISOString()
});
```

### 5. Error Handling

#### Upload Failures
```typescript
logError('File upload failed', {
  component: 'NewMemoryForm',
  function: 'uploadFile',
  action: 'upload-failed',
  fileName: file.name,
  filePath: path,
  error: error.message,
  errorCode: error.code,
  errorStack: error.stack,
  userId: userId,
  timestamp: new Date().toISOString()
}, error);
```

#### AI Processing Failures
```typescript
logError('AI processing failed', {
  component: 'NewMemoryForm',
  function: 'startRecording',
  action: 'ai-processing-failed',
  userId: userId,
  error: error instanceof Error ? error.message : 'Unknown error',
  errorStack: error instanceof Error ? error.stack : undefined,
  timestamp: new Date().toISOString()
}, error instanceof Error ? error : undefined);
```

#### Memory Creation Failures
```typescript
logError('Memory creation failed', {
  component: 'NewMemoryForm',
  function: 'onSubmit',
  action: 'creation-failed',
  userId: userId,
  error: error instanceof Error ? error.message : 'Unknown error',
  errorStack: error instanceof Error ? error.stack : undefined,
  errorType: error instanceof Error ? error.constructor.name : typeof error,
  context: {
    mediaFileCount: mediaFiles.length,
    hasAudioBlob: !!audioBlob,
    uploadProgress: uploadProgress,
    formData: {
      title: data.title,
      summary: data.summary,
      date: data.date.toISOString(),
      location: data.location,
      tags: data.tags
    }
  },
  timestamp: new Date().toISOString()
}, error instanceof Error ? error : undefined);
```

## Log Analysis Examples

### Track File Upload Progress
```typescript
// Filter logs for upload progress
const uploadLogs = testUtils.getLogsContaining('progress-update');
const progressByFile = uploadLogs.reduce((acc, log) => {
  const fileName = log.context.fileName;
  if (!acc[fileName]) acc[fileName] = [];
  acc[fileName].push({
    progress: log.context.progress,
    timestamp: log.timestamp
  });
  return acc;
}, {});
```

### Monitor AI Processing Performance
```typescript
// Get AI processing logs
const aiLogs = testUtils.getLogsContaining('ai-processing');
const processingTimes = aiLogs.map(log => ({
  action: log.context.action,
  timestamp: log.timestamp,
  duration: log.context.duration
}));
```

### Debug Upload Failures
```typescript
// Get all upload errors
const uploadErrors = testUtils.getLogsContaining('upload-failed');
uploadErrors.forEach(error => {
  console.log(`File: ${error.context.fileName}`);
  console.log(`Error: ${error.context.error}`);
  console.log(`Code: ${error.context.errorCode}`);
  console.log(`Stack: ${error.context.errorStack}`);
});
```

## Performance Monitoring

### Upload Speed Calculation
```typescript
const uploadLogs = testUtils.getLogsContaining('upload-completed');
uploadLogs.forEach(log => {
  const startLog = testUtils.getLogsContaining('upload-start')
    .find(start => start.context.fileName === log.context.fileName);
  
  if (startLog) {
    const duration = new Date(log.timestamp).getTime() - 
                    new Date(startLog.timestamp).getTime();
    const speed = log.context.totalBytes / (duration / 1000); // bytes per second
    console.log(`${log.context.fileName}: ${(speed / 1024 / 1024).toFixed(2)} MB/s`);
  }
});
```

### Memory Usage Tracking
```typescript
const memoryLogs = testUtils.getLogsContaining('database-save-success');
const totalMediaSize = memoryLogs.reduce((total, log) => {
  return total + (log.context.memoryData.mediaCount * 1024 * 1024); // Estimate 1MB per file
}, 0);
console.log(`Total media uploaded: ${(totalMediaSize / 1024 / 1024).toFixed(2)} MB`);
```

## Troubleshooting Common Issues

### 1. File Upload Stuck
- Check logs for `progress-update` entries
- Look for `upload-failed` errors
- Verify Firebase storage permissions

### 2. AI Processing Hangs
- Monitor `ai-processing-start` logs
- Check for `ai-processing-failed` errors
- Verify API endpoints and authentication

### 3. Database Save Issues
- Check `database-save-prep` logs
- Look for `creation-failed` errors
- Verify Firestore permissions and rules

### 4. Audio Recording Problems
- Check `microphone-access` logs
- Look for `recording-failed` errors
- Verify browser permissions and media devices

## Best Practices

1. **Monitor Log Levels**: Use appropriate log levels (DEBUG, INFO, WARN, ERROR)
2. **Include Context**: Always include relevant context data for debugging
3. **Error Handling**: Log both error messages and stack traces
4. **Performance Tracking**: Include timing information for performance analysis
5. **User Identification**: Always include userId for user-specific debugging

This comprehensive logging system provides complete visibility into the file upload process, making it easy to debug issues, monitor performance, and understand user behavior during testing and production use.
