/**
 * OPTION E: Multi-stage composition keeping original person as immutable reference.
 * 
 * Architecture:
 *   1. Use segmentImage to get body region masks from the original person image.
 *   2. Use editImage with EDIT_MODE_INPAINT_INSERTION per garment region.
 *   3. Each edit operates on the ORIGINAL person image + its mask.
 *   4. Results are composited (or each edit builds on the previous).
 *
 * Also tests: VTO single garment + editImage to add second garment on the VTO result
 * (different from sequential VTO: VTO gives base, then Imagen 3 adds remaining garments
 * using the original person as the identity anchor via SubjectReferenceImage)
 *
 * Run: node scripts/test-option-e.mjs
 */
import { GoogleGenAI } from "@google/genai";
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
  const p = path.join(os.tmpdir(), "gc-opte.json");
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
const SEG_MODEL  = "image-segmentation-001";
const OUTPUT_DIR = path.join(process.cwd(), "scripts", "test-output");
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const PERSON_MAN = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=768&q=85";
const KURTA      = "https://images.unsplash.com/photo-1622519407650-3df9883f76a5?w=600&q=85";
const TROUSER    = "https://images.unsplash.com/photo-1594938298603-c8148c4b4dd5?w=600&q=85";
const BLAZER     = "https://images.unsplash.com/photo-1592878940526-0214b0f374f6?w=600&q=85";
const SHIRT      = "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&q=85";
const BLK_PANT   = "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&q=85";
const WAISTCOA   = "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&q=85";

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
function sec(t0) { return ((Date.now() - t0) / 1000).toFixed(1); }

const results = [];

// ── E1: VTO base layer + editImage for additional garments ───────────────────
// Architecture: 
//   VTO(person, kurta) → kurta_result
//   editImage(kurta_result + person_as_subject_ref + trouser_as_product_ref, inpaint_insertion, "add trousers")
//   → Final image

async function testE1_VTO_then_Edit(id, name, personUrl, baseGarmentUrl, addGarmentUrls) {
  console.log(`\n[E1-${id}] ${name}`);
  const t0 = Date.now();
  try {
    // Step 1: VTO for base garment (kurta)
    const person = await fetchImg(personUrl);
    const baseGarment = await fetchImg(baseGarmentUrl);
    
    console.log("  [E1] Step 1: VTO base garment...");
    const vtoResp = await ai.models.recontextImage({
      model: VTO_MODEL,
      source: {
        personImage: { imageBytes: person.data, mimeType: person.mime },
        productImages: [{ productImage: { imageBytes: baseGarment.data, mimeType: baseGarment.mime } }],
      },
      config: { numberOfImages: 1, baseSteps: 120 },
    });
    const vtoBytes = vtoResp.generatedImages?.[0]?.image?.imageBytes;
    if (!vtoBytes) throw new Error("VTO Step 1 failed - no imageBytes");
    save(vtoBytes, `e1_${id}_step1_vto.jpg`);
    console.log("  [E1] Step 1 done. Now adding additional garments via editImage...");

    // Step 2: editImage to add each additional garment
    const { SubjectReferenceImage, RawReferenceImage } = await import("@google/genai");
    
    let currentBase = vtoBytes;
    let stepIdx = 2;
    for (const garmentUrl of addGarmentUrls) {
      const g = await fetchImg(garmentUrl);
      const vtoResult = new RawReferenceImage({
        referenceImage: { imageBytes: currentBase, mimeType: "image/jpeg" },
        referenceId: 0,
      });
      const garmentRef = new SubjectReferenceImage({
        referenceImage: { imageBytes: g.data, mimeType: g.mime },
        referenceId: 1,
        config: { subjectType: "SUBJECT_TYPE_PRODUCT" },
      });
      const originalPerson = new SubjectReferenceImage({
        referenceImage: { imageBytes: person.data, mimeType: person.mime },
        referenceId: 2,
        config: { subjectType: "SUBJECT_TYPE_PERSON" },
      });
      
      console.log(`  [E1] Step ${stepIdx}: editImage adding garment ${stepIdx - 1}...`);
      const editResp = await ai.models.editImage({
        model: EDIT_MODEL,
        prompt: "Add the garment [1] to the lower body region of the person in image [0]. Preserve the face and upper body from image [0] exactly as-is. Maintain the garment's original color and pattern.",
        referenceImages: [vtoResult, garmentRef, originalPerson],
        config: {
          numberOfImages: 1,
          editMode: "EDIT_MODE_INPAINT_INSERTION",
          personGeneration: "ALLOW_ADULT",
          includeRaiReason: true,
        },
      });
      const editBytes = editResp.generatedImages?.[0]?.image?.imageBytes;
      if (!editBytes) {
        const rai = editResp.generatedImages?.[0]?.raiFilteredReason;
        throw new Error(rai ? `RAI: ${rai}` : "editImage returned no bytes");
      }
      save(editBytes, `e1_${id}_step${stepIdx}_edit.jpg`);
      currentBase = editBytes;
      stepIdx++;
    }
    
    const elapsed = sec(t0);
    results.push({ id: "E1", name, ok: true, elapsed, note: `VTO+editImage chain, ${addGarmentUrls.length + 1} garments`, files: [] });
    console.log(`  ✅ [${elapsed}s] ${name}: Complete`);
    return currentBase;
  } catch (err) {
    const elapsed = sec(t0);
    results.push({ id: "E1", name, ok: false, elapsed, note: err.message?.slice(0, 200) });
    console.log(`  ❌ [${elapsed}s] ${name}: ${err.message?.slice(0, 150)}`);
    return null;
  }
}

