const express = require('express');
const router = express.Router();
const { Groq } = require('groq-sdk');
const OpenAI = require('openai');
const fs = require('fs');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const upload = multer({ storage: multer.memoryStorage() });

// Dynamically gather all GROQ_API_KEY_* environment variables
const groqKeys = Object.keys(process.env)
  .filter(key => key.startsWith('GROQ_API_KEY'))
  .map(key => process.env[key])
  .filter(val => val && val.startsWith('gsk_'));

let currentKeyIndex = 0;

/**
 * Robust JSON extraction from AI responses
 */
function safeJsonParse(text) {
  try {
    // Try direct parse
    return JSON.parse(text);
  } catch (e) {
    // Try extracting from markdown blocks
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (inner) {
        throw new Error("Found JSON-like block but it is malformed.");
      }
    }
    throw new Error("No valid JSON found in AI response.");
  }
}

// Initialize OpenRouter (REMOVED)

async function fetchGroqWithFallback(options) {
  let lastError;
  if (groqKeys.length === 0) throw new Error("No valid Groq API keys available.");

  for (let i = 0; i < groqKeys.length; i++) {
    const key = groqKeys[(currentKeyIndex + i) % groqKeys.length];
    const groq = new Groq({ apiKey: key });
    try {
      const response = await groq.chat.completions.create(options);
      // Advance to the NEXT key for the next request (True Round-Robin)
      currentKeyIndex = (currentKeyIndex + i + 1) % groqKeys.length;
      return response;
    } catch (err) {
      console.warn(`Groq key [${key.substring(0, 10)}...] failed: ${err.message}. Trying next...`);
      lastError = err;

      // If it's a rate limit on the large model, try the new Llama 4 Scout first
      if (err.status === 429 && options.model === "llama-3.3-70b-versatile") {
        try {
          console.log(`Attempting Llama fallback with key [${key.substring(0, 10)}...]`);
          const scoutResponse = await groq.chat.completions.create({
            ...options,
            model: "llama-3.1-8b-instant"
          });
          currentKeyIndex = (currentKeyIndex + i) % groqKeys.length;
          return scoutResponse;
        } catch (scoutErr) {
          console.warn(`Scout fallback failed: ${scoutErr.message}. Trying 8b...`);
          try {
            console.log(`Attempting 8b model fallback with key [${key.substring(0, 10)}...]`);
            const fallbackResponse = await groq.chat.completions.create({
              ...options,
              model: "llama-3.1-8b-instant"
            });
            currentKeyIndex = (currentKeyIndex + i) % groqKeys.length;
            return fallbackResponse;
          } catch (innerErr) {
            console.warn(`8b fallback also failed: ${innerErr.message}`);
          }
        }
      }
    }
  }

  throw lastError;
}

// Removed local llama-server client

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

