import { fixNowAIService } from '../service';

import { NextResponse } from 'next/server';

export class AIGateway {
  /**
   * The Gateway is now simply an entry point that delegates to the FixNowAIService.
   * No direct references to Hindsight, Groq, or CascadeAgent exist here.
   */
  async handleAIRequest(messages: any[], role: string = 'customer', userId: string = 'anonymous') {
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw new Error('Invalid request: messages array is required and must not be empty.');
    }

    const reply = await fixNowAIService.ask(messages, role, userId);
    
    console.log("FINAL AI REPLY:", reply);

    return NextResponse.json({
      success: true,
      reply,
    });
  }
}