// ── E2: segmentImage to get body region masks, then per-region inpainting ─────
async function testE2_Segment_and_Inpaint(id, name, personUrl, garmentUrl, segmentPrompt, inpaintPrompt) {
  console.log(`\n[E2-${id}] ${name}`);
  const t0 = Date.now();
  try {
    const person = await fetchImg(personUrl);
    const garment = await fetchImg(garmentUrl);
    
    // Step 1: Segment to get a mask of the target body region
    console.log("  [E2] Segmenting body region...");
    const segResp = await ai.models.segmentImage({
      model: SEG_MODEL,
      source: { image: { imageBytes: person.data, mimeType: person.mime } },
      config: { mode: "semantic", prompt: segmentPrompt },
    });
    const maskBytes = segResp.generatedMasks?.[0]?.mask?.imageBytes;
    if (!maskBytes) throw new Error("Segmentation returned no mask");
    save(maskBytes, `e2_${id}_mask.png`);
    console.log("  [E2] Mask generated. Applying inpaint...");
    
    // Step 2: editImage with user-provided mask + garment as SubjectReference
    const { MaskReferenceImage, SubjectReferenceImage, RawReferenceImage } = await import("@google/genai");
    
    const rawPerson = new RawReferenceImage({
      referenceImage: { imageBytes: person.data, mimeType: person.mime },
      referenceId: 0,
    });
    const maskRef = new MaskReferenceImage({
      referenceImage: { imageBytes: maskBytes, mimeType: "image/png" },
      referenceId: 1,
      config: { maskMode: "MASK_MODE_USER_PROVIDED" },
    });
    const garmentRef = new SubjectReferenceImage({
      referenceImage: { imageBytes: garment.data, mimeType: garment.mime },
      referenceId: 2,
      config: { subjectType: "SUBJECT_TYPE_PRODUCT" },
    });
    
    const editResp = await ai.models.editImage({
      model: EDIT_MODEL,
      prompt: inpaintPrompt,
      referenceImages: [rawPerson, maskRef, garmentRef],
      config: {
        numberOfImages: 1,
        editMode: "EDIT_MODE_INPAINT_INSERTION",
        personGeneration: "ALLOW_ADULT",
        includeRaiReason: true,
      },
    });
    const editBytes = editResp.generatedImages?.[0]?.image?.imageBytes;
    if (!editBytes) {
      const rai = editResp.generatedImages?.[0]?.raiFilteredReason;
      throw new Error(rai ? `RAI: ${rai}` : "No imageBytes from inpaint");
    }
    save(editBytes, `e2_${id}_result.jpg`);
    const elapsed = sec(t0);
    results.push({ id: "E2", name, ok: true, elapsed, note: "segment + inpaint", files: [`e2_${id}_result.jpg`] });
    console.log(`  ✅ [${elapsed}s] ${name}`);
    return editBytes;
  } catch (err) {
    const elapsed = sec(t0);
    results.push({ id: "E2", name, ok: false, elapsed, note: err.message?.slice(0, 200) });
    console.log(`  ❌ [${elapsed}s] ${name}: ${err.message?.slice(0, 150)}`);
    return null;
  }
}

