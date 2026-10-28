import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import https from "https";

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
const MODEL = "gemini-2.5-flash-image";
const OUT = path.join(process.cwd(), "scripts", "test-output");

function fetchImg(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      const c = [];
      res.on("data", d => c.push(d));
      res.on("end", () => {
        const buf = Buffer.concat(c);
        resolve({ data: buf.toString("base64"), mime: res.headers["content-type"] || "image/jpeg" });
      });
      res.on("error", reject);
    }).on("error", reject);
  });
}

async function generate(id, prompt_text, urls) {
  const t0 = Date.now();
  console.log(`\n[${id}] Testing...`);
  try {
    const images = await Promise.all(urls.map(u => fetchImg(u)));
    const parts = [
      { text: prompt_text },
      ...images.map(img => ({ inlineData: { data: img.data, mimeType: img.mime } })),
    ];
    const resp = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts }],
      config: { responseModalities: ["IMAGE", "TEXT"], temperature: 0.3 },
    });
    let imageBytes = null, textOut = "";
    for (const part of resp.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData?.data) imageBytes = part.inlineData.data;
      if (part.text) textOut += part.text;
    }
    if (!imageBytes) throw new Error("No image. Text: " + textOut?.slice(0, 120));
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    const fname = `bm_rerun_${id}.jpg`;
    fs.writeFileSync(path.join(OUT, fname), Buffer.from(imageBytes, "base64"));
    console.log(`  ✅ [${elapsed}s] → ${fname}`);
  } catch(err) {
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(`  ❌ [${elapsed}s] ${err.message?.slice(0, 200)}`);
  }
}

async function main() {
  const PERSON = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=768&q=85";
  // Use clearer, unambiguous product images for South Asian garments
  // These URLs show model-wearing product images, which the model interprets better
  const KURTA2   = "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=600&q=85";  // person wearing kurta
  const PANTS2   = "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&q=85"; // clear pants/trousers
  const JACKET2  = "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=85"; // jacket
  // Fabric swatches — clear textured fabric
  const FAB1     = "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600&q=85";   // check fabric
  const FAB2     = "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=600&q=85"; // plain fabric

  // ── Re-test 1: Kurta + Trouser (clearer images) ────────────
  await generate("1b_kurta_trouser",
    `Image 0 is a person. Image 1 shows a kurta (traditional South Asian long shirt/top). Image 2 shows formal trousers/pants.
Generate a photorealistic full-body image of the EXACT same person from Image 0 wearing the kurta from Image 1 as the top garment and the trousers from Image 2 as the bottom. Preserve the person's face exactly. Preserve the garment colors exactly. Clean neutral background.`,
    [PERSON, KURTA2, PANTS2]);

  await new Promise(r => setTimeout(r, 10000));

  // ── Re-test 4b: Fabric → kurta only ──────────────────────
  await generate("4b_fabric_kurta",
    `Image 0 is a person. Image 1 is a fabric swatch showing a checkered/plaid textile pattern.
Visualize this person wearing a traditional kurta (long top) that would be tailored from this exact fabric. The kurta's design pattern, color, and texture must closely match the fabric in Image 1. The person's face and body must remain recognizable. Full body, clean background.
Note: This is a fashion visualization tool for fabric retailers — showing how this raw fabric would look when tailored into a garment.`,
    [PERSON, FAB1]);

  await new Promise(r => setTimeout(r, 10000));

  // ── Test: Hybrid — VTO for kurta precision, then describe trouser ──
  // This tests if combining VTO identity-lock with Gemini for description works
  // Load the VTO kurta result we already have
  const vtoKurta = fs.readFileSync(path.join(OUT, "retry_step1_kurta.jpg"));
  const vtoB64 = vtoKurta.toString("base64");
  
  await generate("7_hybrid_vto_plus_gemini",
    `Image 0 is the EXACT person we must preserve (face, identity). Image 1 shows this same person already wearing a kurta.
Using image 1 as the base, add formal dark trousers to the lower body (visible below the kurta). Keep all upper body and face EXACTLY as shown in Image 1. The lower body should show formal trousers. Generate a complete realistic outfit photo.`,
    [PERSON, "data"]);  // Will be replaced below

  console.log("\n--- Hybrid VTO+Gemini test ---");
  const t0 = Date.now();
  try {
    const personImg = await fetchImg(PERSON);
    const resp = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts: [
        { text: `Image 0 is the original person reference (face/identity). Image 1 shows this same person already wearing a kurta.
Add formal dark trousers to the lower body (below the kurta). Keep the upper body and face EXACTLY as shown in Image 1. Generate a complete realistic outfit photo, clean background, full body visible.` },
        { inlineData: { data: personImg.data, mimeType: personImg.mime } },
        { inlineData: { data: vtoB64, mimeType: "image/jpeg" } },
      ]}],
      config: { responseModalities: ["IMAGE", "TEXT"], temperature: 0.3 },
    });
    let imageBytes = null, textOut = "";
    for (const part of resp.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData?.data) imageBytes = part.inlineData.data;
      if (part.text) textOut += part.text;
    }
    if (!imageBytes) throw new Error("No image. Text: " + textOut?.slice(0, 120));
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    fs.writeFileSync(path.join(OUT, "bm_rerun_7_hybrid.jpg"), Buffer.from(imageBytes, "base64"));
    console.log(`  ✅ [${elapsed}s] → bm_rerun_7_hybrid.jpg (VTO kurta + Gemini trouser addition)`);
  } catch(err) {
    console.log(`  ❌ ${err.message?.slice(0, 200)}`);
  }

  console.log("\nDone. Check test-output/ for all bm_rerun_*.jpg files.");
}
main().catch(e => { console.error("FATAL:", e); process.exit(1); });
