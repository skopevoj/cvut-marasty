#!/usr/bin/env node
import { readFileSync, writeFileSync } from "fs";
import { createHash, createCipheriv, randomBytes } from "crypto";
import { gzipSync as zlibGzip } from "zlib";

// this is what bi-kab taught me, private key inside public repo xd
const TROLL_KEY = "go_touch_grass_pls_no_need_to_look_at_source";

function deriveKey(secret) {
  return createHash("sha256").update(secret).digest();
}

const inputPath = process.argv[2];
const outputPath = process.argv[3];

if (!inputPath || !outputPath) {
  console.error("Usage: node scripts/encrypt-questions.mjs <input.json> <output.enc>");
  process.exit(1);
}

const input = readFileSync(inputPath);
const compressed = zlibGzip(input, { level: 9 });

const key = deriveKey(TROLL_KEY);
const iv = randomBytes(12);
const cipher = createCipheriv("aes-256-gcm", key, iv);

const encrypted = Buffer.concat([cipher.update(compressed), cipher.final()]);
const tag = cipher.getAuthTag();

// format: magic(4) + iv(12) + authTag(16) + ciphertext(gzipped json)
const MAGIC = Buffer.from([0xEC, 0x51, 0x4A, 0x01]);
const combined = Buffer.concat([MAGIC, iv, tag, encrypted]);

writeFileSync(outputPath, combined); // raw binary, no base64

const mb = (b) => (b / 1024 / 1024).toFixed(1);
console.log(`✓ ${inputPath} → ${outputPath}`);
console.log(`  original:   ${mb(input.length)} MB`);
console.log(`  compressed: ${mb(compressed.length)} MB (${((compressed.length / input.length) * 100).toFixed(1)}%)`);
console.log(`  final:      ${mb(combined.length)} MB`);
