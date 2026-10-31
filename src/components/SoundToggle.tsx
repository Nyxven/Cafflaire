"use client";
import { useHydrated } from "@/lib/hydrated";
import { play } from "@/lib/sound";
import { useSound } from "@/lib/store";

export default function SoundToggle({ className = "" }: { className?: string }) {
  const hydrated = useHydrated();
  const { muted, toggle } = useSound();
  const off = hydrated && muted;
  return (
    <button type="button" onClick={() => { toggle(); if (off) setTimeout(() => play("tap"), 0); }} aria-pressed={!off} aria-label={off ? "Unmute sounds" : "Mute sounds"} title={off ? "Sound off" : "Sound on"} className={`grid h-11 w-11 place-items-center rounded-full text-xl hover:bg-milk ${className}`}>
      <span aria-hidden>{off ? "🔇" : "🔊"}</span>
    </button>
  );
}
