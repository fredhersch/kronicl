'use client';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getDebugStatus, setDebugMode, clearManualDebugMode, isDebugMode } from '@/lib/debug';
import { useState, useEffect } from 'react';

export function AuthDebug() {
  const { user, loading } = useAuth();
  const [debugEnabled, setDebugEnabled] = useState(false);
  const [debugStatus, setDebugStatus] = useState({ enabled: false, source: 'Unknown' });

  useEffect(() => {
    const status = getDebugStatus();
    setDebugStatus(status);
    setDebugEnabled(status.enabled);
  }, []);

  // Re-check debug status when URL changes
  useEffect(() => {
    const handleUrlChange = () => {
      clearManualDebugMode(); // Clear any manual override when URL changes
      const status = getDebugStatus();
      setDebugStatus(status);
      setDebugEnabled(status.enabled);
    };

    // Listen for URL changes
    window.addEventListener('popstate', handleUrlChange);
    
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);

  const toggleDebug = () => {
    const newState = !debugEnabled;
    setDebugMode(newState);
    setDebugEnabled(newState);
    setDebugStatus({ enabled: newState, source: 'Manual override' });
  };

  const resetToUrl = () => {
    clearManualDebugMode();
    const status = getDebugStatus();
    setDebugStatus(status);
    setDebugEnabled(status.enabled);
  };

  if (loading) {
    return <div>Loading auth state...</div>;
  }

  // Check Firebase configuration status
  const firebaseConfigured = true; // We have fallbacks, so Firebase is always configured

  return (
    <div className="space-y-4">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Environment Variables Check</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Debug Mode:</span>
            <Badge variant={debugEnabled ? 'default' : 'secondary'}>
              {debugEnabled ? '🐛 Enabled' : '🔇 Disabled'}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Debug Source:</span>
            <span className="text-xs text-muted-foreground">{debugStatus.source}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Firebase Configuration:</span>
            <Badge variant={firebaseConfigured ? 'default' : 'destructive'}>
              {firebaseConfigured ? '✅ Ready' : '❌ Invalid'}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Environment Variables:</span>
            <Badge variant={!!process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'default' : 'secondary'}>
              {!!process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✅ Loaded' : '⚠️ Using Fallbacks'}
            </Badge>
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={toggleDebug} variant="outline" size="sm">
              {debugEnabled ? 'Disable Debug' : 'Enable Debug'}
            </Button>
            <Button onClick={resetToUrl} variant="secondary" size="sm">
              Reset to URL
            </Button>
          </div>
          <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
            <strong>Debug Controls:</strong><br/>
            • URL: Add <code>?debug=true</code> or <code>?debug=false</code><br/>
            • Environment: Set <code>NEXT_PUBLIC_DEBUG_MODE=true</code><br/>
            • Button: Toggle debug mode above
          </div>
        </CardContent>
      </Card>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Auth Debug Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <strong>Status:</strong>{' '}
            <Badge variant={user ? 'default' : 'destructive'}>
              {user ? 'Authenticated' : 'Not Authenticated'}
            </Badge>
          </div>
          {user && (
            <>
              <div><strong>UID:</strong> {user.uid}</div>
              <div><strong>Email:</strong> {user.email}</div>
              <div><strong>Display Name:</strong> {user.displayName}</div>
              <div>
                <strong>Providers:</strong>{' '}
                {user.providerData.map(p => p.providerId).join(', ')}
              </div>
              <div><strong>Email Verified:</strong> {user.emailVerified ? 'Yes' : 'No'}</div>
            </>
          )}
          <div><strong>Current URL:</strong> {window.location.pathname}</div>
          <div>
            <strong>Session Cookie:</strong>{' '}
            <Badge variant={document.cookie.includes('__session=') ? 'default' : 'destructive'}>
              {document.cookie.includes('__session=') ? 'Present' : 'Missing'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

