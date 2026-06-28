import { NextRequest, NextResponse } from 'next/server';
import { fixNowAIService } from '@/lib/ai/service';

export async function POST(req: NextRequest) {
  try {
    const { issueText } = await req.json();

    if (!issueText) {
      return NextResponse.json({ success: false, error: "No text provided" }, { status: 400 });
    }

    const messages = [
      {
        role: 'user',
        content: `You are FixNow AI.

Analyze the user's issue text. The user context may be in various Indian languages or English.
Issue Text: "${issueText}"

You MUST return ONLY a valid JSON object. Do NOT wrap it in markdown. Do NOT add any conversational text before or after the JSON. Start your response with { and end it with }.

{
  "problem": "",
  "category": "",
  "severity": "",
  "confidence": 0,
  "recommendedTechnician": "",
  "estimatedCostMin": 0,
  "estimatedCostMax": 0,
  "estimatedRepairTime": "",
  "urgency": "",
  "possibleCauses": [],
  "requiredMaterials": [],
  "requiredTools": [],
  "safetyTips": [],
  "summary": ""
}

Category MUST be one of: "HVAC / AC Technician", "Electrician", "Washing Machine Technician", "Water Systems Technician", "Refrigerator Technician", "Kitchen Services Technician", "Installation Services Technician", "Gas & Utilities", "Carpentry", "Plumbing", "Electronics & Smart Home", "Pest Control", "Cleaning Services", "Painter", "Renovation Service", "Moving & Misc", "Bike Mechanics", "Car Mechanics", "Rural Area Technicians".
Return "INVALID" for category if input is nonsense.`
      }
    ];

    // This perfectly routes it through CascadeAgent (drafter/verifier) AND Hindsight memory
    const rawText = await fixNowAIService.ask(messages, 'system', 'anonymous');
    
    let data;
    try {
      const cleaned = rawText
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

      const first = cleaned.indexOf("{");
      const last = cleaned.lastIndexOf("}");

      if (first === -1 || last === -1) {
        throw new Error("No JSON object found");
      }

      const jsonString = cleaned.slice(first, last + 1);
      data = JSON.parse(jsonString);
    } catch (e) {
      throw new Error("No valid JSON found in AI response");
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('[API /api/ai/parse-issue] Error:', error);
    return NextResponse.json({ success: false, error: 'AI processing failed' }, { status: 500 });
  }
}
