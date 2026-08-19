import { NextRequest, NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userMessages = body.messages || [];

    const messages = [
      {
        role: 'system',
        content: `You are FixNow AI Assistant, a helpful customer service chatbot for FixNow. FixNow provides professional repair and maintenance services.`
      },
      ...userMessages
    ];

    const completion = await groq.chat.completions.create({
      messages: messages as any,
      model: "groq/compound",
    });

    const responseText = completion.choices[0].message.content;

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
