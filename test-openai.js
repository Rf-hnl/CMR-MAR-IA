// Test OpenAI connection
const OpenAI = require('openai');
require('dotenv').config({ path: '.env.local' });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID;

async function testOpenAI() {
  try {
    console.log('🔧 API Key exists:', !!process.env.OPENAI_API_KEY);
    console.log('🔧 Assistant ID exists:', !!ASSISTANT_ID);
    console.log('🔧 Assistant ID value:', ASSISTANT_ID);

    // Test 1: List assistants to verify connection
    console.log('\n📋 Testing OpenAI connection...');
    const assistants = await openai.beta.assistants.list({ limit: 1 });
    console.log('✅ OpenAI connection successful');
    console.log('📊 Found assistants:', assistants.data.length);

    // Test 2: Try to retrieve our specific assistant
    console.log('\n🔍 Testing assistant retrieval...');
    try {
      const assistant = await openai.beta.assistants.retrieve(ASSISTANT_ID);
      console.log('✅ Assistant found:', assistant.name || assistant.id);
    } catch (assistantError) {
      console.error('❌ Assistant not found:', assistantError.message);
    }

    // Test 3: Create a simple thread
    console.log('\n🧵 Testing thread creation...');
    const thread = await openai.beta.threads.create();
    console.log('✅ Thread created:', thread.id);

    // Test 4: Send a simple message
    console.log('\n💬 Testing message creation...');
    const message = await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: "Hello, this is a test message."
    });
    console.log('✅ Message created:', message.id);

    console.log('\n🎉 All tests passed!');

  } catch (error) {
    console.error('❌ OpenAI test failed:', error);
    console.error('📄 Error details:', {
      message: error.message,
      status: error.status,
      type: error.type
    });
  }
}

testOpenAI();