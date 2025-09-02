import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Debug environment variables (only in debug mode)
if (typeof process !== 'undefined') {
  // Import debug utilities (server-side safe)
  const isDebug = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEBUG_MODE === 'true';
  
  if (isDebug) {
    console.log('=== Genkit Environment Check ===');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY);
    console.log('GOOGLE_API_KEY exists:', !!process.env.GOOGLE_API_KEY);
    if (process.env.GEMINI_API_KEY) {
      console.log('GEMINI_API_KEY value (first 10 chars):', process.env.GEMINI_API_KEY.substring(0, 10) + '...');
    }
  }
}

// Validate Gemini API key
const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
if (!geminiApiKey) {
  console.error('❌ Missing GEMINI_API_KEY or GOOGLE_API_KEY environment variable.');
  console.error('Available env vars:', Object.keys(process.env).filter(key => key.includes('GEMINI') || key.includes('GOOGLE')));
  console.error('To fix: Add GEMINI_API_KEY=your_api_key to your .env file');
  throw new Error('GEMINI_API_KEY or GOOGLE_API_KEY environment variable is required');
}

// Debug success message
if (typeof process !== 'undefined' && (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEBUG_MODE === 'true')) {
  console.log('✅ Gemini API key found, initializing Genkit...');
}

export const ai = genkit({
  plugins: [googleAI({
    apiKey: geminiApiKey
  })],
  model: 'googleai/gemini-2.0-flash',
});
