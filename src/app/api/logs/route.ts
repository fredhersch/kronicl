import { NextRequest, NextResponse } from 'next/server';
import { logger, LogLevel } from '@/lib/logger';

// In-memory storage for server-side logs
let serverLogs: any[] = [];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get query parameters
    const level = searchParams.get('level');
    const component = searchParams.get('component');
    const functionName = searchParams.get('function');
    const search = searchParams.get('search');
    const limit = searchParams.get('limit');
    const format = searchParams.get('format') || 'json';
    const clear = searchParams.get('clear') === 'true';
    
    // Get all logs - combine server logs with client logs from localStorage
    let logs = [...serverLogs, ...logger.getLogs()];
    
    // Apply filters
    if (level !== null) {
      const levelNum = parseInt(level);
      if (!isNaN(levelNum) && levelNum >= 0 && levelNum <= 4) {
        logs = logs.filter(log => log.level === levelNum);
      }
    }
    
    if (component) {
      logs = logs.filter(log => log.context.component === component);
    }
    
    if (functionName) {
      logs = logs.filter(log => log.context.function === functionName);
    }
    
    if (search) {
      logs = logs.filter(log => 
        log.message.toLowerCase().includes(search.toLowerCase()) ||
        JSON.stringify(log.context).toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Apply limit
    if (limit) {
      const limitNum = parseInt(limit);
      if (!isNaN(limitNum) && limitNum > 0) {
        logs = logs.slice(-limitNum); // Get last N logs
      }
    }
    
    // Clear logs if requested
    if (clear) {
      logger.clearLogs();
      serverLogs = []; // Also clear server logs
    }
    
    // Prepare response data
    const responseData = {
      timestamp: new Date().toISOString(),
      totalLogs: logs.length,
      filters: {
        level: level ? LogLevel[parseInt(level)] : 'all',
        component: component || 'all',
        function: functionName || 'all',
        search: search || 'none',
        limit: limit || 'none'
      },
      logs: logs
    };
    
    // Return different formats based on request
    if (format === 'text') {
      const textLogs = logs.map(log => {
        const levelStr = LogLevel[log.level].padEnd(8);
        const timestamp = new Date(log.timestamp).toLocaleString();
        const contextStr = Object.keys(log.context).length > 0 
          ? ` [${JSON.stringify(log.context)}]` 
          : '';
        return `[${timestamp}] ${levelStr} ${log.message}${contextStr}`;
      }).join('\n');
      
      return new NextResponse(textLogs, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
    }
    
    if (format === 'csv') {
      const csvHeaders = 'Timestamp,Level,Message,Component,Function,UserId,Context\n';
      const csvRows = logs.map(log => {
        const timestamp = new Date(log.timestamp).toISOString();
        const level = LogLevel[log.level];
        const message = `"${log.message.replace(/"/g, '""')}"`;
        const component = `"${log.context.component || ''}"`;
        const functionName = `"${log.context.function || ''}"`;
        const userId = `"${log.context.userId || ''}"`;
        const context = `"${JSON.stringify(log.context).replace(/"/g, '""')}"`;
        
        return `${timestamp},${level},${message},${component},${functionName},${userId},${context}`;
      }).join('\n');
      
      return new NextResponse(csvHeaders + csvRows, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="logs.csv"',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
    }
    
    // Default JSON response
    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
    
  } catch (error) {
    console.error('Error in logs API:', error);
    
    return NextResponse.json({
      error: 'Failed to retrieve logs',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Clear all logs
    logger.clearLogs();
    serverLogs = []; // Also clear server logs
    
    return NextResponse.json({
      message: 'All logs cleared successfully',
      timestamp: new Date().toISOString()
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error clearing logs:', error);
    
    return NextResponse.json({
      error: 'Failed to clear logs',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { level, message, context } = body;
    
    // Validate required fields
    if (!message) {
      return NextResponse.json({
        error: 'Message is required',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }
    
    // Log the message with specified level
    if (level && Object.values(LogLevel).includes(parseInt(level))) {
      switch (parseInt(level)) {
        case LogLevel.DEBUG:
          logger.debug(message, context || {});
          break;
        case LogLevel.INFO:
          logger.info(message, context || {});
          break;
        case LogLevel.WARN:
          logger.warn(message, context || {});
          break;
        case LogLevel.ERROR:
          logger.error(message, context || {});
          break;
        case LogLevel.CRITICAL:
          logger.critical(message, context || {});
          break;
      }
    } else {
      // Default to INFO level
      logger.info(message, context || {});
    }
    
    return NextResponse.json({
      message: 'Log entry created successfully',
      timestamp: new Date().toISOString()
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating log entry:', error);
    
    return NextResponse.json({
      error: 'Failed to create log entry',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
