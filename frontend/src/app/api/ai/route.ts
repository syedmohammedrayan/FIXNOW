import { NextRequest, NextResponse } from 'next/server';
import { AIGateway } from '@/lib/ai/gateway/gateway.service';

const gateway = new AIGateway();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    return await gateway.handleAIRequest(
      body.messages || [],
      body.role,
      body.userId
    );
  } catch (error: any) {
    console.error('[API /api/ai] Execution error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
