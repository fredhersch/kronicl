import { google } from 'googleapis';
import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { db } from './firebase-admin';
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
  const sessionCookie = cookies().get('__session')?.value;
  if (!sessionCookie) {
    console.log("No session cookie, user not authenticated.");
    return null;
  }

  try {
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
    
    if (!refreshToken) {
      console.log(`Refresh token missing for user ${uid}`);
      return null;
    }
    
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });
    
    // The library will automatically handle refreshing the access token if it's expired.
    return oauth2Client;
  } catch (error) {
    console.error('Error getting authenticated Google client:', error);
    return null;
  }
}
