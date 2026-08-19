import { NextRequest, NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const image = formData.get('image') as File;
    const userText = formData.get('userText') as string;

    if (!image) {
      return NextResponse.json({ success: false, error: "No image provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await image.arrayBuffer());
    const base64Image = buffer.toString("base64");
    const mimeType = image.type || 'image/jpeg';

    const promptText = `You are FixNow AI.

Analyze images. These could be home repair issues OR documents/invoices/receipts.
The user context may be in various Indian languages or English: "${userText || 'No description provided'}".

If the image is a document, invoice, or receipt:
- Set category to "Document / Invoice"
- Extract the document type and put it in "summary"
- Put all visible text into "ocr"
- Extract details into the "documentDetails" object:
  - isFixNow: true if it mentions FixNow, else false
  - productType: the type of product/service the invoice is for
  - warrantyDate: the date the warranty expires, or purchase date if not stated
  - warrantyValid: true if the document implies active warranty
  - amount: extract the total billing amount as a number
  - specs: array of strings containing technical specs or details
  - recommendedTechnicianCategory: identify the specific repair category needed for the product (e.g. "Electronics & Smart Home" for Dell, "Washing Machine Technician" for LG Washer) from the main category list below.
- Do NOT return "INVALID" for documents.

If the image is a home repair issue:
- Diagnose the problem and fill all fields accordingly.
- Pick a repair Category from the list below.

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
  "ocr": "",
  "summary": "",
  "documentDetails": {
    "isFixNow": false,
    "productType": "",
    "warrantyDate": "",
    "warrantyValid": false,
    "amount": 0,
    "specs": [],
    "recommendedTechnicianCategory": ""
  }
}

Category MUST be one of: "Document / Invoice", "HVAC / AC Technician", "Electrician", "Washing Machine Technician", "Water Systems Technician", "Refrigerator Technician", "Kitchen Services Technician", "Installation Services Technician", "Gas & Utilities", "Carpentry", "Plumbing", "Electronics & Smart Home", "Pest Control", "Cleaning Services", "Painter", "Renovation Service", "Moving & Misc", "Bike Mechanics", "Car Mechanics", "Rural Area Technicians".
Return "INVALID" for category if input is completely unreadable nonsense.`;

    const extractJson = (rawText: string) => {
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
      return JSON.parse(jsonString);
    };

    const isRecoverableError = (err: any) => {
      if (err.status && (err.status === 429 || err.status >= 500)) return true;
      if (err.message && (
        err.message.includes('rate limit') ||
        err.message.includes('quota') ||
        err.message.includes('timeout') ||
        err.message.includes('503') ||
        err.message.includes('500') ||
        err.message.includes('overloaded') ||
        err.message.includes('JSON')
      )) return true;
      return false;
    };

    // ---- STEP 1: Gemini Primary ----
    try {
      console.log('[Frontend AI Vision] Trying Gemini Primary');
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
      const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

      const result = await model.generateContent([
        { text: promptText },
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType
          }
        }
      ]);

      const response = await result.response;
      const data = extractJson(response.text());
      console.log('[Frontend AI Vision] Gemini succeeded');
      return NextResponse.json({ success: true, data });
    } catch (geminiErr: any) {
      if (!isRecoverableError(geminiErr)) {
        console.error('[Frontend AI Vision] Gemini non-recoverable error:', geminiErr);
        return NextResponse.json({ success: false, error: 'AI processing failed' }, { status: 500 });
      }
      console.warn('[Frontend AI Vision] Gemini failed (recoverable). Falling back to Groq:', geminiErr.message);
    }

    // ---- STEP 2: Groq Fallback ----
    try {
      console.log('[Frontend AI Vision] Trying Groq Fallback');
      const groqApiKey = process.env.GROQ_API_KEY;
      if (!groqApiKey) {
        throw new Error("GROQ_API_KEY not configured");
      }
      
      const groq = new Groq({ apiKey: groqApiKey });

      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: [
              { type: "text", text: promptText },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`
                }
              }
            ]
          }
        ] as any,
        model: "groq/compound",
        temperature: 0.7,
        max_tokens: 1024,
      });

      const rawText = chatCompletion.choices[0]?.message?.content || '';
      const data = extractJson(rawText);
      console.log('[Frontend AI Vision] Groq succeeded');
      
      return NextResponse.json({ success: true, data });
    } catch (groqErr: any) {
      console.error('[Frontend AI Vision] Groq fallback failed:', groqErr);
      return NextResponse.json({ success: false, error: 'AI processing failed on both providers' }, { status: 500 });
    }

  } catch (error: any) {
    console.error('[API /api/ai/analyze-image] Outer Error:', error);
    return NextResponse.json({ success: false, error: 'AI processing failed' }, { status: 500 });
  }
}
