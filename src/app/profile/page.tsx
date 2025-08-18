
'use client';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Mail, LogOut, CheckCircle, XCircle, Link as LinkIcon, ArrowLeft, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const GoogleIcon = () => (
    <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.022,35.022,44,30.034,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
    </svg>
);


export default function ProfilePage() {
  const { user, loading, signOut, isGooglePhotosConnected, linkGoogleAccount, unlinkGoogleAccount } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [connectionStatus, setConnectionStatus] = useState<{status: 'success' | 'error' | 'idle', message: string}>({status: 'idle', message: ''});

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    const status = searchParams.get('status');
    const message = searchParams.get('message');
    if (status === 'success' && message) {
        setConnectionStatus({status: 'success', message: decodeURIComponent(message)});
    } else if (status === 'error' && message) {
        setConnectionStatus({status: 'error', message: decodeURIComponent(message)});
    } else {
        setConnectionStatus({status: 'idle', message: ''});
    }
  }, [searchParams]);

  if (loading || !user) {
    return (
        <div className="flex flex-col min-h-screen bg-background">
             <header className="sticky top-0 z-10 flex items-center h-16 px-4 border-b bg-background/80 backdrop-blur-sm sm:px-6 md:px-8">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-6 w-32 ml-4" />
            </header>
            <main className="flex flex-1 items-center justify-center p-4">
                <Card className="w-full max-w-2xl">
                    <CardHeader className="text-center">
                        <Skeleton className="h-8 w-48 mx-auto" />
                        <Skeleton className="h-4 w-64 mx-auto mt-2" />
                    </CardHeader>
                    <CardContent className="space-y-8">
                         <div className="flex flex-col items-center gap-4">
                            <Skeleton className="h-24 w-24 rounded-full" />
                            <div className="text-center">
                                <Skeleton className="h-6 w-32" />
                                <Skeleton className="h-4 w-40 mt-2" />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                         <div className="flex justify-end">
                            <Skeleton className="h-10 w-24" />
                         </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
  }

  const isConnected = isGooglePhotosConnected();

  return (
    <div className="min-h-screen bg-background font-body">
       <header className="sticky top-0 z-10 flex items-center h-16 px-4 border-b bg-background/80 backdrop-blur-sm sm:px-6 md:px-8">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="ml-4 text-xl font-headline">Profile Settings</h1>
      </header>
      <main className="p-4 sm:p-6 md:p-8">
        <div className="max-w-2xl mx-auto">
            <Card>
                <CardHeader className="text-center border-b">
                    <CardTitle className="text-3xl font-headline">Profile</CardTitle>
                    <CardDescription>Manage your account settings and connections.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-8">
                    {connectionStatus.status !== 'idle' && (
                        <Alert variant={connectionStatus.status === 'error' ? 'destructive' : 'default'} className={connectionStatus.status === 'success' ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : ''}>
                           {connectionStatus.status === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                            <AlertTitle>{connectionStatus.status === 'success' ? 'Connection Successful' : 'Connection Failed'}</AlertTitle>
                            <AlertDescription>
                                {connectionStatus.message}
                            </AlertDescription>
                        </Alert>
                    )}
                    <div className="flex flex-col items-center gap-4">
                        <Avatar className="w-24 h-24 border-4 border-primary/20">
                            <AvatarImage src={user.photoURL ?? undefined} alt={user.displayName ?? 'User'} />
                            <AvatarFallback className="text-4xl">
                                {user.displayName ? user.displayName.charAt(0) : <User />}
                            </AvatarFallback>
                        </Avatar>
                        <div className="text-center">
                            <h2 className="text-2xl font-semibold">{user.displayName || 'Anonymous User'}</h2>
                            <p className="text-muted-foreground">{user.email}</p>
                        </div>
                    </div>
                    
                    <Card className="bg-background/50">
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <GoogleIcon /> App Connections
                            </CardTitle>
                            <CardDescription>
                                Connect your MemoryLane account to other services like Google Photos to import media.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex-1">
                                    <h3 className="font-semibold flex items-center gap-2">
                                        <GoogleIcon />
                                        Google Photos
                                    </h3>
                                    <div className={`flex items-center gap-1.5 text-sm ${isConnected ? 'text-green-600' : 'text-muted-foreground'}`}>
                                        {isConnected ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                        <span>{isConnected ? 'Connected' : 'Not Connected'}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {isConnected 
                                            ? 'You can import photos from your Google Photos library' 
                                            : 'Connect to import photos from your Google Photos library'
                                        }
                                    </p>
                                </div>
                                <div className="flex flex-col gap-2">
                                    {isConnected ? (
                                        <Button variant="destructive" size="sm" onClick={unlinkGoogleAccount}>
                                            Disconnect
                                        </Button>
                                    ) : (
                                        <Button size="sm" onClick={linkGoogleAccount}>
                                            <LinkIcon className="w-4 h-4 mr-2" />
                                            Connect
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end pt-4 border-t">
                        <Button variant="outline" onClick={signOut}>
                            <LogOut className="mr-2 h-4 w-4" />
                            Sign Out
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
      </main>
    </div>
  );
}
