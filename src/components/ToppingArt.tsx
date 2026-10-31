// Hand-drawn SVG art for each topping (used on the topping cards and when a topping flies into the cup).
const LINE = { stroke: "#3B2417", strokeOpacity: 0.35, strokeWidth: 2, strokeLinejoin: "round" as const };

export default function ToppingArt({ id, className = "h-14 w-14" }: { id: string; className?: string }) {
  const svg = (children: React.ReactNode) => (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>{children}</svg>
  );

  switch (id) {
    case "whipped":
      return svg(
        <>
          <ellipse cx="32" cy="50" rx="23" ry="9" fill="#fffdf8" {...LINE} />
          <ellipse cx="32" cy="38" rx="18" ry="8.5" fill="#fffdf8" {...LINE} />
          <ellipse cx="32" cy="27" rx="12.5" ry="7.5" fill="#fffdf8" {...LINE} />
          <path d="M32 9c-6 6-2 11 0 12 5-2 5-8 0-12z" fill="#fffdf8" {...LINE} />
          <path d="M20 36c4 2 9 2 12 1M14 49c5 2 11 2 16 1" fill="none" stroke="#e6d9c6" strokeWidth="2" strokeLinecap="round" />
        </>,
      );
    case "caramel_drizzle":
    case "choco_drizzle": {
      const main = id === "caramel_drizzle" ? "#c68642" : "#3b2417";
      const shine = id === "caramel_drizzle" ? "#edc387" : "#7a4a30";
      return svg(
        <>
          <path d="M6 30q9-18 18 0t18 0 16 -6" fill="none" stroke={main} strokeWidth="7" strokeLinecap="round" />
          <path d="M8 27q8-14 16 0t18 0 14 -5" fill="none" stroke={shine} strokeWidth="2" strokeLinecap="round" />
          <path d="M30 38c-5 7-5 11 0 11s5-4 0-11z" fill={main} />
          <path d="M50 36c-4 6-4 9 0 9s4-3 0-9z" fill={main} />
          <ellipse cx="30" cy="57" rx="9" ry="2.5" fill={main} opacity=".25" />
        </>,
      );
    }
    case "cocoa":
      return svg(
        <>
          <path d="M8 52q24-34 48 0z" fill="#5a3a28" {...LINE} />
          <path d="M18 48q14-18 28 0" fill="none" stroke="#7a5238" strokeWidth="2" strokeLinecap="round" />
          {[[22, 22], [30, 14], [40, 20], [47, 30], [16, 32], [34, 28], [27, 36]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i % 2 ? 2 : 1.4} fill="#7a5238" />)}
        </>,
      );
    case "cookie":
      return svg(
        <>
          <circle cx="32" cy="34" r="22" fill="#c98f52" stroke="#8f5e2b" strokeWidth="2.5" />
          <path d="M16 26a18 18 0 0 1 14-10" fill="none" stroke="#e2b07a" strokeWidth="3" strokeLinecap="round" />
          {[[24, 28, 20], [38, 24, -30], [30, 40, 40], [43, 38, 10], [21, 42, -20]].map(([x, y, r], i) => <ellipse key={i} cx={x} cy={y} rx="4.2" ry="3.2" transform={`rotate(${r} ${x} ${y})`} fill="#4a2a1a" />)}
        </>,
      );
    case "marshmallow":
      return svg(
        <>
          <rect x="6" y="28" width="26" height="26" rx="10" fill="#ffffff" {...LINE} transform="rotate(-10 19 41)" />
          <rect x="30" y="20" width="26" height="26" rx="10" fill="#ffe0ea" {...LINE} transform="rotate(12 43 33)" />
          <path d="M12 36q5-5 11-3M36 28q5-4 11-1" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".9" />
        </>,
      );
    default:
      return null;
  }
}
