/**
 * OPTION D: Direct multi-garment composition using ORIGINAL person image only.
 * 
 * Tests:
 *   D1 - virtual-try-on-001 with multiple productImages in ONE call
 *   D2 - editImage (Imagen 3) with person + multiple SubjectReferenceImages
 *   D3 - generateContent with Gemini 2.0 Flash image output (identity benchmark)
 * 
 * Person image is NEVER replaced by a generated image. 
 * Always uses the original clean person photo.
 * 
 * Run: node scripts/test-option-d.mjs
 */
import { GoogleGenAI, SubjectReferenceImage } from "@google/genai";
import fs from "fs";
import path from "path";
import os from "os";
import https from "https";

// Load .env.local
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
if (process.env.GOOGLE_CREDENTIALS) {
  const p = path.join(os.tmpdir(), "gc-optd.json");
  fs.writeFileSync(p, process.env.GOOGLE_CREDENTIALS);
  process.env.GOOGLE_APPLICATION_CREDENTIALS = p;
} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  const r = path.resolve(process.cwd(), process.env.GOOGLE_APPLICATION_CREDENTIALS);
  if (fs.existsSync(r)) process.env.GOOGLE_APPLICATION_CREDENTIALS = r;
}

const ai = new GoogleGenAI({
  vertexai: true,
  project: process.env.GOOGLE_CLOUD_PROJECT,
  location: process.env.GOOGLE_CLOUD_LOCATION || "us-central1",
});

const VTO_MODEL = "virtual-try-on-001";
const EDIT_MODEL = "imagen-3.0-capability-001";
const GEMINI_MODEL = "gemini-2.0-flash-exp";
const OUTPUT_DIR = path.join(process.cwd(), "scripts", "test-output");
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// ── Images ──────────────────────────────────────────────────
const PERSON_MAN = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=768&q=85";

// Garments
const KURTA    = "https://images.unsplash.com/photo-1622519407650-3df9883f76a5?w=600&q=85";
const TROUSER  = "https://images.unsplash.com/photo-1594938298603-c8148c4b4dd5?w=600&q=85";
const BLAZER   = "https://images.unsplash.com/photo-1592878940526-0214b0f374f6?w=600&q=85";
const SHIRT    = "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&q=85";
const BLK_PANT = "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&q=85";
const WAISTCOA = "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&q=85";
// Fabric swatches (patterned/solid fabrics for raw material test)
const FABRIC_CHECK = "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600&q=85";
const FABRIC_PLAIN = "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&q=85";

// ── Helpers ──────────────────────────────────────────────────
function fetchImg(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      const c = [];
      res.on("data", d => c.push(d));
      res.on("end", () => {
        const buf = Buffer.concat(c);
        resolve({ data: buf.toString("base64"), mime: res.headers["content-type"] || "image/jpeg", buf });
      });
      res.on("error", reject);
    }).on("error", reject);
  });
}
function save(buf, name) {
  const p = path.join(OUTPUT_DIR, name);
  fs.writeFileSync(p, typeof buf === "string" ? Buffer.from(buf, "base64") : buf);
  return name;
}
function ts() { return new Date().toISOString().slice(11, 19); }
function sec(t0) { return ((Date.now() - t0) / 1000).toFixed(1); }

const results = [];
function record(id, name, ok, elapsed, note, files) {
  results.push({ id, name, ok, elapsed, note, files: files || [] });
  const sym = ok ? "✅" : "❌";
  console.log(`  ${sym} [${elapsed}s] ${name}: ${note}`);
}

// ── D1: virtual-try-on-001 with MULTIPLE productImages in ONE call ──────────
async function testD1_VTO_Multi(id, name, person, garmentUrls) {
  console.log(`\n[${ts()}] D1-${id}: ${name}`);
  const t0 = Date.now();
  try {
    const p = await fetchImg(person);
    const garments = await Promise.all(garmentUrls.map(u => fetchImg(u)));
    
    const productImages = garments.map(g => ({
      productImage: { imageBytes: g.data, mimeType: g.mime }
    }));

    const resp = await ai.models.recontextImage({
      model: VTO_MODEL,
      source: {
        personImage: { imageBytes: p.data, mimeType: p.mime },
        productImages,
      },
      config: { numberOfImages: 1, baseSteps: 120 },
    });
    
    const bytes = resp.generatedImages?.[0]?.image?.imageBytes;
    if (!bytes) throw new Error("No imageBytes");
    
    const fname = `d1_${id}_multi.jpg`;
    save(bytes, fname);
    record("D1", name, true, sec(t0), `${garmentUrls.length} garments → 1 call`, [fname]);
    return bytes;
  } catch (err) {
    record("D1", name, false, sec(t0), err.message?.slice(0, 120) || String(err).slice(0, 120), []);
    return null;
  }
}

