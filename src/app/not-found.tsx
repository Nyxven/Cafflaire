import Link from "next/link";

export default function NotFound() {
  return (<main className="grid min-h-dvh place-items-center p-6 text-center"><div><div className="text-6xl">☕</div><h1 className="mt-2 text-4xl font-bold">Nothing brewing here</h1><p className="mb-5 opacity-70">That page doesn&apos;t exist.</p><Link href="/home" className="btn-accent">Back home</Link></div></main>);
}
