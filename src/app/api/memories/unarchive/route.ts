import { NextRequest, NextResponse } from 'next/server';
import { doc, updateDoc } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { getAdminApp } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';
import { app } from '@/lib/firebase-client';

export async function POST(request: NextRequest) {
  try {
    const { memoryId } = await request.json();

    if (!memoryId) {
      return NextResponse.json({ error: 'Memory ID is required' }, { status: 400 });
    }

    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('__session')?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    getAdminApp();
    const decodedToken = await getAuth().verifySessionCookie(sessionCookie, true);
    const userId = decodedToken.uid;

    const db = getFirestore(app);
    const memoryRef = doc(db, 'memories', memoryId);

    // Unarchive the memory
    await updateDoc(memoryRef, {
      archived: false,
      archivedAt: null,
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Memory unarchived successfully',
      memoryId 
    });
  } catch (error) {
    console.error('Error unarchiving memory:', error);
    return NextResponse.json({ error: 'Failed to unarchive memory' }, { status: 500 });
  }
}
