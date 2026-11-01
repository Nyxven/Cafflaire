"use client";
import { useEffect, useRef, useState } from "react";
import { fmt } from "@/lib/catalog";

export interface ReceiptData {
  number: string;
  createdAt: string; // ISO
  fulfilment: "pickup" | "delivery";
  pickupTime: string | null; // ISO
  city: string | null;
  items: { qty: number; name: string; unitCents: number; size: string; details: string[] }[];
  subtotalCents: number;
  deliveryFeeCents: number;
  totalCents: number;
}

// Paper-receipt look, drawn on a <canvas> so it can be saved / shared as a PNG with no extra libraries.
// Phone number and street address are NOT printed (people share receipts).
const W = 380;
const M = 14; // margin around the paper
const PAD = 24; // padding inside the paper
const SCALE = 2; // sharper image
const INK = "#3b2417";
const SOFT = "rgba(59,36,23,0.62)";
const ACCENT = "#c68642";
const PAPER = "#fffdf8";
const BACK = "#f3e5d0";
const SERIF = 'Georgia, "Times New Roman", serif';
const SANS = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const MONO = '"SFMono-Regular", Menlo, Consolas, "Courier New", monospace';

const when = (iso: string) => new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" }).format(new Date(iso));
const clock = (iso: string) => new Intl.DateTimeFormat("en-PH", { timeStyle: "short", timeZone: "Asia/Manila" }).format(new Date(iso));

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const test = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(test).width > maxW) { lines.push(line); line = word; } else line = test;
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

/** Draws the receipt (or only measures it when paint = false) and returns the height it needs. */
function layout(ctx: CanvasRenderingContext2D, d: ReceiptData, paint: boolean, host: string): number {
  const x0 = M + PAD;
  const x1 = W - M - PAD;
  const iw = x1 - x0;
  let y = M + 34;

  const put = (s: string, x: number, font: string, color: string, align: CanvasTextAlign = "left") => {
    ctx.font = font;
    if (!paint) return;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = "alphabetic";
    ctx.fillText(s, x, y);
  };
  const dash = () => {
    y += 8;
    if (paint) {
      ctx.save();
      ctx.strokeStyle = "rgba(59,36,23,0.3)";
      ctx.setLineDash([5, 4]);
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
      ctx.restore();
    }
    y += 18;
  };
  const row = (label: string, value: string, bold = false) => {
    put(label, x0, `13px ${SANS}`, SOFT);
    put(value, x1, `${bold ? "700" : "500"} 13px ${bold ? MONO : SANS}`, INK, "right");
    y += 20;
  };

  // header
  put("Cafflaire", W / 2, `700 32px ${SERIF}`, INK, "center");
  y += 20;
  put("ORDER RECEIPT", W / 2, `600 11px ${SANS}`, ACCENT, "center");
  y += 4;
  dash();

  row("Order", d.number, true);
  row("Date", when(d.createdAt));
  const type = d.fulfilment === "pickup"
    ? `Pickup · ${d.pickupTime ? clock(d.pickupTime) : "ASAP"}`
    : `Delivery${d.city ? ` · ${d.city}` : ""}`;
  row("Type", type);
  y -= 4;
  dash();

  // items
  const priceW = 78;
  for (const i of d.items) {
    ctx.font = `700 14px ${SANS}`;
    const nameLines = wrap(ctx, `${i.qty}× ${i.name}`, iw - priceW);
    nameLines.forEach((ln, k) => {
      put(ln, x0, `700 14px ${SANS}`, INK);
      if (k === 0) put(fmt(i.unitCents * i.qty), x1, `600 14px ${SANS}`, INK, "right");
      y += 18;
    });
    ctx.font = `12px ${SANS}`;
    const small = wrap(ctx, [i.size, ...i.details].join(" · "), iw - 6);
    for (const ln of small) { put(ln, x0 + 6, `12px ${SANS}`, SOFT); y += 16; }
    if (i.qty > 1) { put(`${fmt(i.unitCents)} each`, x0 + 6, `12px ${SANS}`, SOFT); y += 16; }
    y += 8;
  }
  y -= 6;
  dash();

  // totals
  row("Subtotal", fmt(d.subtotalCents));
  row("Delivery fee", d.deliveryFeeCents ? fmt(d.deliveryFeeCents) : "Free");
  y += 4;
  put("TOTAL", x0, `700 17px ${SANS}`, INK);
  put(fmt(d.totalCents), x1, `700 20px ${SERIF}`, INK, "right");
  y += 26;
  put(`Payment: cash on ${d.fulfilment === "pickup" ? "pickup" : "delivery"}`, x0, `12px ${SANS}`, SOFT);
  y += 4;
  dash();

  // footer
  put("Thank you for ordering!", W / 2, `italic 15px ${SERIF}`, INK, "center");
  y += 20;
  put(host, W / 2, `11px ${SANS}`, SOFT, "center");
  y += 22;

  return y + M + 6;
}

