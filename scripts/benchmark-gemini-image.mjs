/**
 * FULL BENCHMARK: gemini-2.5-flash-image for multi-garment South Asian outfit visualization
 * 
 * Tests the actual Tryonity business use case:
 * - Identity preservation (can a customer recognize themselves?)
 * - Garment fidelity (do the selected products remain recognizable?)
 * - Multi-garment coherence
 * - Fabric swatch visualization
 * 
 * Run: node scripts/benchmark-gemini-image.mjs
 */
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
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

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

// ── Garment images ────────────────────────────────────────────
const PERSON    = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=768&q=85";
// South Asian
const KURTA     = "https://images.unsplash.com/photo-1622519407650-3df9883f76a5?w=600&q=85";
const TROUSER   = "https://images.unsplash.com/photo-1594938298603-c8148c4b4dd5?w=600&q=85";
const BLAZER    = "https://images.unsplash.com/photo-1592878940526-0214b0f374f6?w=600&q=85";
// Western
const SHIRT     = "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&q=85";
const BLKPANT   = "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&q=85";
const WAISTCOAT = "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&q=85";
// Fabric swatches
const FAB_CHECK = "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600&q=85";
const FAB_PLAIN = "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&q=85";
const FAB_SILK  = "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=600&q=85";

const results = [];

async function generate(id, name, personUrl, garmentUrls, labels, prompt) {
  console.log(`\n[BM-${id}] ${name}`);
  const t0 = Date.now();
  try {
    const p = await fetchImg(personUrl);
    const garments = await Promise.all(garmentUrls.map(u => fetchImg(u)));
    
    const parts = [
      { text: prompt },
      { inlineData: { data: p.data, mimeType: p.mime } },
      ...garments.map(g => ({ inlineData: { data: g.data, mimeType: g.mime } })),
    ];
    
    const resp = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts }],
      config: { responseModalities: ["IMAGE", "TEXT"], temperature: 0.3 },
    });
    
    let imageBytes = null;
    let textOut = "";
    for (const part of resp.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData?.data) imageBytes = part.inlineData.data;
      if (part.text) textOut += part.text;
    }
    
    if (!imageBytes) throw new Error("No image in response. Text: " + textOut?.slice(0, 100));
    
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    const fname = `bm_${id}.jpg`;
    fs.writeFileSync(path.join(OUT, fname), Buffer.from(imageBytes, "base64"));
    console.log(`  ✅ [${elapsed}s] → ${fname}`);
    results.push({ id, name, ok: true, elapsed, fname, note: "image generated" });
    return imageBytes;
  } catch(err) {
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(`  ❌ [${elapsed}s] ${err.message?.slice(0, 160)}`);
    results.push({ id, name, ok: false, elapsed, note: err.message?.slice(0, 160) });
    return null;
  }
}

// Strong identity-preserving prompt template
function prompt(garmentCount, garmentDesc) {
  return `You are shown ${garmentCount + 1} images: Image 0 is a person. ${garmentDesc}

Your task: Generate a single, photorealistic full-body photograph of the EXACT SAME PERSON from Image 0, dressed in the garments shown in the other images. This is a virtual try-on result.

CRITICAL REQUIREMENTS:
1. The person's face, skin tone, facial features, hair, and body proportions must be EXACTLY preserved from Image 0. Do not alter their appearance in any way.
2. Each garment must retain its EXACT color, pattern, texture, and design details from its reference image. A red check pattern must appear as red check — not reinterpreted.
3. Garments must be placed on the correct body regions with correct occlusion (outer garments overlap inner ones).
4. The final image must look like a professional fashion photograph — not a collage or illustration.
5. The person's body pose can be natural standing.
6. Full body must be visible.
7. Clean neutral background.`;
}

