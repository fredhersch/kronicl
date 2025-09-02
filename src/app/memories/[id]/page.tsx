'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { MemoryDetail } from '@/components/memories/memory-detail';
import { Memory } from '@/lib/types';
import { ArrowLeft, MoreVertical, Archive } from 'lucide-react';
import Link from 'next/link';

export default function MemoryDetailPage() {
  const { user, loading, db } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [memory, setMemory] = useState<Memory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isArchiving, setIsArchiving] = useState(false);

  const memoryId = params.id as string;

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && db && memoryId) {
      const fetchMemory = async () => {
        try {
          const memoryRef = doc(db, 'memories', memoryId);
          const memorySnap = await getDoc(memoryRef);
          
          if (memorySnap.exists()) {
            const data = memorySnap.data();
            // Check if the memory belongs to the current user
            if (data.userId !== user.uid) {
              toast({
                title: 'Access Denied',
                description: 'You do not have permission to view this memory.',
                variant: 'destructive',
              });
              router.push('/');
              return;
            }
            
            setMemory({
              id: memorySnap.id,
              ...data,
              date: data.date.toDate().toISOString(),
            } as Memory);
          } else {
            toast({
              title: 'Memory Not Found',
              description: 'The memory you are looking for does not exist.',
              variant: 'destructive',
            });
            router.push('/');
          }
        } catch (error) {
          console.error('Error fetching memory:', error);
          toast({
            title: 'Error',
            description: 'Failed to load memory. Please try again.',
            variant: 'destructive',
          });
          router.push('/');
        } finally {
          setIsLoading(false);
        }
      };

      fetchMemory();
    }
  }, [user, db, memoryId, router, toast]);

  const handleArchive = async () => {
    if (isArchiving || !memory) return;
    
    setIsArchiving(true);
    
    try {
      // Import Firebase functions dynamically to avoid SSR issues
      const { doc, updateDoc } = await import('firebase/firestore');
      const { getFirestore } = await import('firebase/firestore');
      const { app } = await import('@/lib/firebase-client');
      
      const db = getFirestore(app);
      const memoryRef = doc(db, 'memories', memory.id);
      
      // Archive the memory directly using client-side Firebase
      await updateDoc(memoryRef, {
        archived: true,
        archivedAt: new Date().toISOString(),
      });

      toast({
        title: 'Memory Archived',
        description: 'The memory has been archived and removed from your main view.',
      });
      
      // Redirect back to dashboard
      router.push('/');
    } catch (error) {
      console.error('Error archiving memory:', error);
      toast({
        title: 'Error',
        description: 'Failed to archive memory. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsArchiving(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading memory...</p>
        </div>
      </div>
    );
  }

  if (!memory) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Memory Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              The memory you are looking for does not exist or you do not have permission to view it.
            </p>
            <Link href="/">
              <Button>Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-body">
      <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 border-b bg-background/80 backdrop-blur-sm sm:px-6 md:px-8">
        <div className="flex items-center">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="ml-4 text-xl font-headline">{memory.title}</h1>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem 
              onClick={handleArchive}
              disabled={isArchiving}
              className="text-orange-600 focus:text-orange-600"
            >
              <Archive className="h-4 w-4 mr-2" />
              {isArchiving ? 'Archiving...' : 'Archive Memory'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      
      <main className="p-4 sm:p-6 md:p-8">
        <MemoryDetail memory={memory} />
      </main>
    </div>
  );
}
