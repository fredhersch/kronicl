import { NextResponse } from 'next/server';

export async function GET() {
  // Test environment variable access
  const envTest = {
    nodeEnv: process.env.NODE_ENV,
    // Gemini API keys
    geminiApiKey: !!process.env.GEMINI_API_KEY,
    geminiApiKeyPreview: process.env.GEMINI_API_KEY?.substring(0, 10) + '...',
    googleApiKey: !!process.env.GOOGLE_API_KEY,
    // Google OAuth keys for Photos API
    googleClientId: !!process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    googleRedirectUri: process.env.GOOGLE_REDIRECT_URI,
    // All relevant environment variables
    allRelevantKeys: Object.keys(process.env).filter(key => 
      key.includes('GEMINI') || key.includes('GOOGLE')
    )
  };
  
  return NextResponse.json(envTest);
}
