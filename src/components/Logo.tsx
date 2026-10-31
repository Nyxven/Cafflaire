import Link from "next/link";

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "Cafflaire";

export default function Logo({ href = "/home" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 font-display text-lg font-bold">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-espresso text-lg text-cream" aria-hidden>☕</span>
      <span className="hidden sm:inline">{APP_NAME}</span>
    </Link>
  );
}
