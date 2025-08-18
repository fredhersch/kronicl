
import { google } from 'googleapis';
import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { getDb, getAdminApp } from './firebase-admin';
import type { OAuth2Client } from 'google-auth-library';

export function getOAuth2Client(): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Missing Google OAuth2 configuration in environment variables.');
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

// This function gets a fully authenticated client for making API calls
export async function getAuthenticatedClient(): Promise<OAuth2Client | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('__session')?.value;
  if (!sessionCookie) {
    console.log("No session cookie, user not authenticated.");
    return null;
  }

  try {
    getAdminApp(); // Ensure app is initialized
    const db = getDb();
    
    const decodedToken = await getAuth().verifySessionCookie(sessionCookie, true);
    const uid = decodedToken.uid;
    
    const tokenDocRef = db.collection('google-photos').doc(uid);
    const tokenDoc = await tokenDocRef.get();

    if (!tokenDoc.exists) {
      console.log(`No Google Photos token found for user ${uid}`);
      return null;
    }

    const tokenData = tokenDoc.data();
    const refreshToken = tokenData?.refreshToken;
    const scopes = tokenData?.scopes;
    
    console.log(`🔍 Token data for user ${uid}:`, {
      hasRefreshToken: !!refreshToken,
      scopes: scopes,
      tokenExpiry: tokenData?.tokenExpiry
    });
    
    if (!refreshToken) {
      console.log(`Refresh token missing for user ${uid}`);
      return null;
    }
    
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({
      refresh_token: refreshToken,
      access_token: tokenData?.accessToken, // Add the access token
      scope: scopes, // Add the scopes
      expiry_date: tokenData?.tokenExpiry, // Add the expiry date
    });
    
    console.log(`✅ OAuth client configured with scopes: ${scopes}`);
    
    // Force token refresh if access token is missing or expired
    if (!tokenData?.accessToken || (tokenData?.tokenExpiry && Date.now() > tokenData.tokenExpiry)) {
      console.log('🔄 Access token missing or expired, refreshing...');
      try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        console.log('✅ Access token refreshed successfully');
      } catch (refreshError) {
        console.error('❌ Failed to refresh access token:', refreshError);
        return null;
      }
    }
    
    // The library will automatically handle refreshing the access token if it's expired.
    return oauth2Client;
  } catch (error) {
    console.error('Error getting authenticated Google client:', error);
    return null;
  }
}
