// Next.js Route Handler — runs on the server, so the GEMINI_API_KEY stays secret.
// This is the chatbot endpoint that powers the floating AI assistant on every page.
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Instantiated once at module level to reuse the connection across requests.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// POST /api/ai — accepts a conversation history and returns the AI assistant's next reply.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // userMessages is the full conversation history (role: user | assistant) so the model has context.
    const userMessages = body.messages || [];

    // System prompt scopes the AI to FixNow-related topics to prevent off-topic or harmful responses.
    const systemPrompt = "You are FixNow AI Assistant. Answer queries related to FixNow services, how it works, tracking, complaints, and IoT-based sensoring. Keep answers concise, helpful, and professional.";

    // Gemini uses 'user' / 'model' roles (not 'user' / 'assistant' like OpenAI).
    const contents = userMessages.map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash-lite",
      // systemInstruction sets a persistent context that the model follows throughout the conversation.
      systemInstruction: { role: "system", parts: [{ text: systemPrompt }] }
    });

    console.log('[AI Chatbot] Generating response via Gemini 3 Flash Preview...');
    
    try {
      const result = await model.generateContent({ contents });
      const responseText = result.response.text();

      return NextResponse.json({
        text: responseText,
        reply: responseText,
        success: true
      });
    } catch (geminiError: any) {
      console.warn('[AI Chatbot] Gemini failed, falling back to NVIDIA:', geminiError.message);
      
      const nvidiaResponse = await fetch(`${process.env.NVIDIA_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: process.env.NVIDIA_MODEL || "nvidia/nemotron-3.5-lightning-30b-a3b",
          messages: [
            { role: "system", content: systemPrompt },
            ...userMessages.map((m: any) => ({ role: m.role === 'model' ? 'assistant' : m.role, content: m.content }))
          ]
        })
      });

      if (!nvidiaResponse.ok) {
        throw new Error(`NVIDIA API Error: ${nvidiaResponse.status}`);
      }

      const completion = await nvidiaResponse.json();
      const responseText = completion.choices[0]?.message?.content || '';

      return NextResponse.json({
        text: responseText,
        reply: responseText,
        success: true
      });
    }
  } catch (error: any) {
    console.error('[API /api/ai] Execution error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
