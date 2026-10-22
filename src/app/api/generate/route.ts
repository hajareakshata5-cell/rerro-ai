import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

// 503 spike sathi smart delay helper
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(req: NextRequest) {
  let prompt = "";
  let imageBase64 = "";

  try {
    const body = await req.json();
    prompt = body.prompt || "";
    imageBase64 = body.image || "";
  } catch {
    return NextResponse.json({ error: "Invalid JSON format" }, { status: 400 });
  }

  const keys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_BACKUP,
  ].filter(Boolean) as string[];

  if (keys.length === 0) {
    return NextResponse.json(
      { error: "Krupaya .env.local madhe GEMINI_API_KEY verify kara" },
      { status: 500 },
    );
  }

  const contents: any[] = [];

  if (imageBase64) {
    let mimeType = "image/jpeg";
    let cleanBase64 = imageBase64;

    if (imageBase64.includes("data:") && imageBase64.includes(";base64,")) {
      const match = imageBase64.match(
        /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/,
      );
      if (match) {
        mimeType = match[1];
        cleanBase64 = match[2];
      }
    }

    contents.push({
      inlineData: {
        mimeType: mimeType,
        data: cleanBase64,
      },
    });
  }

  const systemInstruction = `
You are RERRO (Resilient Emergency Response & Resource Orchestrator) — an open-ended, real-time multimodal intelligence engine.

CORE PRINCIPLES:
1. OPEN DOMAIN OBJECTIVITY:
   - Carefully analyze the exact image and user prompt.
   - Do NOT assume any fixed domain. If it shows plants/leaves, diagnose crop pathology. If it shows human skin/injury, diagnose the medical condition. If it shows civic hazard/disaster, deliver emergency mitigation.
2. CONCRETE ACTIONABLE REMEDIES:
   - Provide genuine remedies, active chemical salts, first-aid steps, or safety guidelines tailored directly to the visual evidence.
3. MULTILINGUAL AUTO-DETECTION:
   - Detect the language of the prompt automatically.
   - If Marathi: Output in natural Marathi ("languageCode": "mr-IN").
   - If Kannada: Output in pure Kannada script ("languageCode": "kn-IN").
   - If Hindi: Output in Hindi ("languageCode": "hi-IN").
   - If English: Output in English ("languageCode": "en-US").

STRICT JSON OUTPUT FORMAT ONLY:
{
  "languageCode": "mr-IN",
  "title": "Exact Title of Problem / Condition / Disease",
  "overview": "Clinical/factual 2-sentence visual breakdown of the issue",
  "priorityLevel": "CRITICAL",
  "cards": [
    {
      "heading": "Primary Action / Immediate Treatment / First-Aid",
      "detail": "Specific active ingredient, dosage, or first-aid procedure",
      "action": "Listen Action"
    },
    {
      "heading": "Risk Mitigation / Warning Signs / Containment",
      "detail": "Precautions to prevent infection or further damage",
      "action": "View Precautions"
    },
    {
      "heading": "Guidance / Fair Pricing / Support",
      "detail": "Fair market cost estimation or professional referral",
      "action": "Check Help"
    }
  ],
  "executionPlan": [
    "Step 1...",
    "Step 2...",
    "Step 3..."
  ]
}
`;

  contents.push({
    text: prompt || "Analyze this image live and return strict JSON diagnosis.",
  });

  let lastError = "";

  for (const activeKey of keys) {
    const ai = new GoogleGenAI({ apiKey: activeKey });

    // 503 spike bypass sathi 3 automatic attempts
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: contents,
          config: {
            systemInstruction: systemInstruction,
            responseMimeType: "application/json",
            temperature: 0.1,
            maxOutputTokens: 2048,
          },
        });

        let outputText = response.text || "";

        if (outputText) {
          outputText = outputText
            .replace(/```json/gi, "")
            .replace(/```/g, "")
            .trim();

          const parsedJSON = JSON.parse(outputText);
          return NextResponse.json(parsedJSON);
        }
      } catch (err: any) {
        lastError = err?.message || String(err);
        console.warn(
          `Attempt ${attempt} failed with gemini-3.8-flash:`,
          lastError,
        );

        // Jar 503 asel tar 600ms thambun parat prayatna kara
        if (lastError.includes("503") || lastError.includes("UNAVAILABLE")) {
          await wait(600 * attempt);
          continue;
        }
        break;
      }
    }
  }

  return NextResponse.json({
    languageCode: "mr-IN",
    title: "Google API Server Busy",
    overview:
      "Google live servers busy ahet kiva stream madhe adchan aali. Krupaya 2 secondani punha 'Synthesize' dabun try kara.",
    priorityLevel: "HIGH",
    cards: [
      {
        heading: "Telemetry Log",
        detail: lastError.substring(0, 180),
        action: "Re-try",
      },
    ],
    executionPlan: ["Step 1: Click Synthesize Action Grid again"],
  });
}