// ── D2: editImage (Imagen 3) with person + multiple garment SubjectReferenceImages ──
async function testD2_EditImage(id, name, person, garmentUrls, prompt) {
  console.log(`\n[${ts()}] D2-${id}: ${name}`);
  const t0 = Date.now();
  try {
    const p = await fetchImg(person);
    const garments = await Promise.all(garmentUrls.map(u => fetchImg(u)));
    
    // Build reference images: person as raw reference (id=0), each garment as SubjectReference
    const { RawReferenceImage, SubjectReferenceImage } = await import("@google/genai");
    
    const rawPerson = new RawReferenceImage({
      referenceImage: { imageBytes: p.data, mimeType: p.mime },
      referenceId: 0,
    });
    
    const garmentRefs = garments.map((g, i) => {
      const ref = new SubjectReferenceImage({
        referenceImage: { imageBytes: g.data, mimeType: g.mime },
        referenceId: i + 1,
        config: { subjectType: "SUBJECT_TYPE_PRODUCT" },
      });
      return ref;
    });
    
    const resp = await ai.models.editImage({
      model: EDIT_MODEL,
      prompt,
      referenceImages: [rawPerson, ...garmentRefs],
      config: {
        numberOfImages: 1,
        editMode: "EDIT_MODE_DEFAULT",
        personGeneration: "ALLOW_ADULT",
      },
    });

    const bytes = resp.generatedImages?.[0]?.image?.imageBytes;
    if (!bytes) {
      const rai = resp.generatedImages?.[0]?.raiFilteredReason;
      throw new Error(rai ? `RAI filtered: ${rai}` : "No imageBytes");
    }

    const fname = `d2_${id}_edit.jpg`;
    save(bytes, fname);
    record("D2", name, true, sec(t0), `editImage with ${garmentUrls.length} refs`, [fname]);
    return bytes;
  } catch (err) {
    record("D2", name, false, sec(t0), err.message?.slice(0, 180) || String(err).slice(0, 180), []);
    return null;
  }
}

// ── D3: Gemini 2.0 Flash native image generation (identity benchmark) ────────
async function testD3_Gemini(id, name, person, garmentUrls, prompt) {
  console.log(`\n[${ts()}] D3-${id}: ${name}`);
  const t0 = Date.now();
  try {
    const p = await fetchImg(person);
    const garments = await Promise.all(garmentUrls.map(u => fetchImg(u)));
    
    const parts = [
      { text: prompt },
      { inlineData: { data: p.data, mimeType: p.mime } },
      ...garments.map((g, i) => ({ inlineData: { data: g.data, mimeType: g.mime } })),
    ];
    
    const resp = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ role: "user", parts }],
      config: {
        responseModalities: ["IMAGE", "TEXT"],
        temperature: 0.4,
      },
    });
    
    let imageBytes = null;
    for (const part of resp.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData?.data) { imageBytes = part.inlineData.data; break; }
    }
    if (!imageBytes) throw new Error("No image in Gemini response");
    
    const fname = `d3_${id}_gemini.jpg`;
    save(imageBytes, fname);
    record("D3", name, true, sec(t0), "Gemini 2.0 Flash image gen", [fname]);
    return imageBytes;
  } catch (err) {
    record("D3", name, false, sec(t0), err.message?.slice(0, 180) || String(err).slice(0, 180), []);
    return null;
  }
}