async function main() {
  console.log("╔═══════════════════════════════════════════════════════╗");
  console.log("║  OPTION E: Controlled Multi-Stage Composition          ║");
  console.log("╚═══════════════════════════════════════════════════════╝");
  console.log("Project:", process.env.GOOGLE_CLOUD_PROJECT);
  
  // E1 Tests: VTO for base layer, editImage for additional
  console.log("\n══ E1: VTO(base) + editImage(additional garments) ══");
  
  await testE1_VTO_then_Edit("kurta_trouser", "Kurta(VTO) + Trouser(edit)",
    PERSON_MAN, KURTA, [TROUSER]);
  
  await testE1_VTO_then_Edit("kurta_trouser_blazer", "Kurta(VTO) + Trouser + Blazer(edit)",
    PERSON_MAN, KURTA, [TROUSER, BLAZER]);
  
  await testE1_VTO_then_Edit("shirt_pant_waistcoat", "Shirt(VTO) + Pant + Waistcoat(edit)",
    PERSON_MAN, SHIRT, [BLK_PANT, WAISTCOA]);
  
  await new Promise(r => setTimeout(r, 2000));
  
  // E2 Tests: segment body regions + inpaint
  console.log("\n══ E2: segmentImage + editImage inpaint per region ══");
  
  await testE2_Segment_and_Inpaint(
    "trouser", "Segment lower body + apply trouser",
    PERSON_MAN, TROUSER,
    "lower body, legs, trousers area",
    "Replace the lower body clothing [mask region 1] with the trouser [2]. Preserve the face, upper body, and all other areas exactly as they are in the original image [0]."
  );
  
  await testE2_Segment_and_Inpaint(
    "kurta", "Segment upper body + apply kurta",
    PERSON_MAN, KURTA,
    "upper body, torso, chest, shirt area",
    "Replace the upper body clothing [mask region 1] with the kurta [2]. Preserve the face, lower body, and all other areas exactly as they are in the original image [0]. Preserve kurta color and pattern exactly."
  );
  
  // ── Final Summary ─────────────────────────────────────────
  console.log("\n╔═══════════════════════════════════════════════════════╗");
  console.log("║  OPTION E — SUMMARY                                   ║");
  console.log("╚═══════════════════════════════════════════════════════╝");
  
  const e1 = results.filter(r => r.id === "E1");
  const e2 = results.filter(r => r.id === "E2");
  
  console.log("\nE1 (VTO base + editImage additional):");
  e1.forEach(r => console.log(`  ${r.ok ? "PASS" : "FAIL"} [${r.elapsed}s] ${r.name}: ${r.note}`));
  
  console.log("\nE2 (segmentImage + inpaint):");
  e2.forEach(r => console.log(`  ${r.ok ? "PASS" : "FAIL"} [${r.elapsed}s] ${r.name}: ${r.note}`));
  
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "option-e-report.json"),
    JSON.stringify({ generated: new Date().toISOString(), results }, null, 2)
  );
  console.log("\nImages + report saved to:", OUTPUT_DIR);
}

main().catch(e => { console.error("FATAL:", e); process.exit(1); });
