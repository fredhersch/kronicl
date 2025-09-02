
import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminApp } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
    const authorization = request.headers.get('Authorization');
    if (authorization?.startsWith('Bearer ')) {
        const idToken = authorization.split('Bearer ')[1];
        const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

        try {
            getAdminApp(); // Ensure the app is initialized
            const sessionCookie = await getAuth().createSessionCookie(idToken, { expiresIn });
            const cookieStore = await cookies();
            cookieStore.set('__session', sessionCookie, {
                maxAge: expiresIn,
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/'
            });
            return NextResponse.json({ status: 'success' });
        } catch (error) {
            console.error('Error creating session cookie:', error);
            return NextResponse.json({ status: 'error', message: 'Failed to create session' }, { status: 401 });
        }
    }
    return NextResponse.json({ status: 'error', message: 'Authorization header missing or invalid' }, { status: 400 });
}

export async function GET() {
    // Debug endpoint - only available when debug mode is enabled
    const isDebug = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEBUG_MODE === 'true';
    
    if (!isDebug) {
        return NextResponse.json({ error: 'Debug mode not enabled' }, { status: 404 });
    }
    
    // Test environment variable access
    const envTest = {
        nodeEnv: process.env.NODE_ENV,
        debugMode: process.env.NEXT_PUBLIC_DEBUG_MODE,
        firebaseApiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        firebaseApiKeyPreview: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.substring(0, 10),
        geminiApiKey: !!process.env.GEMINI_API_KEY,
        geminiApiKeyPreview: process.env.GEMINI_API_KEY?.substring(0, 10),
        firebaseServiceAccount: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
        allEnvKeys: Object.keys(process.env).filter(key => 
            key.includes('FIREBASE') || key.includes('GEMINI') || key.includes('GOOGLE') || key.includes('DEBUG')
        )
    };
    
    return NextResponse.json(envTest);
}

export async function DELETE() {
    const cookieStore = await cookies();
    cookieStore.delete('__session');
    return NextResponse.json({ status: 'success' });
}
