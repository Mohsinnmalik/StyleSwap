/**
 * FEASIBILITY FIX TEST: Sequential chaining via Cloudinary intermediate upload
 * 
 * Hypothesis: The 500 error on Step 2 is caused by feeding large AI-generated
 * base64 images directly back as the person image. The fix: upload Step 1 result
 * to Cloudinary, then fetch the Cloudinary URL as the person for Step 2.
 * 
 * Run: node scripts/test-outfit-fix.mjs
 */
import { GoogleGenAI } from "@google/genai";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";
import os from "os";
import https from "https";
import http from "http";

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
  console.log("[setup] Loaded .env.local");
}

// Credentials
if (process.env.GOOGLE_CREDENTIALS) {
  const p = path.join(os.tmpdir(), "google-credentials-fix.json");
  fs.writeFileSync(p, process.env.GOOGLE_CREDENTIALS);
  process.env.GOOGLE_APPLICATION_CREDENTIALS = p;
} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  const resolved = path.resolve(process.cwd(), process.env.GOOGLE_APPLICATION_CREDENTIALS);
  if (fs.existsSync(resolved)) process.env.GOOGLE_APPLICATION_CREDENTIALS = resolved;
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ai = new GoogleGenAI({
  vertexai: true,
  project: process.env.GOOGLE_CLOUD_PROJECT,
  location: process.env.GOOGLE_CLOUD_LOCATION || "us-central1",
});
const MODEL = process.env.VERTEX_AI_MODEL || "virtual-try-on-001";
const OUTPUT_DIR = path.join(process.cwd(), "scripts", "test-output");
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

function fetchImage(url) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith("https") ? https : http;
    proto.get(url, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        const buffer = Buffer.concat(chunks);
        resolve({ data: buffer.toString("base64"), mimeType: res.headers["content-type"] || "image/jpeg", buffer });
      });
      res.on("error", reject);
    }).on("error", reject);
  });
}

/** Upload base64 image to Cloudinary and return its URL */
async function uploadToCloudinary(base64Data, folder) {
  return new Promise((resolve, reject) => {
    const dataUri = `data:image/jpeg;base64,${base64Data}`;
    cloudinary.uploader.upload(dataUri, { folder }, (err, result) => {
      if (err) reject(err);
      else resolve(result.secure_url);
    });
  });
}

async function singleTryOn(personB64, personMime, productUrl, label) {
  const t0 = Date.now();
  console.log("    [step] calling model for:", label);
  const g = await fetchImage(productUrl);
  const resp = await ai.models.recontextImage({
    model: MODEL,
    source: {
      personImage: { imageBytes: personB64, mimeType: personMime },
      productImages: [{ productImage: { imageBytes: g.data, mimeType: g.mimeType } }],
    },
    config: { numberOfImages: 1, baseSteps: 120 },
  });
  const bytes = resp.generatedImages?.[0]?.image?.imageBytes;
  if (!bytes) throw new Error("No imageBytes for: " + label);
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log("    [step] done:", label, elapsed + "s");
  return { base64: bytes, elapsed: parseFloat(elapsed) };
}

async function main() {
  console.log("=== FIX TEST: Sequential chaining via Cloudinary upload ===");
  console.log("Project:", process.env.GOOGLE_CLOUD_PROJECT);
  console.log("Cloudinary:", process.env.CLOUDINARY_CLOUD_NAME);

  const PERSON = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=768&q=85";
  const KURTA  = "https://images.unsplash.com/photo-1622519407650-3df9883f76a5?w=600&q=85";
  const TROUSER = "https://images.unsplash.com/photo-1594938298603-c8148c4b4dd5?w=600&q=85";
  const BLAZER = "https://images.unsplash.com/photo-1592878940526-0214b0f374f6?w=600&q=85";

  try {
    // Step 1: Person + Kurta → result1 (upload to Cloudinary)
    console.log("\n--- Step 1: Apply Kurta ---");
    const personInit = await fetchImage(PERSON);
    const step1 = await singleTryOn(personInit.data, personInit.mimeType, KURTA, "Kurta (base)");
    
    // Save step1 locally for reference
    fs.writeFileSync(path.join(OUTPUT_DIR, "fix_step1_kurta.jpg"), Buffer.from(step1.base64, "base64"));
    console.log("    [step] uploading step1 result to Cloudinary...");
    const step1Url = await uploadToCloudinary(step1.base64, "tryon-fix-test");
    console.log("    [step] Cloudinary URL:", step1Url);

    // Step 2: Fetch step1 from Cloudinary as person → apply Trouser
    console.log("\n--- Step 2: Apply Trouser (person = Cloudinary URL of step1) ---");
    const step1Person = await fetchImage(step1Url);
    console.log("    [step] Step1 image size from Cloudinary:", step1Person.buffer.length, "bytes");
    const step2 = await singleTryOn(step1Person.data, step1Person.mimeType, TROUSER, "Trouser (bottom)");
    
    fs.writeFileSync(path.join(OUTPUT_DIR, "fix_step2_trouser.jpg"), Buffer.from(step2.base64, "base64"));
    console.log("    [step] uploading step2 result to Cloudinary...");
    const step2Url = await uploadToCloudinary(step2.base64, "tryon-fix-test");
    console.log("    [step] Cloudinary URL:", step2Url);

    // Step 3: Apply Blazer
    console.log("\n--- Step 3: Apply Blazer (outer) ---");
    const step2Person = await fetchImage(step2Url);
    console.log("    [step] Step2 image size from Cloudinary:", step2Person.buffer.length, "bytes");
    const step3 = await singleTryOn(step2Person.data, step2Person.mimeType, BLAZER, "Blazer (outer)");
    
    fs.writeFileSync(path.join(OUTPUT_DIR, "fix_step3_blazer.jpg"), Buffer.from(step3.base64, "base64"));
    console.log("    [step] uploading final result to Cloudinary...");
    const finalUrl = await uploadToCloudinary(step3.base64, "tryon-fix-test");

    console.log("\n=== RESULT: SUCCESS ===");
    console.log("Final outfit URL:", finalUrl);
    console.log("Total: step1=" + step1.elapsed + "s, step2=" + step2.elapsed + "s, step3=" + step3.elapsed + "s");
    console.log("Local files saved in:", OUTPUT_DIR);

  } catch (err) {
    console.error("\n=== RESULT: FAILED ===");
    console.error(err.message || err);
    if (err.status) console.error("HTTP Status:", err.status);
  }
}

main().catch(e => { console.error("FATAL:", e); process.exit(1); });
