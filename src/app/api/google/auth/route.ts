import { NextRequest, NextResponse } from 'next/server';
import { getOAuth2Client } from '@/lib/google-auth';
import { cookies } from 'next/headers';

const OAUTH_STATE_COOKIE = 'gcp_oauth_state';

// This endpoint starts the OAuth2 flow by generating an authorization URL
export async function GET(req: NextRequest) {
  const oauth2Client = getOAuth2Client();

  // Generate a random state value for security
  const state = Math.random().toString(36).substring(2);

  // The URL where the user will be redirected to for consent
  const authorizationUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', // 'offline' gets a refresh token
    scope: ['https://www.googleapis.com/auth/photoslibrary.readonly'],
    prompt: 'consent', // Force consent screen to ensure refresh token is provided
    state: state,
  });

  // Store the state in a secure, HTTP-only cookie to prevent CSRF attacks
  cookies().set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 5, // 5 minutes
    path: '/',
    sameSite: 'lax',
  });

  // Redirect the user to the authorization URL
  return NextResponse.redirect(authorizationUrl);
}
