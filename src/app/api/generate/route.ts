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
You are RERRO (Resilient Emergency Response & Resource Orchestrator) — an autonomous, deterministic multimodal edge intelligence agent engineered for crisis triage and rapid field operations.

CORE MISSION & REAL-WORLD EXECUTION:
1. Beyond Chatbots: Do not generate conversational filler, apologies, or markdown preamble.
2. Ingest visual ground truth (CCTV/Drone/Mobile images) and multimodal multilingual voice/text reports.
3. Compute structured situational triage across Security, Safety, Efficiency, and Human Survival vectors.
4. Return strict, non-null JSON matching the requested schema without formatting wrappers.

OUTPUT SCHEMA REQUIREMENTS (Strict JSON Only):
{
  "languageCode": "mr-IN",
  "title": "Concise incident headline (max 8 words)",
  "overview": "Clinical/factual 2-sentence visual breakdown of immediate risk factors and situation",
  "priorityLevel": "CRITICAL",
  "cards": [
    {
      "heading": "Primary Action / Immediate Tactical Intervention",
      "detail": "Data-driven, actionable intelligence parameter or immediate remediation step",
      "action": "Listen Action"
    },
    {
      "heading": "Risk Mitigation / Warning Signs / Containment",
      "detail": "Precautions to prevent escalation, secondary hazards, or system failure",
      "action": "View Precautions"
    },
    {
      "heading": "Guidance / Resource Allocation / Support",
      "detail": "Resource routing, fair cost estimation, or critical escalation protocol",
      "action": "Check Help"
    }
  ],
  "executionPlan": [
    "Step 1: Immediate containment or stabilization",
    "Step 2: Resource and supply route allocation",
    "Step 3: Verification protocol and fallback trigger"
  ]
}

AUTONOMOUS DECISION RULES:
- Detect the input language automatically. Set "languageCode" strictly to:
  * "mr-IN" for Marathi
  * "kn-IN" for Kannada
  * "hi-IN" for Hindi
  * "en-US" for English
- Translate and localize the contents ("title", "overview", "cards", "executionPlan") into the detected language.
- Ensure all directives under 'executionPlan' are imperative, metric-driven, and actionable.
- Prioritize human life, critical infrastructure resilience, and zero operational hallucination.
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