function render(canvas: HTMLCanvasElement, d: ReceiptData) {
  const host = typeof window !== "undefined" ? window.location.host : "";
  // 1) measure
  const probe = document.createElement("canvas").getContext("2d");
  if (!probe) return;
  const height = Math.ceil(layout(probe, d, false, host));
  // 2) paint
  canvas.width = W * SCALE;
  canvas.height = height * SCALE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  ctx.fillStyle = BACK;
  ctx.fillRect(0, 0, W, height);

  // paper with zig-zag top and bottom edges
  const left = M, right = W - M, top = M, bottom = height - M, tooth = 8;
  ctx.save();
  ctx.shadowColor = "rgba(59,36,23,0.18)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 3;
  ctx.fillStyle = PAPER;
  const teeth = Math.max(1, Math.round((right - left) / tooth));
  const step = (right - left) / teeth;
  ctx.beginPath();
  ctx.moveTo(left, top);
  for (let k = 0; k < teeth; k++) {
    ctx.lineTo(left + k * step + step / 2, top + 6);
    ctx.lineTo(left + (k + 1) * step, top);
  }
  ctx.lineTo(right, bottom);
  for (let k = 0; k < teeth; k++) {
    ctx.lineTo(right - k * step - step / 2, bottom - 6);
    ctx.lineTo(right - (k + 1) * step, bottom);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  layout(ctx, d, true, host);
}

export default function Receipt({ data }: { data: ReceiptData }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [note, setNote] = useState("");
  const key = JSON.stringify(data); // redraw only when the order really changed (the page refreshes itself every few seconds)
  const fileName = `Cafflaire-receipt-${data.number}.png`;

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    render(c, JSON.parse(key) as ReceiptData);
  }, [key]);

  const toBlob = () => new Promise<Blob | null>((res) => (ref.current ? ref.current.toBlob(res, "image/png") : res(null)));

  const download = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  async function save() {
    setNote("");
    const blob = await toBlob();
    if (!blob) return setNote("Sorry, we couldn't make the image. Please try again.");
    download(blob);
    setNote("Saved! Check your Downloads (or Photos) folder.");
  }

  async function share() {
    setNote("");
    const blob = await toBlob();
    if (!blob) return setNote("Sorry, we couldn't make the image. Please try again.");
    const file = new File([blob], fileName, { type: "image/png" });
    if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: "My Cafflaire receipt", text: `My Cafflaire order ${data.number}` });
      } catch (e) {
        if ((e as Error).name !== "AbortError") setNote("Sharing didn't work. Try “Save image” instead.");
      }
      return;
    }
    download(blob);
    setNote("This device can't share directly, so the receipt was saved as an image instead.");
  }

  return (
    <section className="card space-y-4" aria-labelledby="receipt-title">
      <div>
        <h2 id="receipt-title" className="text-xl font-bold">Your receipt</h2>
        <p className="text-sm opacity-70">Keep a copy or send it to a friend.</p>
      </div>
      <canvas ref={ref} role="img" aria-label={`Receipt for order ${data.number}, total ${fmt(data.totalCents)}`} className="mx-auto h-auto w-full max-w-[340px] rounded-2xl" />
      <div className="grid grid-cols-2 gap-3">
        <button type="button" className="btn-accent" onClick={save}>⬇ Save image</button>
        <button type="button" className="btn-ghost" onClick={share}>↗ Share</button>
      </div>
      <p role="status" className="min-h-5 text-center text-sm opacity-80">{note}</p>
    </section>
  );
}
