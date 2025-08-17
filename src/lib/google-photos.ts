'use server';

import { auth as adminAuth } from 'firebase-admin';
import { auth } from 'firebase-admin';
import { cookies } from 'next/headers';
import { google } from 'googleapis';

const initAdmin = async () => {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccount) {
    throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_KEY environment variable');
  }

  const alreadyCreated = adminAuth.getApp();
  if (alreadyCreated) {
    return alreadyCreated;
  }

  return auth.cert(JSON.parse(serviceAccount));
};


export async function getGooglePhotos() {
  await initAdmin();
  const sessionCookie = cookies().get('__session')?.value;
  if (!sessionCookie) {
    throw new Error('Not authenticated');
  }

  try {
    const decodedIdToken = await adminAuth().verifySessionCookie(sessionCookie, true);
    const user = await adminAuth().getUser(decodedIdToken.uid);

    const googleAuthProvider = user.providerData.find(
      (provider) => provider.providerId === 'google.com'
    );
    
    if (!googleAuthProvider) {
      throw new Error('User not signed in with Google');
    }
    
    // This is a placeholder for getting a valid access token.
    // In a real application, you would need to securely store and refresh the user's OAuth2 access token.
    // For this prototype, we rely on a temporary workaround. This is NOT production-ready.
    // A full implementation would require a backend service to handle the OAuth2 flow and token refreshing.
    const accessToken = process.env.GOOGLE_OAUTH_ACCESS_TOKEN;

    if (!accessToken) {
        console.error("Missing GOOGLE_OAUTH_ACCESS_TOKEN. The Google Photos API will not work without it.");
        throw new Error('Server is not configured for Google Photos API access.');
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const photoslibrary = google.photoslibrary({
      version: 'v1',
      auth: oauth2Client,
    });

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
