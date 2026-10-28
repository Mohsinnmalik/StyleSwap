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

const NEXT_GEN = [
  // Imagen 4
  "imagen-4.0-generate-001",
  "imagen-4.0-ultra-001",
  "imagen-4.0-generate-preview-06-02",
  "imagen-4.0-capability-preview-06-02",
  "imagen-4.0-edit-preview-06-02",
  // Gemini image generation (newer)
  "gemini-2.0-flash-preview-image-generation",
  "gemini-2.5-flash-preview-native-multimodal",
  "gemini-2.5-pro-preview-05-06",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  // Native image gen
  "gemini-3.0-flash-image",
  "gemini-3.1-flash-image",
  "gemini-2.5-flash-image",
  // Other Imagen
  "imagegeneration@002",
  "imagegeneration@020",
  "imagegeneration@060",
  "imagen-3.0-capability-002",
  "imagen-3.0-capability-preview-0901",
];

async function ping(model) {
  try {
    const info = await ai.models.get({ model });
    return `ACCESSIBLE`;
  } catch (err) {
    const msg = err?.message || String(err);
    const code = msg.match(/"code":(\d+)/)?.[1] || "?";
    return `${code}: ${msg.slice(0, 60)}`;
  }
}
async function main() {
  console.log("Project:", process.env.GOOGLE_CLOUD_PROJECT, "| Region: us-central1");
  for (const m of NEXT_GEN) {
    const r = await ping(m);
    console.log(`  ${m}: ${r}`);
  }
}
main().catch(e => { console.error(e); process.exit(1); });
