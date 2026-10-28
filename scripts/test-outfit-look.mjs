/**
 * FEASIBILITY TEST: Sequential Multi-Garment Virtual Try-On
 * Tests the core hypothesis: can virtual-try-on-001 used sequentially
 * produce ONE coherent multi-garment outfit image?
 * Run: node scripts/test-outfit-look.mjs
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
  console.log("[setup] Loaded .env.local");
}

// Handle GOOGLE_CREDENTIALS or GOOGLE_APPLICATION_CREDENTIALS
if (process.env.GOOGLE_CREDENTIALS) {
  const p = path.join(os.tmpdir(), "google-credentials-test.json");
  fs.writeFileSync(p, process.env.GOOGLE_CREDENTIALS);
  process.env.GOOGLE_APPLICATION_CREDENTIALS = p;
} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  const resolved = path.resolve(process.cwd(), process.env.GOOGLE_APPLICATION_CREDENTIALS);
  if (fs.existsSync(resolved)) process.env.GOOGLE_APPLICATION_CREDENTIALS = resolved;
}

console.log("[setup] Credentials:", process.env.GOOGLE_APPLICATION_CREDENTIALS);
console.log("[setup] Project:", process.env.GOOGLE_CLOUD_PROJECT);

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

function save(buffer, name) {
  const p = path.join(OUTPUT_DIR, name);
  fs.writeFileSync(p, buffer);
  return p;
}

async function singleTryOn(personB64, personMime, productUrl, label) {
  const t0 = Date.now();
  console.log("    [step] fetching garment:", label);
  const g = await fetchImage(productUrl);
  console.log("    [step] calling model...");
  const resp = await ai.models.recontextImage({
    model: MODEL,
    source: {
      personImage: { imageBytes: personB64, mimeType: personMime },
      productImages: [{ productImage: { imageBytes: g.data, mimeType: g.mimeType } }],
    },
    config: { numberOfImages: 1, baseSteps: 120 },
  });
  const bytes = resp.generatedImages?.[0]?.image?.imageBytes;
  if (!bytes) throw new Error("No imageBytes in response for: " + label);
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log("    [step] done:", label, elapsed + "s");
  return { base64: bytes, mimeType: "image/jpeg", elapsed: parseFloat(elapsed) };
}

// Test cases — using publicly accessible Unsplash + standard fashion images
const PERSON_MAN = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=768&q=85";
const KURTA     = "https://images.unsplash.com/photo-1622519407650-3df9883f76a5?w=600&q=85";
const TROUSER   = "https://images.unsplash.com/photo-1594938298603-c8148c4b4dd5?w=600&q=85";
const BLAZER    = "https://images.unsplash.com/photo-1592878940526-0214b0f374f6?w=600&q=85";
const SHIRT     = "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&q=85";
const BLK_PANT  = "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&q=85";
const WAISTCOAT = "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&q=85";

const TESTS = [
  {
    id: "t1_2piece",
    name: "2-Piece: Kurta + Trouser",
    person: PERSON_MAN,
    garments: [
      { url: KURTA,   label: "Kurta (base)" },
      { url: TROUSER, label: "Trouser (bottom)" },
    ],
  },
  {
    id: "t2_jodhpuri",
    name: "3-Piece Jodhpuri: Kurta + Trouser + Blazer",
    person: PERSON_MAN,
    garments: [
      { url: KURTA,   label: "Kurta (base)" },
      { url: TROUSER, label: "Trouser (bottom)" },
      { url: BLAZER,  label: "Blazer (outer)" },
    ],
  },
  {
    id: "t3_suit",
    name: "3-Piece Suit: Shirt + Trousers + Waistcoat",
    person: PERSON_MAN,
    garments: [
      { url: SHIRT,     label: "Shirt (base)" },
      { url: BLK_PANT,  label: "Black Trousers (bottom)" },
      { url: WAISTCOAT, label: "Waistcoat (middle layer)" },
    ],
  },
];

async function runTest(tc) {
  console.log("\n" + "=".repeat(56));
  console.log("TEST:", tc.name);
  console.log("=".repeat(56));
  const t0 = Date.now();
  const steps = [];

  const init = await fetchImage(tc.person);
  save(init.buffer, tc.id + "_0_person.jpg");

  let personB64 = init.data;
  let personMime = init.mimeType;

  for (let i = 0; i < tc.garments.length; i++) {
    const g = tc.garments[i];
    try {
      const r = await singleTryOn(personB64, personMime, g.url, g.label);
      const buf = Buffer.from(r.base64, "base64");
      const fname = tc.id + "_" + (i + 1) + "_" + g.label.split(" ")[0].toLowerCase() + ".jpg";
      save(buf, fname);
      steps.push({ step: i + 1, label: g.label, elapsed: r.elapsed, ok: true, file: fname });
      personB64 = r.base64;
      personMime = "image/jpeg";
    } catch (e) {
      console.error("  FAILED step", i + 1, e.message);
      steps.push({ step: i + 1, label: g.label, elapsed: null, ok: false, error: e.message });
      break;
    }
  }

  const total = ((Date.now() - t0) / 1000).toFixed(1);
  const ok = steps.every(s => s.ok) && steps.length === tc.garments.length;
  console.log(ok ? "  RESULT: SUCCESS" : "  RESULT: FAILED/PARTIAL");
  console.log("  Total:", total + "s");
  steps.forEach(s => console.log("    Step", s.step, s.label, s.ok ? s.elapsed + "s -> " + s.file : "FAIL: " + s.error));
  return { name: tc.name, ok, steps, total: parseFloat(total) };
}

async function main() {
  console.log("TRYONITY - Look Studio AI Feasibility Test");
  console.log("Model:", MODEL);
  console.log("Output:", OUTPUT_DIR);

  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS || !fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
    console.error("ERROR: credentials file missing:", process.env.GOOGLE_APPLICATION_CREDENTIALS);
    process.exit(1);
  }

  const results = [];
  for (const tc of TESTS) {
    results.push(await runTest(tc));
    await new Promise(r => setTimeout(r, 1500));
  }

  console.log("\n" + "=".repeat(56));
  console.log("SUMMARY");
  console.log("=".repeat(56));
  for (const r of results) {
    console.log(r.ok ? "PASS" : "FAIL", r.name, r.total + "s");
  }

  fs.writeFileSync(path.join(OUTPUT_DIR, "report.json"), JSON.stringify(results, null, 2));
  console.log("\nImages + report saved to:", OUTPUT_DIR);
  console.log("Manually review images for: identity, face, garment accuracy, occlusion, realism.");
}

main().catch(e => { console.error("FATAL:", e); process.exit(1); });
