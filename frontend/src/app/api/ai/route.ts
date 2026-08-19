import { NextRequest, NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userMessages = body.messages || [];

    const systemPrompt = `You are FixNow AI Assistant, a helpful customer service chatbot for FixNow. FixNow provides professional repair and maintenance services.`;

    let responseText = '';

    // --- STEP 1: Try Gemini Primary ---
    try {
      console.log('[AI Chatbot] Trying Gemini');
      const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
      
      const chat = model.startChat({
        history: userMessages.slice(0, -1).map((m: any) => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }]
        }))
      });

      const lastMessage = userMessages[userMessages.length - 1];
      const result = await chat.sendMessage(`${systemPrompt}\n\nUser: ${lastMessage?.content || ''}`);
      const response = await result.response;
      responseText = response.text();
    } catch (geminiError: any) {
      console.warn('[AI Chatbot] Gemini failed, falling back to Groq:', geminiError.message);
      
      // --- STEP 2: Try Groq Fallback ---
      const messages = [
        { role: 'system', content: systemPrompt },
        ...userMessages
      ];

      const completion = await groq.chat.completions.create({
        messages: messages as any,
        model: "groq/compound",
      });

      responseText = completion.choices[0].message.content || '';
    }

    return NextResponse.json({
      text: responseText,
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
