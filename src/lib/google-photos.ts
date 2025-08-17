'use server';

import { google } from 'googleapis';
import { getAuthenticatedClient } from './google-auth';

export async function getGooglePhotos() {
  try {
    const oauth2Client = await getAuthenticatedClient();
    
    if (!oauth2Client) {
      console.log("User is not authenticated with Google, cannot fetch photos.");
      return [];
    }

    const photoslibrary = google.photoslibrary({
      version: 'v1',
      auth: oauth2Client,
    });

    const response = await photoslibrary.mediaItems.search({
      requestBody: {
        pageSize: 25, // Fetches the most recent 25 items
        // We fetch both photos and videos now
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
    // It's better to return empty than to throw an error and crash the picker.
    return [];
  }
}
