import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs } from 'firebase/firestore';
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

export async function GET(request: NextRequest) {
  try {
    // Security check: Only allow in dev/test environments
    if (!isDevOrTestMode()) {
      return NextResponse.json(
        { error: 'Memory debug is only available in development or test environments' },
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

    console.log(`Debugging memories for user: ${userId}`);

    // Get ALL memories for the user (including deleted ones)
    const memoriesQuery = query(
      collection(db, 'memories'),
      where('userId', '==', userId)
    );
    
    const memoriesSnapshot = await getDocs(memoriesQuery);
    const memoryDocs = memoriesSnapshot.docs;
    
    console.log(`Found ${memoryDocs.length} total memories for user`);

    // Analyze the memories
    const memories = memoryDocs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || 'No title',
        deleted: data.deleted || false,
        deletedAt: data.deletedAt || null,
        restoredAt: data.restoredAt || null,
        createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : 'No created date',
        clientCreatedAt: data.clientCreatedAt || null,
        hasMedia: data.media ? data.media.length : 0,
        hasAudio: !!data.audioUrl,
        location: data.location || 'No location'
      };
    });

    // Count different types
    const totalMemories = memories.length;
    const deletedMemories = memories.filter(m => m.deleted === true).length;
    const activeMemories = memories.filter(m => m.deleted !== true).length;
    const memoriesWithMedia = memories.filter(m => m.hasMedia > 0).length;
    const memoriesWithAudio = memories.filter(m => m.hasAudio).length;

    const summary = {
      userId,
      totalMemories,
      activeMemories,
      deletedMemories,
      memoriesWithMedia,
      memoriesWithAudio,
      breakdown: {
        active: memories.filter(m => m.deleted !== true),
        deleted: memories.filter(m => m.deleted === true)
      }
    };

    console.log('Memory debug summary:', summary);

    return NextResponse.json({
      success: true,
      summary,
      allMemories: memories
    });

  } catch (error) {
    console.error('Error debugging memories:', error);
    return NextResponse.json(
      { error: 'Failed to debug memories. Please try again.' },
      { status: 500 }
    );
  }
}
