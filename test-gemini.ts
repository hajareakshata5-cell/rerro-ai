import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";

// .env.local मधून थेट API Key वाचणे
let apiKey = process.env.GEMINI_API_KEY;
if (!apiKey && fs.existsSync(".env.local")) {
  const envContent = fs.readFileSync(".env.local", "utf8");
  const match = envContent.match(/GEMINI_API_KEY=(.+)/);
  if (match) apiKey = match[1].trim();
}

console.log(
  "Using API Key:",
  apiKey ? `${apiKey.substring(0, 8)}...` : "NOT FOUND",
);

const ai = new GoogleGenAI({ apiKey: apiKey! });

async function run() {
  const models = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-3.8-flash",
  ];

  for (const m of models) {
    try {
      console.log(`\nTesting model: ${m}...`);
      const res = await ai.models.generateContent({
        model: m,
        contents: "Hello, reply with only 'OK'",
      });
      console.log(`✔ SUCCESS with ${m}:`, res.text?.trim());
      break;
    } catch (err: any) {
      console.log(`✖ FAILED with ${m}:`, err?.message || err);
    }
  }
}

run();
