// Next.js Route Handler — runs server-side so Gemini and Groq API keys stay secret.
// This endpoint handles multimodal AI analysis: it accepts an image (home damage photo
// OR a warranty/invoice document) and returns a structured JSON diagnosis.
import { NextRequest, NextResponse } from 'next/server';

import { GoogleGenerativeAI } from '@google/generative-ai';

// POST /api/ai/analyze-image — called when the customer uploads a photo of their issue.
export async function POST(req: NextRequest) {
  try {
    // Image arrives as multipart form data alongside optional descriptive text.
    const formData = await req.formData();
    const image = formData.get('image') as File;
    const userText = formData.get('userText') as string;

    if (!image) {
      return NextResponse.json({ success: false, error: "No image provided" }, { status: 400 });
    }

    // Convert the File object to base64 so it can be embedded in the Gemini/Groq API payload.
    // Gemini's inlineData and Groq's image_url both accept base64-encoded images.
    const buffer = Buffer.from(await image.arrayBuffer());
    const base64Image = buffer.toString("base64");
    const mimeType = image.type || 'image/jpeg';

    // The prompt handles two distinct input types: home repair photos and invoices/receipts.
    // A single prompt handles both cases so we need only one API call.
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

    // extractJson strips markdown fences and extracts the first { ... } block from the AI response.
    // Necessary because some models still prepend text despite being instructed not to.
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

    // isRecoverableError classifies errors as transient (should retry with fallback) vs permanent.
    // Rate limits (429), server errors (5xx), and JSON parse errors are recoverable.
    const isRecoverableError = (err: any) => {
      if (err.status && (err.status === 429 || err.status >= 500 || err.status === 404)) return true;
      if (err.message && (
        err.message.includes('404') ||
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

    // Step 1: Gemini Primary — multimodal, handles both image and text in the same call.
    try {
      console.log('[Frontend AI Vision] Trying Gemini Primary');
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
      const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash-lite' });

      // Gemini's generateContent accepts an array of content parts (text + inlineData).
      const result = await model.generateContent([
        { text: promptText },
        {
          // inlineData sends the image as base64 embedded in the request body.
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
      // Non-recoverable errors (auth failure, invalid key) — don't bother trying Groq.
      if (!isRecoverableError(geminiErr)) {
        console.error('[Frontend AI Vision] Gemini non-recoverable error:', geminiErr);
        return NextResponse.json({ success: false, error: 'AI processing failed' }, { status: 500 });
      }
      console.warn('[Frontend AI Vision] Gemini failed (recoverable). Falling back to NVIDIA:', geminiErr.message);
    }

    // Step 2: NVIDIA Fallback — activated when Gemini hits a rate limit or temporary failure.
    try {
      console.log('[Frontend AI Vision] Trying NVIDIA Fallback');
      const nvidiaApiKey = process.env.NVIDIA_API_KEY;
      const nvidiaBaseUrl = process.env.NVIDIA_BASE_URL;
      if (!nvidiaApiKey || !nvidiaBaseUrl) {
        throw new Error("NVIDIA_API_KEY or NVIDIA_BASE_URL not configured");
      }
      
      const axios = require('axios');
      const nvidiaResponse = await axios.post(`${nvidiaBaseUrl}/chat/completions`, {
          model: process.env.NVIDIA_MODEL || "nvidia/nemotron-3.5-lightning-30b-a3b",
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
          ],
          temperature: 0.7,
          max_tokens: 1024
        }, {
        headers: {
          'Authorization': `Bearer ${nvidiaApiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      const completion = nvidiaResponse.data;
      const rawText = completion.choices[0]?.message?.content || '';
      const data = extractJson(rawText);
      console.log('[Frontend AI Vision] NVIDIA succeeded');
      
      return NextResponse.json({ success: true, data });
    } catch (nvidiaErr: any) {
      // Both providers failed — return a clear error so the UI can show a retry message.
      console.error('[Frontend AI Vision] NVIDIA fallback failed:', nvidiaErr);
      return NextResponse.json({ success: false, error: 'AI processing failed on both providers' }, { status: 500 });
    }

  } catch (error: any) {
    console.error('[API /api/ai/analyze-image] Outer Error:', error);
    return NextResponse.json({ success: false, error: 'AI processing failed' }, { status: 500 });
  }
}
