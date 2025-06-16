
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Use environment variable for API key
const apiKey = process.env.GOOGLE_API_KEY;

console.log('Genkit initialization - API Key present:', !!apiKey);
console.log('Genkit initialization - Environment:', process.env.NODE_ENV);

if (!apiKey) {
  console.error('GOOGLE_API_KEY environment variable is not set');
  throw new Error('GOOGLE_API_KEY environment variable is required. Please set it in your .env.local file');
}

let ai: any;

try {
  ai = genkit({
    plugins: [googleAI({ apiKey })],
    model: 'googleai/gemini-1.5-flash', // Using more stable model
  });
  
  console.log('Genkit initialized successfully with model: googleai/gemini-1.5-flash');
} catch (error) {
  console.error('Failed to initialize Genkit:', error);
  throw new Error(`Failed to initialize AI system: ${error instanceof Error ? error.message : 'Unknown error'}`);
}

export { ai };

