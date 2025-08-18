
'use server';
import { NextRequest, NextResponse } from 'next/server';
import { getOAuth2Client } from '@/lib/google-auth';
import { cookies } from 'next/headers';

const OAUTH_STATE_COOKIE = 'gcp_oauth_state';

// This endpoint starts the OAuth2 flow by generating an authorization URL
export async function GET(req: NextRequest) {
  try {
    const oauth2Client = getOAuth2Client();

    // Generate a random state value for security
    const state = Math.random().toString(36).substring(2);

    // Define the scopes we need - use the broader photoslibrary scope
    const scopesArray = [
      'https://www.googleapis.com/auth/photoslibrary', // Changed from photoslibrary.readonly
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ];
    
    const scopesString = scopesArray.join(' ');
    
    console.log('🔍 OAuth scopes being requested (array):', scopesArray);
    console.log('🔍 OAuth scopes being requested (string):', scopesString);
    
    // The URL where the user will be redirected to for consent
    const authorizationUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline', // 'offline' gets a refresh token
      scope: scopesString, // Use space-separated string format
      prompt: 'consent select_account', // Force consent screen and account selection
      state: state,
      include_granted_scopes: true, // Include previously granted scopes
      response_type: 'code', // Explicitly request authorization code
    });
    
    console.log('🔗 Generated authorization URL:', authorizationUrl);

    // Store the state in a secure, HTTP-only cookie to prevent CSRF attacks
    const cookieStore = await cookies();
    cookieStore.set(OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 5, // 5 minutes
      path: '/',
      sameSite: 'lax',
    });

    // Redirect the user to the authorization URL
    return NextResponse.redirect(authorizationUrl);
  } catch (error) {
    console.error('Failed to initiate Google OAuth flow:', error);
    const errorMessage = 'Failed to connect with Google. Please check server configuration.';
    return NextResponse.redirect(new URL(`/profile?status=error&message=${encodeURIComponent(errorMessage)}`, req.url));
  }
}
