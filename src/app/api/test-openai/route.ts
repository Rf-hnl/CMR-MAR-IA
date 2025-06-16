import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID;

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Testing OpenAI in Next.js API route...');
    console.log('🔧 API Key exists:', !!process.env.OPENAI_API_KEY);
    console.log('🔧 Assistant ID exists:', !!ASSISTANT_ID);
    console.log('🔧 Assistant ID value:', ASSISTANT_ID);

    // Test thread creation
    console.log('🧵 Creating thread...');
    const thread = await openai.beta.threads.create();
    console.log('✅ Thread created:', thread.id);

    if (!thread.id) {
      throw new Error('Thread ID is undefined');
    }

    // Test message creation
    console.log('💬 Creating message...');
    const message = await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: "Test message from Next.js API"
    });
    console.log('✅ Message created:', message.id);

    // Test assistant run
    console.log('🚀 Creating run...');
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: ASSISTANT_ID!,
    });
    console.log('✅ Run created:', run.id);

    return NextResponse.json({
      success: true,
      threadId: thread.id,
      messageId: message.id,
      runId: run.id
    });

  } catch (error: any) {
    console.error('❌ OpenAI test failed in API route:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      details: {
        name: error.name,
        status: error.status,
        type: error.type
      }
    }, { status: 500 });
  }
}