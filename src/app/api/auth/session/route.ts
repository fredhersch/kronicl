import { initializeApp, getApps, App, credential } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const initAdmin = (): App => {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccount) {
    throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_KEY environment variable.');
  }

  if (getApps().length) {
    return getApps()[0];
  }

  return initializeApp({
    credential: credential.cert(JSON.parse(serviceAccount)),
  });
};

export async function POST(request: NextRequest) {
    initAdmin();
    const authorization = request.headers.get('Authorization');
    if (authorization?.startsWith('Bearer ')) {
        const idToken = authorization.split('Bearer ')[1];
        const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

        try {
            const sessionCookie = await getAuth().createSessionCookie(idToken, { expiresIn });
            cookies().set('__session', sessionCookie, { maxAge: expiresIn, httpOnly: true, secure: true });
            return NextResponse.json({ status: 'success' });
        } catch (error) {
            console.error('Error creating session cookie:', error);
            return NextResponse.json({ status: 'error' }, { status: 401 });
        }
    }
    return NextResponse.json({ status: 'error' }, { status: 400 });
}


export async function DELETE() {
    cookies().delete('__session');
    return NextResponse.json({ status: 'success' });
}
