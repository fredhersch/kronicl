'use client';
import { NewMemoryForm } from '@/components/memories/new-memory-form';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { usePageLogging } from '@/hooks/use-page-logging';
import { logInfo } from '@/lib/logger-client';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function NewMemoryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { logPageEvent } = usePageLogging();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Log page-specific events
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

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-body">
      <header className="sticky top-0 z-10 flex items-center h-16 px-4 border-b bg-background/80 backdrop-blur-sm sm:px-6 md:px-8">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="ml-4 text-xl font-headline">Create a New Memory</h1>
      </header>
      <main className="p-4 sm:p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          <NewMemoryForm userId={user.uid} />
        </div>
      </main>
    </div>
  );
}
