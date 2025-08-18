import { NextResponse } from 'next/server';
import { getAuthenticatedClient } from '@/lib/google-auth';
import { getGooglePhotos } from '@/lib/google-photos';

export async function GET() {
  // Only available in development or when debug mode is enabled
  const isDebug = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEBUG_MODE === 'true';
  
  if (!isDebug) {
    return NextResponse.json({ error: 'Debug mode not enabled' }, { status: 404 });
  }

  try {
    console.log('🔍 Testing Google Photos authentication...');
    
    // Test 1: Check environment variables
    const envCheck = {
      googleClientId: !!process.env.GOOGLE_CLIENT_ID,
      googleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      googleRedirectUri: process.env.GOOGLE_REDIRECT_URI,
    };
    
    console.log('📋 Environment variables check:', envCheck);
    
    // Test 2: Try to get authenticated client
    let authClient = null;
    let authError = null;
    try {
      authClient = await getAuthenticatedClient();
      console.log('✅ Authentication client created successfully');
    } catch (error: any) {
      authError = {
        message: error.message,
        code: error.code,
        stack: error.stack
      };
      console.log('❌ Failed to create authentication client:', authError);
    }
    
    // Test 3: Try to fetch photos (if auth client is available)
    let photosResult = null;
    let photosError = null;
    if (authClient) {
      try {
        console.log('🔍 Testing direct REST API call...');
        
        // Test the REST API directly first
        const testResponse = await authClient.request({
          url: 'https://photoslibrary.googleapis.com/v1/mediaItems:search',
          method: 'POST',
          data: {
            pageSize: 5, // Just test with a small number
            filters: {
              mediaTypeFilter: {
                mediaTypes: ['PHOTO'],
              },
            },
          },
        });
        
        console.log('✅ Direct REST API test successful:', testResponse.data);
        
        // Now try the full getGooglePhotos function
        const photos = await getGooglePhotos();
        photosResult = {
          count: photos.length,
          sample: photos.slice(0, 3).map(p => ({ id: p.id, filename: p.filename })),
          directApiTest: 'Success'
        };
        console.log('✅ Photos fetched successfully:', photosResult);
      } catch (error: any) {
        photosError = {
          message: error.message,
          code: error.code,
          stack: error.stack
        };
        console.log('❌ Failed to fetch photos:', photosError);
      }
    }
    
    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        ...envCheck
      },
      authentication: {
        success: !!authClient,
        error: authError
      },
      photos: {
        success: !!photosResult,
        result: photosResult,
        error: photosError
      }
    };
    
    return NextResponse.json(debugInfo);
    
  } catch (error: any) {
    console.error('❌ Debug endpoint error:', error);
    return NextResponse.json({ 
      error: 'Debug endpoint failed',
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
