// Makes the Cafflaire voice clips with ElevenLabs and saves them in public/audio/.
// Run it ON YOUR OWN COMPUTER (not on Vercel). The API key stays in .env.local and is never committed.
//
//   1) See voices on your account:      node scripts/generate-voice.mjs --list
//   2) Put the one you like in .env.local as ELEVENLABS_VOICE_ID
//   3) Make the clips:                  node scripts/generate-voice.mjs
//   Re-make one clip with new spelling: node scripts/generate-voice.mjs --only cafflaire --text "Kaf-flair"
import fs from "node:fs";
import path from "node:path";
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
config({ quiet: true });

const KEY = process.env.ELEVENLABS_API_KEY;
const VOICE = process.env.ELEVENLABS_VOICE_ID;
const MODEL = process.env.ELEVENLABS_MODEL_ID ?? "eleven_multilingual_v2";
const API = "https://api.elevenlabs.io/v1";

// Edit the spelling here if the name is not pronounced the way you like.
const CLIPS = [
  { id: "cafflaire", file: "cafflaire.mp3", text: "Caff-lair." },
  { id: "orderup", file: "order-up.mp3", text: "Order up!" },
];

const args = process.argv.slice(2);
const arg = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const die = (m) => { console.error(m); process.exit(1); };

if (!KEY) die("Missing ELEVENLABS_API_KEY. Add it to .env.local (this file is git-ignored).");

if (args.includes("--list")) {
  const res = await fetch(`${API}/voices`, { headers: { "xi-api-key": KEY } });
  if (!res.ok) die(`ElevenLabs said ${res.status}: ${await res.text()}`);
  const { voices } = await res.json();
  for (const v of voices) console.log(`${(v.labels?.gender ?? "?").padEnd(8)} ${v.name.padEnd(22)} ${v.voice_id}  (${v.category})`);
  console.log("\nCopy the ID of a female voice into .env.local as ELEVENLABS_VOICE_ID=...");
  process.exit(0);
}

if (!VOICE) die("Missing ELEVENLABS_VOICE_ID. Run with --list first, pick a female voice, add its ID to .env.local.");

const only = arg("--only");
const override = arg("--text");
const outDir = path.join("public", "audio");
fs.mkdirSync(outDir, { recursive: true });

for (const clip of CLIPS.filter((c) => !only || c.id === only)) {
  const text = only && override ? override : clip.text;
  const res = await fetch(`${API}/text-to-speech/${VOICE}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": KEY, "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({
      text,
      model_id: MODEL,
      voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.35, use_speaker_boost: true },
    }),
  });
  if (!res.ok) die(`ElevenLabs said ${res.status} for "${clip.id}": ${await res.text()}`);
  fs.writeFileSync(path.join(outDir, clip.file), Buffer.from(await res.arrayBuffer()));
  console.log(`Saved public/audio/${clip.file}  ("${text}")`);
}
console.log("Done. Play the files, then commit public/audio/ (they are not secret).");
