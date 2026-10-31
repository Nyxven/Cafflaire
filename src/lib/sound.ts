"use client";
// Tiny synthesized sound effects (Web Audio) — no audio files needed. Respects the mute toggle.
import { useSound } from "./store";

export type Sfx = "tap" | "drop" | "pour" | "chime" | "pump" | "tick" | "ding";
let ctx: AudioContext | null = null;

function audio() {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx ??= new AC();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(a: AudioContext, freq: number, at: number, dur: number, type: OscillatorType = "sine", vol = 0.12) {
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, at);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(vol, at + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g).connect(a.destination);
  o.start(at);
  o.stop(at + dur + 0.02);
}

export function play(s: Sfx) {
  if (useSound.getState().muted) return;
  try {
    const a = audio();
    if (!a) return;
    const t = a.currentTime;
    if (s === "tap") tone(a, 620, t, 0.07, "triangle", 0.09);
    else if (s === "drop") { tone(a, 330, t, 0.12, "sine", 0.14); tone(a, 220, t + 0.05, 0.14, "sine", 0.1); }
    else if (s === "pump") { tone(a, 150, t, 0.09, "square", 0.07); tone(a, 95, t + 0.04, 0.12, "sine", 0.12); }
    else if (s === "tick") tone(a, 900, t, 0.05, "triangle", 0.07);
    else if (s === "ding") { tone(a, 1568, t, 0.5, "sine", 0.14); tone(a, 2093, t + 0.02, 0.7, "sine", 0.1); tone(a, 3136, t + 0.02, 0.3, "triangle", 0.04); }
    else if (s === "chime") { tone(a, 784, t, 0.18, "sine", 0.12); tone(a, 1047, t + 0.1, 0.28, "sine", 0.12); }
    else {
      // pour: filtered noise sweeping downward
      const len = Math.floor(a.sampleRate * 0.5);
      const buf = a.createBuffer(1, len, a.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      const src = a.createBufferSource();
      src.buffer = buf;
      const f = a.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.setValueAtTime(1800, t);
      f.frequency.exponentialRampToValueAtTime(500, t + 0.5);
      const g = a.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.12, t + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      src.connect(f).connect(g).connect(a.destination);
      src.start(t);
    }
  } catch { /* audio is a nice-to-have */ }
}
