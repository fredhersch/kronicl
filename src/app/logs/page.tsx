'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, Download, Trash2, Search, Filter } from 'lucide-react';
import { LogLevel } from '@/lib/logger';
import { syncAllLogsToServer, checkLogSync, logInfo, logDebug, logWarn, logError } from '@/lib/logger-client';

interface LogEntry {
  level: LogLevel;
  message: string;
  context: Record<string, any>;
  timestamp: string;
  stack?: string;
}

interface LogsResponse {
  timestamp: string;
  totalLogs: number;
  filters: Record<string, string>;
  logs: LogEntry[];
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    level: '',
    component: '',
    function: '',
    search: '',
    limit: '100'
  });
  const [activeTab, setActiveTab] = useState('view');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          params.append(key, value);
        }
      });
      
      const response = await fetch(`/api/logs?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data: LogsResponse = await response.json();
      setLogs(data.logs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = async () => {
    try {
      const response = await fetch('/api/logs', { method: 'DELETE' });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      setLogs([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear logs');
    }
  };

  const downloadLogs = async (format: 'json' | 'csv' | 'text') => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          params.append(key, value);
        }
      });
      params.append('format', format);
      
      const response = await fetch(`/api/logs?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `logs-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download logs');
    }
  };

  const getLevelColor = (level: LogLevel) => {
    switch (level) {
      case LogLevel.DEBUG: return 'bg-gray-500';
      case LogLevel.INFO: return 'bg-blue-500';
      case LogLevel.WARN: return 'bg-yellow-500';
      case LogLevel.ERROR: return 'bg-red-500';
      case LogLevel.CRITICAL: return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getLevelName = (level: LogLevel) => {
    return LogLevel[level];
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    fetchLogs();
  };

  const handleReset = () => {
    setFilters({
      level: '',
      component: '',
      function: '',
      search: '',
      limit: '100'
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Application Logs</h1>
        <div className="flex items-center gap-2">
          <Button onClick={fetchLogs} disabled={loading} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={syncAllLogsToServer} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync to Server
          </Button>
          <Button onClick={() => {
            logInfo('Test log from logs page', { component: 'LogsPage', function: 'test' });
            logDebug('Test debug log', { component: 'LogsPage', function: 'test' });
            logWarn('Test warning log', { component: 'LogsPage', function: 'test' });
            logError('Test error log', { component: 'LogsPage', function: 'test' });
          }} variant="outline" size="sm">
            Test Logs
          </Button>
          <Button onClick={clearLogs} variant="destructive" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="view">View Logs</TabsTrigger>
          <TabsTrigger value="filters">Filters & Export</TabsTrigger>
        </TabsList>

        <TabsContent value="view" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Log Entries ({logs.length})
                <div className="flex items-center gap-2">
                  <Button onClick={() => downloadLogs('json')} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    JSON
                  </Button>
                  <Button onClick={() => downloadLogs('csv')} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    CSV
                  </Button>
                  <Button onClick={() => downloadLogs('text')} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Text
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {loading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p>Loading logs...</p>
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No logs found</p>
                </div>
              ) : (
                <ScrollArea className="h-[600px]">
                  <div className="space-y-2">
                    {logs.map((log, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className={getLevelColor(log.level)}>
                              {getLevelName(log.level)}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {formatTimestamp(log.timestamp)}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            #{index + 1}
                          </div>
                        </div>
                        
                        <p className="font-medium">{log.message}</p>
                        
                        {Object.keys(log.context).length > 0 && (
                          <div className="space-y-1">
                            <Separator />
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                              {Object.entries(log.context).map(([key, value]) => (
                                <div key={key} className="space-y-1">
                                  <span className="font-medium text-muted-foreground">{key}:</span>
                                  <div className="break-words">
                                    {typeof value === 'object' 
                                      ? JSON.stringify(value, null, 2)
                                      : String(value)
                                    }
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {log.stack && (
                          <div className="space-y-1">
                            <Separator />
                            <details className="text-sm">
                              <summary className="cursor-pointer font-medium text-muted-foreground">
                                Stack Trace
                              </summary>
                              <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                                {log.stack}
                              </pre>
                            </details>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="filters" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters & Export Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Log Level</label>
                  <Select value={filters.level} onValueChange={(value) => handleFilterChange('level', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All levels</SelectItem>
                      <SelectItem value="0">DEBUG</SelectItem>
                      <SelectItem value="1">INFO</SelectItem>
                      <SelectItem value="2">WARN</SelectItem>
                      <SelectItem value="3">ERROR</SelectItem>
                      <SelectItem value="4">CRITICAL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Component</label>
                  <Input
                    placeholder="Filter by component"
                    value={filters.component}
                    onChange={(e) => handleFilterChange('component', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Function</label>
                  <Input
                    placeholder="Filter by function"
                    value={filters.function}
                    onChange={(e) => handleFilterChange('function', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Search Text</label>
                  <Input
                    placeholder="Search in messages and context"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleFilterChange('search', 'page')}
                      className="text-xs"
                    >
                      Page Logs
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleFilterChange('search', 'upload')}
                      className="text-xs"
                    >
                      Upload Logs
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleFilterChange('search', 'recording')}
                      className="text-xs"
                    >
                      Recording Logs
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Limit Results</label>
                  <Select value={filters.limit} onValueChange={(value) => handleFilterChange('limit', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="50">Last 50</SelectItem>
                      <SelectItem value="100">Last 100</SelectItem>
                      <SelectItem value="500">Last 500</SelectItem>
                      <SelectItem value="1000">Last 1000</SelectItem>
                      <SelectItem value="">All</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-2">
                <Button onClick={handleSearch} className="flex-1">
                  <Search className="h-4 w-4 mr-2" />
                  Apply Filters
                </Button>
                <Button onClick={handleReset} variant="outline">
                  Reset Filters
                </Button>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>• Use filters to narrow down logs for debugging specific issues</p>
                <p>• Export logs in different formats for analysis</p>
                <p>• Logs are automatically limited to prevent memory issues</p>
                <p>• Page-specific logs include navigation and user interaction tracking</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
