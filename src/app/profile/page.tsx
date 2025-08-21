
'use client';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, LogOut, ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  // Check if user should be redirected to login
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
        <div className="flex flex-col min-h-screen bg-white">
             <header className="sticky top-0 z-10 flex items-center h-16 px-4 border-b border-slate-200 bg-white/80 backdrop-blur-sm sm:px-6 md:px-8">
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

  return (
    <div className="min-h-screen bg-white">
       <header className="sticky top-0 z-10 flex items-center h-16 px-4 border-b border-slate-200 bg-white/80 backdrop-blur-sm sm:px-6 md:px-8">
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
                    <CardDescription>Manage your account settings.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-8">
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