// ── MAIN ──────────────────────────────────────────────────────
async function main() {
  console.log("╔═══════════════════════════════════════════════════════╗");
  console.log("║  OPTION D: Direct Multi-Garment Composition Test       ║");
  console.log("╚═══════════════════════════════════════════════════════╝");
  console.log("Project:", process.env.GOOGLE_CLOUD_PROJECT);

  // Save original person for visual reference
  const personImg = await fetchImg(PERSON_MAN);
  save(personImg.buf, "d_person_original.jpg");
  console.log("[setup] Person image saved as d_person_original.jpg");

  // ── Section 1: D1 — VTO multi-product in ONE call ──────────
  console.log("\n═══ D1: virtual-try-on-001 with multiple productImages ═══");
  
  await testD1_VTO_Multi("shirt_trouser", "Shirt + Trouser",
    PERSON_MAN, [SHIRT, BLK_PANT]);
  
  await testD1_VTO_Multi("kurta_trouser", "Kurta + Trouser",
    PERSON_MAN, [KURTA, TROUSER]);
  
  await testD1_VTO_Multi("kurta_blazer", "Kurta + Jodhpuri Jacket",
    PERSON_MAN, [KURTA, BLAZER]);
  
  await testD1_VTO_Multi("kurta_trouser_blazer", "Kurta + Trouser + Jodhpuri Jacket",
    PERSON_MAN, [KURTA, TROUSER, BLAZER]);
  
  await testD1_VTO_Multi("shirt_pant_waistcoat_blazer", "Shirt + Trouser + Waistcoat + Blazer",
    PERSON_MAN, [SHIRT, BLK_PANT, WAISTCOA, BLAZER]);

  await new Promise(r => setTimeout(r, 2000));

  // ── Section 2: D2 — Imagen 3 editImage multi-reference ─────
  console.log("\n═══ D2: editImage (Imagen 3) with multiple SubjectReferenceImages ═══");

  await testD2_EditImage("kurta_trouser", "Kurta + Trouser",
    PERSON_MAN, [KURTA, TROUSER],
    "Show the person [0] wearing the kurta/long top [1] as their upper garment and the trousers [2] as their bottom garment. Preserve the person's face and body exactly. Maintain the original colors and patterns of both garments.");

  await testD2_EditImage("kurta_trouser_jacket", "Kurta + Trouser + Jodhpuri Jacket",
    PERSON_MAN, [KURTA, TROUSER, BLAZER],
    "Show the person [0] wearing: the traditional kurta [1] as the base layer, the trousers [2] as the bottom, and the jacket [3] as the outer layer. Preserve the person's identity and all garment details.");

  await testD2_EditImage("shirt_pant_waistcoat_blazer", "Shirt + Trouser + Waistcoat + Blazer",
    PERSON_MAN, [SHIRT, BLK_PANT, WAISTCOA, BLAZER],
    "Show the person [0] dressed in a complete business outfit: the shirt [1] as the base, the black trousers [2] as the bottom, the waistcoat [3] over the shirt, and the blazer [4] as the outermost layer. Preserve identity and all garment appearance.");

  // Fabric test
  await testD2_EditImage("fabric_kurta_trouser", "Fabric swatch → Kurta + Trouser",
    PERSON_MAN, [FABRIC_CHECK, FABRIC_PLAIN],
    "Use the checkered fabric swatch [1] to create a kurta on the person [0] and use the plain fabric swatch [2] to create trousers. Show the person wearing this custom outfit while faithfully reproducing the exact fabric patterns and colors.");

  await new Promise(r => setTimeout(r, 2000));

  // ── Section 3: D3 — Gemini 2.0 Flash (identity/quality benchmark) ──
  console.log("\n═══ D3: Gemini 2.0 Flash image generation (identity benchmark) ═══");

  await testD3_Gemini("kurta_trouser", "Kurta + Trouser",
    PERSON_MAN, [KURTA, TROUSER],
    "Image 1 is a person. Image 2 is a kurta. Image 3 is trousers. Generate a photorealistic image of the EXACT same person from Image 1 (preserve their face, skin tone, build, and pose) wearing the kurta from Image 2 on their upper body and the trousers from Image 3 on their lower body. Preserve the exact colors and patterns of both garments.");

  await testD3_Gemini("kurta_trouser_jacket", "Kurta + Trouser + Jodhpuri Jacket",
    PERSON_MAN, [KURTA, TROUSER, BLAZER],
    "Image 1 is a person. Image 2 is a kurta. Image 3 is trousers. Image 4 is a jacket. Generate a photorealistic image of the EXACT same person from Image 1 wearing all three garments as a complete outfit: kurta as base, trousers on bottom, jacket as outermost layer. Preserve all garment colors and patterns exactly. Preserve the person's face and identity exactly.");

  await testD3_Gemini("fabric_swatch", "Fabric swatches as garments",
    PERSON_MAN, [FABRIC_CHECK, FABRIC_PLAIN],
    "Image 1 is a person. Image 2 is a checkered fabric swatch. Image 3 is a plain fabric swatch. Generate a photorealistic image of the EXACT same person wearing a traditional kurta made from the checkered fabric [Image 2] and trousers made from the plain fabric [Image 3]. The fabric textures and patterns must be faithfully reproduced.");

  // ── Final Report ────────────────────────────────────────────
  console.log("\n╔═══════════════════════════════════════════════════════╗");
  console.log("║  OPTION D — SUMMARY                                   ║");
  console.log("╚═══════════════════════════════════════════════════════╝");
  
  const d1 = results.filter(r => r.id === "D1");
  const d2 = results.filter(r => r.id === "D2");
  const d3 = results.filter(r => r.id === "D3");
  
  console.log("\nD1 (virtual-try-on-001 multi-product):");
  d1.forEach(r => console.log(`  ${r.ok ? "PASS" : "FAIL"} [${r.elapsed}s] ${r.name}: ${r.note}`));
  
  console.log("\nD2 (editImage / Imagen 3):");
  d2.forEach(r => console.log(`  ${r.ok ? "PASS" : "FAIL"} [${r.elapsed}s] ${r.name}: ${r.note}`));
  
  console.log("\nD3 (Gemini 2.0 Flash):");
  d3.forEach(r => console.log(`  ${r.ok ? "PASS" : "FAIL"} [${r.elapsed}s] ${r.name}: ${r.note}`));
  
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "option-d-report.json"),
    JSON.stringify({ generated: new Date().toISOString(), results }, null, 2)
  );
  console.log("\nAll images saved to:", OUTPUT_DIR);
  console.log("Report: option-d-report.json");
  console.log("\n⚠️  IMPORTANT: Manually review all generated images.");
  console.log("   Judge on: identity preservation, garment accuracy, commercial believability.");
  console.log("   A generated image that looks 'nice' but does not match the selected products is a FAILURE.");
}

main().catch(e => { console.error("FATAL:", e); process.exit(1); });
