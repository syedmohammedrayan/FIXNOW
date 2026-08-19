import { NextRequest, NextResponse } from 'next/server';
import { SarvamAIClient } from "sarvamai";

const client = new SarvamAIClient({
    apiSubscriptionKey: process.env.SARVAM_API_KEY || ""
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userMessages = body.messages || [];

    const systemPrompt = "You are FixNow AI Assistant. Answer queries related to FixNow services, how it works, tracking, complaints, and IoT-based sensoring. Keep answers concise, helpful, and professional.";

    const messages = [
        { role: 'system', content: systemPrompt },
        ...userMessages.map((m: any) => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.content
        }))
    ];

    console.log('[AI Chatbot] Generating response via Sarvam 105B...');
    const response = await client.chat.completions({
        model: "sarvam-105b-conversations",
        messages: messages as any,
        temperature: 0.2,
        top_p: 1,
        max_tokens: 2000,
    });

    const responseText = response.choices[0].message.content || '';

    return NextResponse.json({
      text: responseText,
      reply: responseText, // Added reply to fix FloatingChatbot mapping
      success: true
    });
  } catch (error: any) {
    console.error('[API /api/ai] Execution error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
