import { NextRequest, NextResponse } from 'next/server';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { getAdminApp } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';
import { app } from '@/lib/firebase-client';

export async function POST(request: NextRequest) {
  try {
    const { memoryIds } = await request.json();

    if (!memoryIds || !Array.isArray(memoryIds) || memoryIds.length === 0) {
      return NextResponse.json({ error: 'Memory IDs are required' }, { status: 400 });
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
    const batch = writeBatch(db);

    memoryIds.forEach((id) => {
      const memoryRef = doc(db, 'memories', id);
      batch.update(memoryRef, {
        deleted: true,
        deletedAt: new Date().toISOString(),
      });
    });

    await batch.commit();

    return NextResponse.json({ success: true, deletedCount: memoryIds.length });
  } catch (error) {
    console.error('Error soft deleting memories:', error);
    return NextResponse.json({ error: 'Failed to soft delete memories' }, { status: 500 });
  }
}
