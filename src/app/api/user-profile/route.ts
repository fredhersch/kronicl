import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';
import { getUserProfile } from '@/lib/user-profile';

export async function GET() {
  try {
    // Get session cookie
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('__session')?.value;
    
    if (!sessionCookie) {
      return NextResponse.json({ error: 'No session cookie' }, { status: 401 });
    }

    // Verify Firebase session
    getAdminApp();
    const decodedToken = await getAuth().verifySessionCookie(sessionCookie, true);
    const uid = decodedToken.uid;
    
    console.log(`🔍 Checking user profile for UID: ${uid}`);
    
    // Get user profile
    const profile = await getUserProfile(uid);
    
    if (!profile) {
      console.log(`❌ No user profile found for UID: ${uid}`);
      return NextResponse.json({ 
        message: 'No user profile found',
        uid,
        suggestion: 'Profile will be created on next login',
        userInfo: {
          uid: decodedToken.uid,
          email: decodedToken.email,
          name: decodedToken.name,
          picture: decodedToken.picture
        }
      });
    }

    console.log(`✅ User profile found for UID: ${uid}:`, profile);
    return NextResponse.json({ 
      success: true,
      profile,
      uid
    });

  } catch (error: any) {
    console.error('Error getting user profile:', error);
    return NextResponse.json({ 
      error: 'Failed to get user profile',
      message: error.message 
    }, { status: 500 });
  }
}