router.post('/chat', async (req, res) => {
  const { message, role, userId } = req.body;

  try {
    const chatCompletion = await fetchGroqWithFallback({
      "messages": [
        {
          "role": "system",
          "content": `You are the FIXNOW AI Core Engine. Role: ${role}. UserId: ${userId}. 
          
          MISSION:
          - If Role is 'customer': Act as a high-end service concierge. Analyze their problem, suggest the most relevant service category, and guide them through the booking protocol. Provide empathy for their issue, list necessary safety precautions, and clarify the steps for a technician visit. Use "ACTION: PROPOSE_BOOKING" with JSON details if they describe a clear issue.
          - If Role is 'technician': Act as a senior technical supervisor. Provide deep technical insights, troubleshooting steps, complex diagnostic flows, tool lists, and strict safety protocols for home repairs. Assist with inventory management, project scheduling, and technical documentation.
          
          TONE: Professional, sophisticated, and efficient. Use "technical" terminology suitable for the platform (e.g., "Protocol", "Sync", "Execution").
          
          CATEGORIES: Electrical, Plumbing, HVAC, Carpentry, Cleaning, Painting, Appliance Repair, General.`
        },
        {
          "role": "user",
          "content": message
        }
      ],
      "model": "meta-llama/llama-4-scout-17b-16e-instruct",
      "temperature": 0.7,
      "max_completion_tokens": 1024,
      "top_p": 1,
      "stream": false
    });

    const reply = chatCompletion.choices[0].message.content;

    // Parse actions if any
    let action = null;
    let data = null;

    if (reply.includes('ACTION: PROPOSE_BOOKING')) {
      action = 'PROPOSE_BOOKING';
      try {
        data = safeJsonParse(reply);
      } catch (e) { }
    }

    res.json({ success: true, reply, action, data });
  } catch (error) {
    console.warn('Groq Chat Failed, falling back directly to Gemini:', error.message);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
      const prompt = `You are the FIXNOW AI Core Engine. Role: ${role}. UserId: ${userId}. 
      MISSION: Concierge for customers, technical supervisor for technicians.
      User message: ${message}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const reply = response.text();

      res.json({ success: true, reply, action: null, data: null });
    } catch (geminiError) {
      console.error('Total Chat Failure:', geminiError);
      res.status(500).json({ success: false, error: 'AI processing failed' });
    }
  }
});

router.post('/parse-issue', async (req, res) => {
  const { issueText } = req.body;
  try {
    const completion = await fetchGroqWithFallback({
      messages: [
        {
          role: "system",
          content: `You are a multilingual repair triage expert. The user request may be in English, Hindi, Tamil, Telugu, Kannada, Malayalam, Bengali, Gujarati, Marathi, Punjabi, or Odia. 
          
          TASK:
          1. Analyze the request regardless of language.
          2. STRICT CATEGORY RULES:
             - 'Cleaning Services': Use if terms relate to 'dirty', 'stains', 'mess', 'deep clean', 'sanitation', 'dirty toilet/kitchen/floor'. STRICTLY EXCLUDE: Do NOT use for Chimney cleaning.
             - 'Plumbing': Use ONLY if terms relate to 'leak', 'broken', 'repair', 'fix pipe', 'clog', 'fitting', 'installation', 'overflow'. STRICTLY EXCLUDE: Do NOT use for RO systems, water purifiers, water tanks, pipe fitting, or drain lines.
             - 'Electrician': Use for core power infrastructure: 'wiring/rewiring', 'switchboard', 'MCB/DB panel', 'ceiling/exhaust fan', 'light/LED installation', 'inverter/UPS/battery', 'power supply', 'voltage stabilizer', 'earthing', 'load balancing'. STRICTLY EXCLUDE: Do NOT use for AC/Fridge-related electrical work or PCBs.
             - 'HVAC / AC Technician': Use for AC and HVAC systems: 'split/window/portable/tower/cassette/central AC', 'VRF/VRV', 'inverter/non-inverter AC', 'AC installation/uninstallation/shifting', 'AC servicing/deep cleaning/jet cleaning', 'AC gas charging/leak detection', 'AC compressor/condenser/evaporator/coil cleaning', 'AC PCB repair', 'AC sensor/thermostat/blower/duct', 'HVAC maintenance/controls/ventilation'. STRICTLY EXCLUDE: Do NOT use for refrigerators or freezers.
             - 'Gas & Utilities': Use for 'gas pipeline', 'LPG/PNG fitting', 'fire extinguisher', 'fire safety', 'smoke detector'. STRICTLY EXCLUDE: Do NOT use for gas stoves or gas hobs.
             - 'Electronics & Smart Home': Use for 'TV installation/repair', 'LED/LCD/Smart TV', 'wall mount', 'CCTV/DVR/NVR', 'Home Theater', 'Speaker', 'Smart Home/IoT', 'Video Doorbell', 'Solar Panel', 'EV Charger'. STRICTLY EXCLUDE: Do NOT use for AC sensors, AC thermostats, AC control boards, or Washing Machine components.
             - 'Painter': Use for 'interior/exterior paint', 'texture/spray painting', 'wall design', 'waterproofing', 'wall putty', 'wall polishing'.
             - 'Renovation Service': Use for 'wallpaper', 'wall panel', 'false ceiling', 'POP', 'glass repair', 'aluminium work', 'grill installation', 'gate repair', 'door/furniture polishing'.
             - 'Moving & Misc': Use for 'packers helper', 'movers', 'loading/unloading', 'home shifting', 'driver on demand', 'event helper', 'labor'.
             - 'Carpentry': Use for 'furniture repair/assembly', 'bed/sofa/table/chair', 'door repair/installation', 'locks/digital locks', 'modular kitchen', 'cabinets', 'wardrobe', 'drawer channels', 'curtain rod/blinds', 'sliding door'.
             - 'Pest Control': Use for 'cockroach/termite/bed bug/mosquito/rodent control', 'ant control', 'fumigation', 'herbal pest control'.
             - 'Bike Mechanics': Use for all two-wheeler services: 'bike/scooter servicing', 'engine oil change', 'brake/clutch repair', 'tire/puncture', 'bike engine work'.
             - 'Car Mechanics': Use for all four-wheeler services: 'car servicing', 'wheel alignment', 'car AC repair', 'engine diagnostics', 'car wash/detailing', 'brake/suspension'.
             - 'Kitchen Services Technician': Use for ALL kitchen machine services: 'microwave/OTG/Convection/Grill', 'chimney service/installation/cleaning', 'gas hob/hob technician', 'induction/cooktop', 'cooking range', 'dishwasher/dishwasher installation'.
             - 'Washing Machine Technician': Use for ALL washing machine services: 'front/top load', 'semi/fully automatic', 'washer dryer', 'drum', 'bearing', 'motor repair', 'pump', 'PCB repair', 'inlet/outlet valve', 'suspension'.
             - 'Refrigerator Technician': Use for all cooling appliances: 'single/double/triple door fridge', 'side-by-side/french door fridge', 'deep/commercial/mini freezer', 'fridge servicing', 'refrigerator compressor/condenser/evaporator/thermostat'.
             - 'Water Systems Technician': Use for all RO and water processing: 'RO installation/servicing', 'RO filter', 'UV/UF purifier', 'water softener/filter', 'water pump/booster/pressure/submersible/borewell pump', 'pipe fitting', 'drain line servicing', 'water tank installation/cleaning'.
             - 'Installation Services Technician': Use for mechanical mounting and physical appliance handling: 'appliance installation', 'appliance shifting/moving' (refrigerator, etc.), 'wall drilling', 'heavy equipment installation', 'bracket installation', 'mounting'. STRICTLY EXCLUDE: Do NOT use for any AC, Washing Machine, Water System, or Kitchen Appliance (Chimney/Dishwasher) installation/shifting.
             - 'Rural Area Technicians': Use for all rural infrastructure: 'rural electrician', 'transformer maintenance', 'solar panel/pump', 'borewell/handpump repair', 'sanitation/toilet construction'.
             - CRITICAL SEPARATION: EVERY request mentioning "AC", "Air Conditioner", or "HVAC" MUST be 'HVAC / AC Technician'. EVERY request mentioning "Washing Machine", "Washer", or "Dryer" MUST be 'Washing Machine Technician'. EVERY request mentioning "RO", "Water Purifier", "Water Filter", "Water Tank", "Pipe Fitting", or "Drain Line" MUST be 'Water Systems Technician'. EVERY request mentioning "Fridge", "Refrigerator", or "Freezer" MUST be 'Refrigerator Technician'. EVERY request mentioning "Microwave", "Chimney", "Hob", "Cooktop", or "Dishwasher" MUST be 'Kitchen Services Technician'. These are EXCLUSIVELY for their respective specialist technicians.
             - If a toilet is 'dirty', it is 'Cleaning Services'. If a toilet is 'leaking', it is 'Plumbing'.
          3. Pick EXACTLY one category from this list: ["HVAC / AC Technician", "Electrician", "Washing Machine Technician", "Water Systems Technician", "Refrigerator Technician", "Kitchen Services Technician", "Installation Services Technician", "Gas & Utilities", "Carpentry", "Plumbing", "Electronics & Smart Home", "Pest Control", "Cleaning Services", "Painter", "Renovation Service", "Moving & Misc", "Bike Mechanics", "Car Mechanics", "Rural Area Technicians"].
          4. Extraction must be strict to ensure zero leakage between repair and cleaning.
          
          5. REJECTION RULE: If the user input is a greeting (e.g., 'hello', 'how are you'), random words, nonsense text, just numbers/emojis, or does NOT describe any service or repair need, you MUST return EXACTLY: {"category": "INVALID"}. Do NOT try to guess a category.
          
          You MUST return ONLY a JSON object. Do NOT wrap it in markdown. Do NOT add any conversational text before or after the JSON. Start your response with { and end it with }.
          { 
            "category": "INVALID|plumbing|electrical|...", 
            "urgency": "High|Medium|Low", 
            "estimatedCostRange": "400 - 1200", 
            "summary": "Short description (translated to English for technician)", 
            "recommendedMaterials": ["...", "..."],
            "technicalTerms": ["Extracted professional terms in English"]
          }`
        },
        { role: "user", content: issueText }
      ],
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      response_format: { type: "json_object" }
    });

    let text = completion.choices[0].message.content;
    const data = safeJsonParse(text);
    res.json({ success: true, data });
  } catch (error) {
    console.warn('Groq Parse Issue Failed, falling back directly to Gemini:', error.message);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
      const prompt = `You are a multilingual repair triage expert.
      TASK: Pick EXACTLY one category from: ["HVAC / AC Technician", "Electrician", "Washing Machine Technician", "Water Systems Technician", "Refrigerator Technician", "Kitchen Services Technician", "Installation Services Technician", "Gas & Utilities", "Carpentry", "Plumbing", "Electronics & Smart Home", "Pest Control", "Cleaning Services", "Painter", "Renovation Service", "Moving & Misc", "Bike Mechanics", "Car Mechanics", "Rural Area Technicians"].
      RULES:
      - 'Electrician': Raw power, wiring, fans.
      - 'HVAC / AC Technician': AC systems, installation, shifting, repair.
      - 'Washing Machine Technician': ALL washing machine repair, parts, and service.
      - 'Water Systems Technician': RO, filters, water pumps, and water tanks.
      - 'Refrigerator Technician': Fridges, freezers, and technical parts.
      - 'Kitchen Services Technician': Microwaves, Chimneys, Hobs, and Dishwashers.
      - 'Installation Services Technician': Physical mounting work.
      - 'electronics_smart_home': TVs, CCTV, Smart IoT.
      
      Return ONLY JSON:
      { 
        "category": "INVALID" if input is nonsense/greeting/random, else one from the list, 
        "urgency": "High|Medium|Low", 
        "estimatedCostRange": "500 - 1500", 
        "summary": "Short description", 
        "recommendedMaterials": [],
        "technicalTerms": []
      }
      
      User Issue: ${issueText}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const data = safeJsonParse(response.text());
      res.json({ success: true, data });
    } catch (geminiError) {
      console.error('Total Parse Issue Failure:', geminiError);
      res.status(500).json({ success: false, error: 'AI processing failed' });
    }
  }
});


