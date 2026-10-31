import Link from "next/link";

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "Cafflaire";

export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <rect width="40" height="40" rx="13" className="fill-espresso" />
      <path d="M11 17h16l-1.6 10.2a3 3 0 0 1-3 2.5h-6.8a3 3 0 0 1-3-2.5z" className="fill-cream" />
      <path d="M27 19h1.5a3 3 0 0 1 0 6H26.5" className="stroke-cream" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M16 13c0-1.6 2-1.6 2-3.2M21 13c0-1.6 2-1.6 2-3.2" className="stroke-caramel" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export default function Logo({ href = "/home" }: { href?: string }) {
  return (
    <Link href={href} className="group flex items-center gap-2 rounded-full pr-2 font-display text-xl font-bold tracking-tight">
      <LogoMark className="h-9 w-9 transition-transform duration-300 group-hover:-rotate-6" />
      <span>{APP_NAME}</span>
    </Link>
  );
}
