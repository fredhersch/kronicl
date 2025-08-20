'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Header } from '@/components/header';
import { MemoryList } from '@/components/memories/memory-list';
import type { Memory } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { logger, logInfo, logError, logDebug, logTest } from '@/lib/logger-client';

export default function Dashboard() {
  const { user, loading, db } = useAuth();
  const router = useRouter();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [filteredMemories, setFilteredMemories] = useState<Memory[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Component lifecycle logging
  useEffect(() => {
    logger.info('Dashboard component mounted', {
      component: 'Dashboard',
      function: 'useEffect-mount',
      pagePath: '/',
      pageTitle: 'Dashboard',
      timestamp: new Date().toISOString()
    });

    return () => {
      logger.info('Dashboard component unmounting', {
        component: 'Dashboard',
        function: 'useEffect-cleanup',
        pagePath: '/',
        pageTitle: 'Dashboard',
        timestamp: new Date().toISOString()
      });
    };
  }, []);

  // Authentication state monitoring
  useEffect(() => {
    logDebug('Auth state changed', {
      component: 'Dashboard',
      function: 'useEffect-auth',
      loading,
      hasUser: !!user,
      userId: user?.uid,
      timestamp: new Date().toISOString()
    });

    if (!loading && !user) {
      logInfo('User not authenticated, redirecting to login', {
        component: 'Dashboard',
        function: 'useEffect-auth',
        action: 'redirect-to-login',
        timestamp: new Date().toISOString()
      });
      router.push('/login');
    }
  }, [user, loading, router]);

  // Data fetching with comprehensive logging
  useEffect(() => {
    if (user && db) {
      logInfo('Starting to fetch user memories', {
        component: 'Dashboard',
        function: 'useEffect-data-fetch',
        userId: user.uid,
        hasDb: !!db,
        timestamp: new Date().toISOString()
      });

      setDataLoading(true);
      
      try {
        const q = query(collection(db, 'memories'), where('userId', '==', user.uid));
        
        logDebug('Firestore query created', {
          component: 'Dashboard',
          function: 'useEffect-data-fetch',
          collection: 'memories',
          userId: user.uid,
          timestamp: new Date().toISOString()
        });

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          logDebug('Firestore snapshot received', {
            component: 'Dashboard',
            function: 'onSnapshot-callback',
            docCount: querySnapshot.docs.length,
            userId: user.uid,
            timestamp: new Date().toISOString()
          });

          try {
            const userMemories = querySnapshot.docs.map((doc) => {
              const data = doc.data();
              return {
                id: doc.id,
                ...data,
                date: data.date.toDate().toISOString(),
              } as Memory;
            });
            
            logInfo('Memories data processed', {
              component: 'Dashboard',
              function: 'onSnapshot-callback',
              memoryCount: userMemories.length,
              userId: user.uid,
              timestamp: new Date().toISOString()
            });
            
            // Sort memories by creation date in descending order (newest first)
            const sortedMemories = userMemories.sort((a, b) => {
              try {
                // Try to sort by createdAt timestamp first (most reliable)
                if (a.createdAt && b.createdAt) {
                  let dateA: Date;
                  let dateB: Date;
                  
                  // Handle Firestore Timestamp objects
                  if (a.createdAt.toDate && typeof a.createdAt.toDate === 'function') {
                    dateA = a.createdAt.toDate();
                    dateB = b.createdAt.toDate();
                  } else {
                    dateA = new Date(a.createdAt);
                    dateB = new Date(b.createdAt);
                  }
                  return dateB.getTime() - dateA.getTime(); // Descending order
                }
                
                // Fallback to clientCreatedAt if createdAt is not available
                if (a.clientCreatedAt && b.clientCreatedAt) {
                  const dateA = new Date(a.clientCreatedAt);
                  const dateB = new Date(b.clientCreatedAt);
                  return dateB.getTime() - dateA.getTime(); // Descending order
                }
                
                // Final fallback to memory date
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                return dateB.getTime() - dateA.getTime(); // Descending order
              } catch (sortError) {
                logError('Error sorting memories', {
                  component: 'Dashboard',
                  function: 'onSnapshot-callback-sort',
                  memoryA: a.id,
                  memoryB: b.id,
                  error: sortError instanceof Error ? sortError.message : 'Unknown sorting error',
                  timestamp: new Date().toISOString()
                }, sortError instanceof Error ? sortError : undefined);
                return 0; // Keep original order on error
              }
            });
            
            logDebug('Memories sorted successfully', {
              component: 'Dashboard',
              function: 'onSnapshot-callback-sort',
              sortedCount: sortedMemories.length,
              userId: user.uid,
              timestamp: new Date().toISOString()
            });
            
            setMemories(sortedMemories);
            setFilteredMemories(sortedMemories);
            setDataLoading(false);
            
            logInfo('Memories state updated successfully', {
              component: 'Dashboard',
              function: 'onSnapshot-callback',
              finalMemoryCount: sortedMemories.length,
              userId: user.uid,
              timestamp: new Date().toISOString()
            });
          } catch (processingError) {
            logError('Error processing memories data', {
              component: 'Dashboard',
              function: 'onSnapshot-callback-processing',
              userId: user.uid,
              error: processingError instanceof Error ? processingError.message : 'Unknown processing error',
              timestamp: new Date().toISOString()
            }, processingError instanceof Error ? processingError : undefined);
            setDataLoading(false);
          }
        }, (error) => {
          logError('Firestore snapshot error', {
            component: 'Dashboard',
            function: 'onSnapshot-error',
            userId: user.uid,
            error: error.message,
            errorCode: error.code,
            timestamp: new Date().toISOString()
          }, error);
          setDataLoading(false);
        });

        return () => {
          logDebug('Unsubscribing from Firestore snapshot', {
            component: 'Dashboard',
            function: 'useEffect-cleanup',
            userId: user.uid,
            timestamp: new Date().toISOString()
          });
          unsubscribe();
        };
      } catch (queryError) {
        logError('Error creating Firestore query', {
          component: 'Dashboard',
          function: 'useEffect-data-fetch',
          userId: user.uid,
          error: queryError instanceof Error ? queryError.message : 'Unknown query error',
          timestamp: new Date().toISOString()
        }, queryError instanceof Error ? queryError : undefined);
        setDataLoading(false);
      }
    }
  }, [user, db]);

  const handleSearch = (query: string) => {
    logDebug('Search query received', {
      component: 'Dashboard',
      function: 'handleSearch',
      searchQuery: query,
      queryLength: query.length,
      currentMemoryCount: memories.length,
      timestamp: new Date().toISOString()
    });

    const lowerCaseQuery = query.toLowerCase();
    if (!lowerCaseQuery) {
      logDebug('Empty search query, showing all memories', {
        component: 'Dashboard',
        function: 'handleSearch',
        action: 'show-all-memories',
        memoryCount: memories.length,
        timestamp: new Date().toISOString()
      });
      setFilteredMemories(memories);
      return;
    }

    try {
      const results = memories.filter(
        (memory) =>
          memory.title.toLowerCase().includes(lowerCaseQuery) ||
          memory.summary.toLowerCase().includes(lowerCaseQuery) ||
          (memory.transcription && memory.transcription.toLowerCase().includes(lowerCaseQuery)) ||
          memory.tags.some((tag) => tag.toLowerCase().includes(lowerCaseQuery))
      );
      
      logInfo('Search completed successfully', {
        component: 'Dashboard',
        function: 'handleSearch',
        searchQuery: query,
        totalMemories: memories.length,
        resultsCount: results.length,
        timestamp: new Date().toISOString()
      });
      
      setFilteredMemories(results);
    } catch (searchError) {
      logError('Error during search filtering', {
        component: 'Dashboard',
        function: 'handleSearch',
        searchQuery: query,
        error: searchError instanceof Error ? searchError.message : 'Unknown search error',
        timestamp: new Date().toISOString()
      }, searchError instanceof Error ? searchError : undefined);
      
      // Fallback to showing all memories on search error
      setFilteredMemories(memories);
    }
  };
  
  // Loading state logging
  if (loading || !user || dataLoading) {
    logDebug('Rendering loading state', {
      component: 'Dashboard',
      function: 'render',
      state: 'loading',
      loading,
      hasUser: !!user,
      dataLoading,
      timestamp: new Date().toISOString()
    });

    return (
        <div className="flex flex-col min-h-screen bg-background">
          <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 border-b bg-background/80 backdrop-blur-sm sm:px-6 md:px-8">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-6 w-32" />
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6 md:p-8">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-48 w-full" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          </main>
        </div>
    );
  }

  // Main render logging
  logDebug('Rendering main dashboard', {
    component: 'Dashboard',
    function: 'render',
    state: 'main',
    memoryCount: memories.length,
    filteredCount: filteredMemories.length,
    userId: user.uid,
    timestamp: new Date().toISOString()
  });

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header onSearch={handleSearch} />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <MemoryList memories={filteredMemories} />
      </main>
    </div>
  );
}
