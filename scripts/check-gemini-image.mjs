import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const key = t.slice(0, i).trim();
    const val = t.slice(i + 1).trim().replace(/^"|"$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  const r = path.resolve(process.cwd(), process.env.GOOGLE_APPLICATION_CREDENTIALS);
  if (fs.existsSync(r)) process.env.GOOGLE_APPLICATION_CREDENTIALS = r;
}
const ai = new GoogleGenAI({ vertexai: true, project: process.env.GOOGLE_CLOUD_PROJECT, location: "us-central1" });

async function main() {
  console.log("Testing Gemini 2.5 Flash with responseModalities IMAGE...");
  try {
    const resp = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: "Generate a simple image of a red apple" }] }],
      config: { responseModalities: ["IMAGE", "TEXT"] },
    });
    const parts = resp.candidates?.[0]?.content?.parts || [];
    let hasImage = false;
    for (const p of parts) {
      if (p.inlineData?.data) { hasImage = true; console.log("IMAGE OUTPUT: Yes! mime:", p.inlineData.mimeType); }
      if (p.text) console.log("TEXT:", p.text?.slice(0, 100));
    }
    if (!hasImage) console.log("No image output. Text-only response.");
  } catch (err) {
    console.log("Error:", err.message?.slice(0, 200));
  }
  
  console.log("\nTesting image-segmentation-001...");
  try {
    // Just check if it responds to a simple probe
    const info = await ai.models.get({ model: "image-segmentation-001" });
    console.log("Segmentation model info:", info.name);
  } catch (err) {
    console.log("Segmentation error:", err.message?.slice(0, 100));
  }
}
main().catch(e => { console.error(e); process.exit(1); });