async function main() {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║  TRYONITY BENCHMARK: gemini-2.5-flash-image              ║");
  console.log("║  Model: gemini-2.5-flash-image                           ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  console.log("Project:", process.env.GOOGLE_CLOUD_PROJECT);
  
  // ── Test 1: Kurta + Trouser ────────────────────────────────
  await generate("1_kurta_trouser", "Kurta + Trouser",
    PERSON, [KURTA, TROUSER],
    ["Kurta (top)", "Trouser (bottom)"],
    prompt(2, "Image 1 is a kurta (long traditional top). Image 2 is a trouser. Dress the person in the kurta as the top layer and the trouser on the lower body."));

  // ── Test 2: Kurta + Trouser + Jodhpuri Jacket ──────────────
  await generate("2_jodhpuri", "Kurta + Trouser + Jodhpuri Jacket",
    PERSON, [KURTA, TROUSER, BLAZER],
    ["Kurta (base)", "Trouser (bottom)", "Jodhpuri Jacket (outer)"],
    prompt(3, "Image 1 is a traditional kurta (long top, base layer). Image 2 is a trouser (bottom). Image 3 is a Jodhpuri jacket (outer layer worn over kurta). Dress the person with the kurta as the innermost top, trouser on the bottom, and the jacket as the outermost layer."));

  // ── Test 3: Sherwani + Bottom ──────────────────────────────
  // Use kurta as sherwani proxy (long garment) + trouser as bottom
  await generate("3_sherwani", "Sherwani + Bottom",
    PERSON, [KURTA, TROUSER],
    ["Sherwani (long formal coat)", "Bottom/Churidar"],
    prompt(2, "Image 1 is a sherwani (a formal long traditional coat). Image 2 is a churidar/bottom garment. Dress the person wearing the sherwani as the main outer garment and the bottom beneath it. The sherwani should be the dominant visible garment."));

  // ── Test 4: Fabric swatches (raw unstitched material) ──────
  await generate("4_fabric_set", "Raw Fabric → Full Custom Outfit",
    PERSON, [FAB_CHECK, FAB_PLAIN, FAB_SILK],
    ["Fabric A (kurta)", "Fabric B (trouser)", "Fabric C (jacket)"],
    `You are shown 4 images. Image 0 is a person. Image 1 is a raw checkered fabric swatch — this is the EXACT fabric to be used for a kurta. Image 2 is a plain fabric swatch — EXACT material for the trouser. Image 3 is a silk/shiny fabric swatch — EXACT material for a jacket/blazer.

Generate a photorealistic full-body photograph of the EXACT same person from Image 0 wearing a complete outfit:
- A tailored kurta made from the checkered fabric in Image 1 (the checks, colors, and texture must be EXACTLY preserved — not reinterpreted)
- Tailored trousers made from the plain fabric in Image 2 (exact texture and color)
- A structured jacket/blazer made from the fabric in Image 3 (exact sheen and color)

The person's face and identity must be preserved exactly. The fabric patterns must be recognizable as the same fabrics in the reference images — this is a customer-facing visualization tool.`);

  // ── Test 5: Western Suit (comparison baseline) ─────────────
  await generate("5_western_suit", "Western Suit (Shirt + Trouser + Waistcoat)",
    PERSON, [SHIRT, BLKPANT, WAISTCOAT],
    ["Shirt (base)", "Black Trouser", "Waistcoat (over shirt)"],
    prompt(3, "Image 1 is a dress shirt (base layer). Image 2 is black formal trousers. Image 3 is a waistcoat/vest (worn over the shirt). Dress the person in a complete 3-piece business outfit with correct layering."));

  // ── Test 6: Fabric kurta only (simpler case) ───────────────
  await generate("6_fabric_kurta_only", "Single Fabric → Kurta (isolated test)",
    PERSON, [FAB_CHECK],
    ["Checkered fabric for kurta"],
    `Image 0 is a person. Image 1 is a raw checkered fabric swatch.
Generate a photorealistic full-body photograph of the EXACT same person wearing a kurta (traditional long top) tailored from the fabric in Image 1. The exact check pattern, colors, and texture of the fabric MUST be preserved and recognizable on the garment. The person's face and body must be preserved exactly. Clean background.`);

  // ── Summary ────────────────────────────────────────────────
  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log("║  BENCHMARK SUMMARY                                        ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  results.forEach(r => {
    console.log(`  ${r.ok ? "PASS" : "FAIL"} [${r.elapsed}s] ${r.name}`);
    if (!r.ok) console.log(`       └─ ${r.note}`);
    if (r.ok) console.log(`       └─ → ${r.fname} (inspect manually for identity + garment fidelity)`);
  });

  fs.writeFileSync(path.join(OUT, "benchmark-report.json"), JSON.stringify({ model: MODEL, generated: new Date().toISOString(), results }, null, 2));
  console.log("\n⚠️  MANUAL REVIEW REQUIRED for each generated image:");
  console.log("   Score each on 1-10: identity, face, garment fidelity, fabric accuracy, realism");
  console.log("   A commercial pass requires ≥7/10 on identity AND garment fidelity.");
  console.log("   Saved to:", OUT);
}
main().catch(e => { console.error("FATAL:", e); process.exit(1); });
