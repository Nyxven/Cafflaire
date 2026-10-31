"use client";
// The Cafflaire "voice": short pre-recorded ElevenLabs clips served from /public/audio.
// No API key is ever used in the browser. If a clip file is missing, the intro falls back
// to the browser's built-in speech so the site still "talks".
import { useSound } from "./store";

export type Clip = "cafflaire" | "orderup";
export type SpeakResult = "played" | "blocked" | "muted" | "failed";

const SRC: Record<Clip, string> = { cafflaire: "/audio/cafflaire.mp3", orderup: "/audio/order-up.mp3" };
// Browser-voice fallback text (only for clips where a robot voice is acceptable).
const FALLBACK: Partial<Record<Clip, string>> = { cafflaire: "Caff lair" };

const cache = new Map<Clip, HTMLAudioElement>();

function browserVoice(text: string): SpeakResult {
  try {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return "failed";
    const u = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const female = voices.find((v) => /female|samantha|zira|aria|jenny|karen|moira|tessa|google uk english female/i.test(v.name));
    if (female) u.voice = female;
    u.pitch = 1.15;
    u.rate = 0.95;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
    return "played";
  } catch {
    return "failed";
  }
}

export async function speak(clip: Clip): Promise<SpeakResult> {
  if (typeof window === "undefined") return "failed";
  if (useSound.getState().muted) return "muted";
  try {
    let a = cache.get(clip);
    if (!a) {
      a = new Audio(SRC[clip]);
      a.preload = "auto";
      cache.set(clip, a);
    }
    a.currentTime = 0;
    await a.play();
    return "played";
  } catch (e) {
    // Browsers block sound until the person has tapped/clicked once.
    if (e instanceof DOMException && e.name === "NotAllowedError") return "blocked";
    const text = FALLBACK[clip];
    return text ? browserVoice(text) : "failed";
  }
}
