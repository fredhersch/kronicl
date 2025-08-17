import { initializeApp, getApps, App, credential } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Firebase Admin SDK
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (serviceAccount && !getApps().length) {
  try {
    initializeApp({
      credential: credential.cert(JSON.parse(serviceAccount)),
    });
  } catch (error: any) {
    console.error('Firebase Admin Initialization Error:', error.message);
  }
}

export async function POST(request: NextRequest) {
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
            // It's important to return a proper error response
            return NextResponse.json({ status: 'error', message: 'Failed to create session' }, { status: 401 });
        }
    }
    return NextResponse.json({ status: 'error', message: 'Authorization header missing or invalid' }, { status: 400 });
}


export async function DELETE() {
    cookies().delete('__session');
    return NextResponse.json({ status: 'success' });
}
