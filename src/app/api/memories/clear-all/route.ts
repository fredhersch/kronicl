import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs, updateDoc, doc, writeBatch } from 'firebase/firestore';
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

export async function DELETE(request: NextRequest) {
  try {
    // Security check: Only allow in dev/test environments
    if (!isDevOrTestMode()) {
      return NextResponse.json(
        { error: 'Clear all memories is only available in development or test environments' },
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

    console.log(`Starting soft delete for all memories for user: ${userId}`);

    // Get all memories for the user
    const memoriesQuery = query(
      collection(db, 'memories'),
      where('userId', '==', userId)
    );
    
    const memoriesSnapshot = await getDocs(memoriesQuery);
    const memoryDocs = memoriesSnapshot.docs;
    
    console.log(`Found ${memoryDocs.length} memories to soft delete`);

    if (memoryDocs.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No memories found to delete',
        softDeletedMemories: 0
      });
    }

    // Use a batch write to efficiently update all memories
    const batch = writeBatch(db);
    let softDeletedMemories = 0;

    memoryDocs.forEach((memoryDoc) => {
      const memoryRef = doc(db, 'memories', memoryDoc.id);
      batch.update(memoryRef, {
        deleted: true,
        deletedAt: new Date().toISOString()
      });
      softDeletedMemories++;
    });

    // Commit the batch
    await batch.commit();

    console.log(`Soft delete completed for user: ${userId}`);
    console.log(`- Soft deleted ${softDeletedMemories} memories`);

    return NextResponse.json({
      success: true,
      message: 'All memories have been soft deleted and can be restored',
      softDeletedMemories
    });

  } catch (error) {
    console.error('Error clearing all memories:', error);
    return NextResponse.json(
      { error: 'Failed to clear memories. Please try again.' },
      { status: 500 }
    );
  }
}
