import { NextResponse } from 'next/server';

export async function GET() {
  // Only available in development or when debug mode is enabled
  const isDebug = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEBUG_MODE === 'true';
  
  if (!isDebug) {
    return NextResponse.json({ error: 'Debug mode not enabled' }, { status: 404 });
  }

  try {
    console.log('🔍 Testing Google APIs availability...');
    
    // Dynamic import to avoid issues
    const { google } = await import('googleapis');
    
    // Check what's available
    const availableApis = Object.keys(google);
    console.log('📋 Available Google APIs:', availableApis);
    
    // Check specific APIs
    const apiDetails = {
      photoslibrary: !!google.photoslibrary,
      drive: !!google.drive,
      calendar: !!google.calendar,
      gmail: !!google.gmail,
      youtube: !!google.youtube,
    };
    
    console.log('🔍 API Details:', apiDetails);
    
    // Try to create a photoslibrary instance if available
    let photoslibraryTest = null;
    if (google.photoslibrary) {
      try {
        photoslibraryTest = google.photoslibrary({
          version: 'v1',
        });
        console.log('✅ Photos Library API instance created successfully');
      } catch (error: any) {
        photoslibraryTest = { error: error.message };
        console.log('❌ Failed to create Photos Library API instance:', error.message);
      }
    }
    
    const debugInfo = {
      timestamp: new Date().toISOString(),
      availableApis,
      apiDetails,
      photoslibraryTest: photoslibraryTest ? 'Available' : 'Not Available',
      googleObjectKeys: Object.keys(google),
      googleObjectType: typeof google,
      googleConstructor: google.constructor?.name,
    };
    
    return NextResponse.json(debugInfo);
    
  } catch (error: any) {
    console.error('❌ Google APIs debug endpoint error:', error);
    return NextResponse.json({ 
      error: 'Google APIs debug endpoint failed',
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
