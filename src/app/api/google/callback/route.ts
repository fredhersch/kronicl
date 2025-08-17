
'use server';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getOAuth2Client } from '@/lib/google-auth';
import { getDb, getAdminApp } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';

const OAUTH_STATE_COOKIE = 'gcp_oauth_state';

// This endpoint handles the callback from Google after user consent
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  const savedState = cookies().get(OAUTH_STATE_COOKIE)?.value;

  // Prepare response to clear the state cookie after retrieving it
  const response = NextResponse.redirect(new URL('/profile', req.url));
  response.cookies.delete(OAUTH_STATE_COOKIE);


  // --- Security Checks ---
  if (!code) {
    return NextResponse.redirect(new URL('/profile?status=error&message=Authorization+code+not+found', req.url));
  }
  if (!state || !savedState || state !== savedState) {
    return NextResponse.redirect(new URL('/profile?status=error&message=Invalid+state.+CSRF+attack+suspected.', req.url));
  }
  const sessionCookie = cookies().get('__session')?.value;
  if (!sessionCookie) {
    // This should ideally redirect to login, but for simplicity, redirecting to profile with error.
    return NextResponse.redirect(new URL('/profile?status=error&message=Authentication+required.', req.url));
  }

  try {
    getAdminApp(); // Ensure app is initialized
    const db = getDb();

    // --- Verify Firebase session and get user UID ---
    const decodedToken = await getAuth().verifySessionCookie(sessionCookie, true);
    const uid = decodedToken.uid;
    
    // --- Exchange authorization code for tokens ---
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    
    // --- Securely store tokens in Firestore ---
    const { refresh_token, access_token, expiry_date, scope } = tokens;
    if (!refresh_token) {
        // This happens if the user has previously granted consent and is not re-prompted.
        // The 'prompt: consent' in the auth URL helps prevent this.
        return NextResponse.redirect(new URL('/profile?status=error&message=Could+not+retrieve+refresh+token.+Please+try+re-connecting.', req.url));
    }
    
    const tokenDocRef = db.collection('google-photos').doc(uid);
    await tokenDocRef.set({
      userId: uid,
      refreshToken: refresh_token,
      accessToken: access_token,
      tokenExpiry: expiry_date,
      scopes: scope,
    });

    // --- Redirect to profile page with success message ---
    return NextResponse.redirect(new URL('/profile?status=success&message=Successfully+connected+to+Google+Photos!', req.url));

  } catch (error) {
    console.error('Callback handling failed:', error);
    // Redirect with a generic error
    return NextResponse.redirect(new URL('/profile?status=error&message=An+unexpected+error+occurred.', req.url));
  }
}
