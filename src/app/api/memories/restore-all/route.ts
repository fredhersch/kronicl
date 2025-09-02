import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';
import { cookies } from 'next/headers';
import { getAdminApp } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase/firestore';
import { app } from '@/lib/firebase-client';

// Environment check for development/test mode
function isDevOrTestMode(): boolean {
  return (
    process.env.NODE_ENV === 'development' ||
    process.env.NODE_ENV === 'test' ||
    process.env.NEXT_PUBLIC_TEST_MODE === 'true'
  );
}

export async function POST(request: NextRequest) {
  try {
    // Security check: Only allow in dev/test environments
    if (!isDevOrTestMode()) {
      return NextResponse.json(
        { error: 'Restore all memories is only available in development or test environments' },
        { status: 403 }
      );
    }

    // Verify user authentication
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('__session')?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    let decodedClaim;
    try {
      getAdminApp(); // Ensure the admin app is initialized
      decodedClaim = await getAuth().verifySessionCookie(sessionCookie, true);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const userId = decodedClaim.uid;
    const db = getFirestore(app);

    console.log(`Starting memory restore for user: ${userId}`);

    // Get all soft-deleted memories for the user
    const memoriesQuery = query(
      collection(db, 'memories'),
      where('userId', '==', userId),
      where('deleted', '==', true)
    );
    
    const memoriesSnapshot = await getDocs(memoriesQuery);
    const memoryDocs = memoriesSnapshot.docs;
    
    console.log(`Found ${memoryDocs.length} soft-deleted memories to restore`);

    if (memoryDocs.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No soft-deleted memories found to restore',
        restoredMemories: 0
      });
    }

    // Use a batch write to efficiently restore all memories
    const batch = writeBatch(db);
    let restoredMemories = 0;

    memoryDocs.forEach((memoryDoc) => {
      const memoryRef = doc(db, 'memories', memoryDoc.id);
      batch.update(memoryRef, {
        deleted: false,
        deletedAt: null,
        restoredAt: new Date().toISOString()
      });
      restoredMemories++;
    });

    // Commit the batch
    await batch.commit();

    console.log(`Memory restore completed for user: ${userId}`);
    console.log(`- Restored ${restoredMemories} memories`);

    return NextResponse.json({
      success: true,
      message: 'All memories have been restored successfully',
      restoredMemories
    });

  } catch (error) {
    console.error('Error restoring memories:', error);
    return NextResponse.json(
      { error: 'Failed to restore memories. Please try again.' },
      { status: 500 }
    );
  }
}
