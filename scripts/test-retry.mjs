/**
 * FEASIBILITY RETRY TEST: Kurta + Trouser with exponential backoff retry
 * 
 * Tests whether the Step 2 500 errors are transient (API overload) or
 * structural (model rejects generated images as person inputs).
 * 
 * Run: node scripts/test-retry.mjs
 */
import { GoogleGenAI } from "@google/genai";
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
}

if (process.env.GOOGLE_CREDENTIALS) {
  const p = path.join(os.tmpdir(), "google-credentials-retry.json");
  fs.writeFileSync(p, process.env.GOOGLE_CREDENTIALS);
  process.env.GOOGLE_APPLICATION_CREDENTIALS = p;
} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  const resolved = path.resolve(process.cwd(), process.env.GOOGLE_APPLICATION_CREDENTIALS);
  if (fs.existsSync(resolved)) process.env.GOOGLE_APPLICATION_CREDENTIALS = resolved;
}

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

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function singleTryOnWithRetry(personB64, personMime, productUrl, label, maxRetries = 3) {
  const g = await fetchImage(productUrl);
  let lastErr;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const t0 = Date.now();
    try {
      console.log(`    [attempt ${attempt}/${maxRetries}] calling model for: ${label}`);
      const resp = await ai.models.recontextImage({
        model: MODEL,
        source: {
          personImage: { imageBytes: personB64, mimeType: personMime },
          productImages: [{ productImage: { imageBytes: g.data, mimeType: g.mimeType } }],
        },
        config: { numberOfImages: 1, baseSteps: 120 },
      });
      const bytes = resp.generatedImages?.[0]?.image?.imageBytes;
      if (!bytes) throw new Error("No imageBytes");
      const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
      console.log(`    [attempt ${attempt}] SUCCESS: ${label} in ${elapsed}s`);
      return { base64: bytes, elapsed: parseFloat(elapsed), attempt };
    } catch (err) {
      lastErr = err;
      const msg = err.message || String(err);
      const isRetryable = msg.includes("500") || msg.includes("INTERNAL") || msg.includes("overload") || msg.includes("503");
      console.log(`    [attempt ${attempt}] FAILED: ${msg.slice(0, 80)} (retryable=${isRetryable})`);
      if (!isRetryable || attempt === maxRetries) break;
      const delay = 15000 * attempt; // 15s, 30s backoff
      console.log(`    [waiting ${delay/1000}s before retry...]`);
      await sleep(delay);
    }
  }
  throw lastErr;
}

async function main() {
  console.log("=== RETRY TEST: Kurta + Trouser sequential chaining with retry ===");
  console.log("Model:", MODEL, "| Max retries per step: 3");

  // Use the same Unsplash images from the original test
  const PERSON = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=768&q=85";
  const KURTA  = "https://images.unsplash.com/photo-1622519407650-3df9883f76a5?w=600&q=85";
  const TROUSER = "https://images.unsplash.com/photo-1594938298603-c8148c4b4dd5?w=600&q=85";
  const BLAZER = "https://images.unsplash.com/photo-1592878940526-0214b0f374f6?w=600&q=85";

  try {
    console.log("\n--- Step 1: Kurta (base layer) ---");
    const personInit = await fetchImage(PERSON);
    const step1 = await singleTryOnWithRetry(personInit.data, personInit.mimeType, KURTA, "Kurta (base)");
    fs.writeFileSync(path.join(OUTPUT_DIR, "retry_step1_kurta.jpg"), Buffer.from(step1.base64, "base64"));
    console.log("    -> Saved: retry_step1_kurta.jpg");
    
    console.log("\n--- Step 2: Trouser (bottom layer, person = step1 result) ---");
    const step2 = await singleTryOnWithRetry(step1.base64, "image/jpeg", TROUSER, "Trouser (bottom)");
    fs.writeFileSync(path.join(OUTPUT_DIR, "retry_step2_trouser.jpg"), Buffer.from(step2.base64, "base64"));
    console.log("    -> Saved: retry_step2_trouser.jpg");

    console.log("\n--- Step 3: Blazer (outer layer, person = step2 result) ---");
    const step3 = await singleTryOnWithRetry(step2.base64, "image/jpeg", BLAZER, "Blazer (outer)");
    fs.writeFileSync(path.join(OUTPUT_DIR, "retry_step3_blazer.jpg"), Buffer.from(step3.base64, "base64"));
    console.log("    -> Saved: retry_step3_blazer.jpg");

    console.log("\n=== ALL 3 STEPS SUCCEEDED ===");
    console.log(`Step 1: ${step1.elapsed}s (attempt ${step1.attempt})`);
    console.log(`Step 2: ${step2.elapsed}s (attempt ${step2.attempt})`);
    console.log(`Step 3: ${step3.elapsed}s (attempt ${step3.attempt})`);
    console.log("CONCLUSION: 500 errors were TRANSIENT (API overload) — pipeline is structurally viable.");

  } catch (err) {
    console.error("\n=== FAILED even with retries ===");
    console.error(err.message || err);
    console.log("CONCLUSION: 500 errors may be STRUCTURAL for this garment combination.");
    console.log("Check output images for context. Consider alternative garment images or garment type.");
  }
}

main().catch(e => { console.error("FATAL:", e); process.exit(1); });
