// Next.js Route Handler — runs server-side so API keys are never exposed to the browser.
// This is the AI issue-parsing endpoint: it converts a customer's natural language problem
// description into a structured JSON object with category, cost estimate, and repair steps.
import { NextRequest, NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Both providers are initialised at module scope; whichever one is available handles the request.
// Both providers are initialised at module scope; whichever one is available handles the request.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// POST /api/ai/parse-issue — called when the customer submits their issue description.
export async function POST(req: NextRequest) {
  try {
    const { issueText } = await req.json();

    if (!issueText) {
      return NextResponse.json({ success: false, error: "No text provided" }, { status: 400 });
    }

    // The prompt instructs the AI to output a strict JSON schema with no conversational text.
    // Forcing JSON-only output reduces parsing errors from the AI adding explanatory prose.
    const promptText = `You are FixNow AI.

Analyze the user's issue text. The user context may be in various Indian languages or English.
Issue Text: "${issueText}"

You MUST return ONLY a valid JSON object. Do NOT wrap it in markdown. Do NOT add any conversational text before or after the JSON. Start your response with { and end it with }.

{
  "problem": "",
  "recommendedRepair": "Detailed, step-by-step solution for how the technician will resolve this specific damage/issue.",
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
Return "INVALID" for category if input is nonsense.`;

    let rawText = '';
    
    // Step 1: Try Gemini first (primary provider — faster, higher quality).
    try {
      console.log('[AI Parse] Trying Gemini');
      const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash-lite" });
      const result = await model.generateContent(promptText);
      const response = await result.response;
      rawText = response.text();
    } catch (geminiError: any) {
      console.warn('[AI Parse] Gemini failed, falling back to NVIDIA:', geminiError.message);
      
      // Step 2: NVIDIA fallback — used when Gemini is rate-limited or unavailable.
      const axios = require('axios');
      const nvidiaResponse = await axios.post(`${process.env.NVIDIA_BASE_URL}/chat/completions`, {
          model: process.env.NVIDIA_MODEL || 'nvidia/nemotron-3.5-lightning-30b-a3b',
          messages: [{ role: 'user', content: promptText }],
          response_format: { type: "json_object" }
        }, {
        headers: {
          'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // Add a 30-second timeout to prevent hanging
      });
      
      const completion = nvidiaResponse.data;
      rawText = completion.choices[0]?.message?.content || ''; console.log("[AI Parse] NVIDIA rawText:", rawText);
    }
    
    // Defensive JSON extraction: strip markdown fences and find the first { ... } block.
    // Necessary because some model responses still wrap JSON in ```json ``` despite the prompt.
    let data;
    try {
      const cleaned = (rawText || "")
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

      // Find the outermost JSON object boundaries to handle leading/trailing prose.
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
