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
const OUTPUT = path.join(process.cwd(), "scripts", "test-output");
if (!fs.existsSync(OUTPUT)) fs.mkdirSync(OUTPUT, { recursive: true });

// Test both models for image generation capability
async function testModel(modelId) {
  console.log(`\nTesting ${modelId}...`);
  const t0 = Date.now();
  try {
    // Test 1: Can it generate images at all?
    const resp = await ai.models.generateContent({
      model: modelId,
      contents: [{ role: "user", parts: [{ text: "Generate a photorealistic image of a red apple on a white surface." }] }],
      config: { responseModalities: ["IMAGE", "TEXT"] },
    });
    const parts = resp.candidates?.[0]?.content?.parts || [];
    let imageBytes = null;
    let textOut = "";
    for (const p of parts) {
      if (p.inlineData?.data) imageBytes = p.inlineData.data;
      if (p.text) textOut += p.text;
    }
    if (imageBytes) {
      const fname = `newmodel_${modelId.replace(/[^a-z0-9]/gi,"_")}_apple.jpg`;
      fs.writeFileSync(path.join(OUTPUT, fname), Buffer.from(imageBytes, "base64"));
      console.log(`  ✅ IMAGE OUTPUT: Yes! [${((Date.now()-t0)/1000).toFixed(1)}s] saved: ${fname}`);
    } else {
      console.log(`  ❌ No image output. Text: ${textOut?.slice(0,100)}`);
    }
  } catch(err) {
    console.log(`  ❌ Error: ${err.message?.slice(0, 150)}`);
  }
}

async function main() {
  await testModel("gemini-3.1-flash-image");
  await testModel("gemini-2.5-flash-image");
}
main().catch(e => { console.error(e); process.exit(1); });
