import { NextResponse } from 'next/server';
import { getAuthenticatedClient } from '@/lib/google-auth';

export async function GET() {
  try {
    console.log('🧪 Testing Google Photos API access...');
    
    const oauth2Client = await getAuthenticatedClient();
    
    if (!oauth2Client) {
      return NextResponse.json({ error: 'No authenticated client' }, { status: 401 });
    }

    const credentials = oauth2Client.credentials;
    console.log('🔍 Test credentials:', {
      hasAccessToken: !!credentials.access_token,
      hasRefreshToken: !!credentials.refresh_token,
      scope: credentials.scope,
      tokenExpiry: credentials.expiry_date
    });

    // Test 1: Try to get user info first (this should work with userinfo scopes)
    try {
      console.log('🧪 Test 1: Getting user info...');
      const userInfoResponse = await oauth2Client.request({
        url: 'https://www.googleapis.com/oauth2/v2/userinfo',
        method: 'GET',
      });
      console.log('✅ User info test successful:', userInfoResponse.data.email);
    } catch (error: any) {
      console.error('❌ User info test failed:', error.message);
    }

    // Test 2: Try Photos Library API with different approaches
    console.log('🧪 Test 2: Testing Photos Library API with different approaches...');
    
    // Approach A: Try without filters first
    try {
      console.log('🧪 Approach A: Basic search without filters...');
      const photosResponse = await oauth2Client.request({
        url: 'https://photoslibrary.googleapis.com/v1/mediaItems:search',
        method: 'POST',
        data: {
          pageSize: 1,
        },
      });
      console.log('✅ Approach A successful:', photosResponse.data);
      return NextResponse.json({ 
        success: true, 
        approach: 'A',
        data: photosResponse.data
      });
    } catch (error: any) {
      console.error('❌ Approach A failed:', error.message);
    }

    // Approach B: Try with explicit authorization header
    try {
      console.log('🧪 Approach B: With explicit authorization header...');
      const photosResponse = await oauth2Client.request({
        url: 'https://photoslibrary.googleapis.com/v1/mediaItems:search',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${credentials.access_token}`,
          'Content-Type': 'application/json',
        },
        data: {
          pageSize: 1,
        },
      });
      console.log('✅ Approach B successful:', photosResponse.data);
      return NextResponse.json({ 
        success: true, 
        approach: 'B',
        data: photosResponse.data
      });
    } catch (error: any) {
      console.error('❌ Approach B failed:', error.message);
    }

    // Approach C: Try a different Photos API endpoint
    try {
      console.log('🧪 Approach C: Try albums endpoint...');
      const albumsResponse = await oauth2Client.request({
        url: 'https://photoslibrary.googleapis.com/v1/albums',
        method: 'GET',
      });
      console.log('✅ Approach C successful:', albumsResponse.data);
      return NextResponse.json({ 
        success: true, 
        approach: 'C',
        data: albumsResponse.data
      });
    } catch (error: any) {
      console.error('❌ Approach C failed:', error.message);
    }

    return NextResponse.json({ 
      success: false, 
      error: 'All approaches failed',
      userInfo: 'Working',
      photosAPI: 'Failing'
    }, { status: 400 });

  } catch (error: any) {
    console.error('❌ Test endpoint error:', error);
    return NextResponse.json({ 
      error: 'Test failed', 
      message: error.message 
    }, { status: 500 });
  }
}
