import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userMessages = body.messages || [];

    const systemPrompt = "You are FixNow AI Assistant. Answer queries related to FixNow services, how it works, tracking, complaints, and IoT-based sensoring. Keep answers concise, helpful, and professional.";

    const contents = userMessages.map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash-preview",
      systemInstruction: { role: "system", parts: [{ text: systemPrompt }] }
    });

    console.log('[AI Chatbot] Generating response via Gemini 3 Flash Preview...');
    
    const result = await model.generateContent({ contents });
    const responseText = result.response.text();

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
