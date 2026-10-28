import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import os from "os";

const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const key = t.slice(0, i).trim();
    const val = t.slice(i + 1).trim().replace(/^"|"|$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  const r = path.resolve(process.cwd(), process.env.GOOGLE_APPLICATION_CREDENTIALS);
  if (fs.existsSync(r)) process.env.GOOGLE_APPLICATION_CREDENTIALS = r;
}

const ai = new GoogleGenAI({
  vertexai: true,
  project: process.env.GOOGLE_CLOUD_PROJECT,
  location: process.env.GOOGLE_CLOUD_LOCATION || "us-central1",
});

// Test candidate model IDs
const CANDIDATES = [
  // Imagen editing models
  "imagen-3.0-capability-001",
  "imagegeneration@006",
  "imagegeneration@005",
  "imagen-3.0-generate-001",
  "imagen-3.0-generate-002",
  "imagen-3.0-fast-generate-001",
  "imagen-4.0-generate-preview-05-20",
  "image-editing@001",
  // Gemini image generation
  "gemini-2.0-flash-exp",
  "gemini-2.0-flash-preview-image-generation",
  "gemini-2.5-flash-preview-05-20",
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
  // Segmentation
  "image-segmentation-001",
];

async function ping(model) {
  try {
    const info = await ai.models.get({ model });
    return `ACCESSIBLE: ${info.name || model}`;
  } catch (err) {
    const code = err?.status || (err?.message?.match(/code.{0,5}(\d{3})/)?.[1]);
    return `${code || "ERR"}: ${err?.message?.slice(0, 80)}`;
  }
}

async function main() {
  console.log("Probing models for project:", process.env.GOOGLE_CLOUD_PROJECT);
  for (const m of CANDIDATES) {
    const r = await ping(m);
    console.log(`  ${m}: ${r}`);
  }
}
main().catch(e => { console.error(e); process.exit(1); });
