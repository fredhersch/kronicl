'use server';

import { initializeApp, getApps, App, credential } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';
import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';

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


async function getAccessTokenFromSession() {
    const sessionCookie = cookies().get('__session')?.value;
    if (!sessionCookie) {
      console.warn('getAccessTokenFromSession: No session cookie found. User is not authenticated.');
      return null;
    }
  
    initAdmin();
    
    try {
      const decodedIdToken = await getAuth().verifySessionCookie(sessionCookie, true);
      await getAuth().getUser(decodedIdToken.uid);
  
      // This is a simplified token management approach for the prototype.
      // In a production app, you would securely store and refresh the user's OAuth2 refresh token.
      const auth = new GoogleAuth({
          scopes: ['https://www.googleapis.com/auth/photoslibrary.readonly'],
          // This will not work for user data access. This is a placeholder.
          // Correct implementation requires a full OAuth2 flow to get user-specific tokens.
      });

      // The following line is a placeholder and will not work as intended for fetching user-specific data
      // without a proper OAuth2 refresh token flow. For this prototype, we're using a single
      // server-wide access token set in the environment variables.
      const accessToken = process.env.GOOGLE_OAUTH_ACCESS_TOKEN;
       if (!accessToken) {
        console.error("Missing GOOGLE_OAUTH_ACCESS_TOKEN. The Google Photos API will not work without it.");
        throw new Error('Server is not configured for Google Photos API access.');
      }
      return accessToken;

    } catch (error) {
      console.error('Error getting access token', error);
      // Return null if token verification fails
      return null;
    }
}


export async function getGooglePhotos() {
  const accessToken = await getAccessTokenFromSession();
  
  if (!accessToken) {
    console.log("No access token available, returning empty array for Google Photos.");
    return [];
  }
  
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  const photoslibrary = google.photoslibrary({
    version: 'v1',
    auth: oauth2Client,
  });

  try {
    const response = await photoslibrary.mediaItems.search({
      requestBody: {
        pageSize: 25, // Fetches the most recent 25 items
        filters: {
          mediaTypeFilter: {
            mediaTypes: ['PHOTO'],
          },
        },
      },
    });
    
    return response.data.mediaItems || [];
  } catch (error: any) {
     console.error('Error fetching Google Photos:', error.response?.data || error.message);
    // This could be due to an expired or invalid access token, or missing permissions.
    throw new Error('Failed to retrieve photos from Google Photos API.');
  }
}
