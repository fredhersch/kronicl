import { NextResponse } from 'next/server';

export async function GET() {
  // Test environment variable access
  const envTest = {
    nodeEnv: process.env.NODE_ENV,
    // Gemini API keys
    geminiApiKey: !!process.env.GEMINI_API_KEY,
    geminiApiKeyPreview: process.env.GEMINI_API_KEY?.substring(0, 10) + '...',
    googleApiKey: !!process.env.GOOGLE_API_KEY,
    // All relevant environment variables
    allRelevantKeys: Object.keys(process.env).filter(key => 
      key.includes('GEMINI') || key.includes('GOOGLE_MAPS')
    )
  };
  
  return NextResponse.json(envTest);
}