router.post('/analyze-image', upload.single('image'), async (req, res) => {
  const { userText } = req.body;
  if (!req.file) {
    return res.status(400).json({ success: false, error: "No image provided" });
  }

  try {
    const base64Image = req.file.buffer.toString("base64");

    const response = await fetchGroqWithFallback({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [
        {
          role: 'user',
          content: [
            { 
              type: "text", 
              text: `You are FixNow AI.

Analyze images. These could be home repair issues OR documents/invoices/receipts.
The user context may be in various Indian languages or English: "${userText || 'No description provided'}".

If the image is a document, invoice, or receipt:
- Set category to "Document / Invoice"
- Put the document type or company name in "problem"
- Put the total amount in "estimatedCostMin" and "estimatedCostMax" (if found, otherwise 0)
- Extract the key items/details into "summary"
- Put all visible text into "ocr"
- Leave arrays like requiredMaterials, requiredTools, possibleCauses empty.
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
  "summary": ""
}

Category MUST be one of: "Document / Invoice", "HVAC / AC Technician", "Electrician", "Washing Machine Technician", "Water Systems Technician", "Refrigerator Technician", "Kitchen Services Technician", "Installation Services Technician", "Gas & Utilities", "Carpentry", "Plumbing", "Electronics & Smart Home", "Pest Control", "Cleaning Services", "Painter", "Renovation Service", "Moving & Misc", "Bike Mechanics", "Car Mechanics", "Rural Area Technicians".
Return "INVALID" for category if input is completely unreadable nonsense.`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${req.file.mimetype};base64,${base64Image}`
              }
            }
          ]
        }
      ],
      temperature: 0.1,
      max_tokens: 700,
      response_format: { type: "json_object" }
    });

    // Handle markdown-wrapped JSON from local models
    const rawText = response.choices[0].message.content;
    console.log("--- RAW QWEN OUTPUT ---");
    console.log(rawText);
    console.log("-----------------------");

    // Handle markdown-wrapped JSON from local models
    const cleanedText = rawText
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const data = safeJsonParse(cleanedText);
    return res.json({ success: true, data });

  } catch (err) {
    console.error('Vision Analysis Error:', err.message);
    res.status(500).json({
      success: false,
      error: 'Vision provider failed.',
      debug: { message: err.message }
    });
  }
});

// --- PHASE 4: New AI Endpoints ---

// 1. Voice Transcription (Whisper)
router.post('/transcribe', upload.single('audio'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: "No audio file provided" });
  
  try {
    const groq = new Groq({ apiKey: groqKeys[0] });
    
    // Convert memory buffer to file-like object for Groq
    const audioFile = new File([req.file.buffer], "audio.webm", { type: req.file.mimetype });
    
    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-large-v3-turbo",
      response_format: "json",
      language: "en", // Using english to force translation of indian languages if possible, or omit language for auto-detect
    });
    
    res.json({ success: true, text: transcription.text });
  } catch (error) {
    console.error("Transcription Error:", error);
    res.status(500).json({ success: false, error: "Failed to transcribe audio" });
  }
});

// 2. Explainable AI for Recommendations
router.post('/explain', async (req, res) => {
  const { technician, scores } = req.body;
  
  try {
    const prompt = `You are the FIXNOW AI Dispatcher. Explain to the customer why this technician was recommended.
    Technician: ${technician.name || 'Professional'}
    Category: ${technician.category || 'General'}
    Rating: ${technician.rating || 'N/A'}
    Match Score: ${Math.round((scores.totalScore || 0) * 100)}%
    AI Success Confidence: ${Math.round((scores.xgbScore || 0) * 100)}%
    Distance: ${Math.round(scores.distance || 0)}km
    
    Write exactly 3 short, punchy bullet points highlighting their expertise, proximity, and our AI's confidence in their success. Do NOT use markdown asterisks. Format as a JSON array of strings.`;

    const completion = await fetchGroqWithFallback({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.1-8b-instant",
      temperature: 0.3,
      response_format: { type: "json_object" }
    });
    
    let text = completion.choices[0].message.content;
    const data = safeJsonParse(text);
    // Handle both { "bullets": [...] } and direct array (which safeJsonParse might not handle if it expects obj, but let's assume it returns { bullets: [] })
    let bullets = data.bullets || data.reasons || data.points || Object.values(data)[0] || [];
    if (!Array.isArray(bullets)) bullets = ["High skill match verified by AI", "Excellent rating history", "Close proximity for fast arrival"];
    
    res.json({ success: true, bullets });
  } catch (error) {
    console.error("Explanation Error:", error);
    res.json({ 
      success: true, 
      bullets: [
        "Strong semantic skill match", 
        "High success probability predicted", 
        "Optimal distance and availability"
      ] 
    });
  }
});

// 3. AI Negotiation Engine
router.post('/negotiate', async (req, res) => {
  const { customerBudget, technicianPrice, urgency, distance } = req.body;
  
  try {
    const prompt = `You are the FIXNOW AI Negotiation Engine. 
    Customer Budget: ₹${customerBudget || 500}
    Technician Base Price: ₹${technicianPrice || 800}
    Urgency: ${urgency || 'Medium'}
    Distance: ${distance || 5}km
    
    Determine a fair middle-ground settlement price. If urgency is high, lean closer to the technician price. If distance is far, compensate slightly.
    
    Return ONLY JSON:
    {
      "suggestedPrice": 650,
      "reasoning": "A fair compromise considering the high urgency and travel distance."
    }`;

    const completion = await fetchGroqWithFallback({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.1-8b-instant",
      temperature: 0.2,
      response_format: { type: "json_object" }
    });
    
    const data = safeJsonParse(completion.choices[0].message.content);
    res.json({ success: true, data });
  } catch (error) {
    console.error("Negotiation Error:", error);
    // Fallback logic
    const basePrice = parseInt(technicianPrice) || 800;
    const budget = parseInt(customerBudget) || basePrice;
    const midpoint = Math.round((basePrice + budget) / 2);
    
    res.json({ 
      success: true, 
      data: {
        suggestedPrice: midpoint,
        reasoning: "Suggested fair midpoint based on standard market rates."
      }
    });
  }
});

// 4. Semantic Embedding Proxy
router.post('/embed', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ success: false, error: "Text required" });
  
  try {
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(text);
    const embedding = result.embedding.values;
    
    res.json({ success: true, embedding });
  } catch (error) {
    console.error("Embedding Error:", error);
    res.status(500).json({ success: false, error: "Failed to generate embedding" });
  }
});

module.exports = router;
