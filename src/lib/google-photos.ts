'use server';

import { getAuthenticatedClient } from './google-auth';

export async function getGooglePhotos() {
  try {
    console.log('🔍 Starting Google Photos fetch...');
    
    const oauth2Client = await getAuthenticatedClient();
    
    if (!oauth2Client) {
      console.log("❌ User is not authenticated with Google, cannot fetch photos.");
      return [];
    }

    console.log('✅ OAuth client authenticated, using direct REST API...');
    
    // Debug: Check what credentials are set on the OAuth client
    const credentials = oauth2Client.credentials;
    console.log('🔍 OAuth client credentials:', {
      hasAccessToken: !!credentials.access_token,
      hasRefreshToken: !!credentials.refresh_token,
      hasScope: !!credentials.scope,
      scope: credentials.scope,
      tokenExpiry: credentials.expiry_date
    });

    // Use the REST API directly since google.photoslibrary seems to have issues
    try {
      console.log('🔍 Searching for media items using REST API...');
      
      const response = await oauth2Client.request({
        url: 'https://photoslibrary.googleapis.com/v1/mediaItems:search',
        method: 'POST',
        data: {
          pageSize: 25,
          filters: {
            mediaTypeFilter: {
              mediaTypes: ['PHOTO'],
            },
          },
        },
      });
      
      const mediaItems = response.data.mediaItems || [];
      console.log(`✅ Found ${mediaItems.length} media items using REST API`);
      
      return mediaItems;
    } catch (apiError: any) {
      console.error('❌ REST API call failed:', apiError);
      
      // Log detailed error information
      if (apiError.response?.data) {
        console.error('API Error Details:', apiError.response.data);
      }
      if (apiError.code) {
        console.error('Error Code:', apiError.code);
      }
      if (apiError.message) {
        console.error('Error Message:', apiError.message);
      }
      
      throw apiError;
    }
    
  } catch (error: any) {
    console.error('❌ Error fetching Google Photos:', error);
    
    // More detailed error logging
    if (error.response?.data) {
      console.error('API Error Details:', error.response.data);
    }
    if (error.code) {
      console.error('Error Code:', error.code);
    }
    if (error.message) {
      console.error('Error Message:', error.message);
    }
    
    // This could be due to an expired or invalid access token, or missing permissions.
    // It's better to return empty than to throw an error and crash the picker.
    return [];
  }
}
