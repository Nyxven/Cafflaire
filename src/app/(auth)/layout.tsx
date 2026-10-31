import Logo from "@/components/Logo";
import Ring from "@/components/Ring";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden p-4">
      <Ring className="pointer-events-none absolute -left-24 -top-24 h-[28rem] w-[28rem] text-caramel/25" />
      <Ring className="pointer-events-none absolute -bottom-32 -right-24 h-[30rem] w-[30rem] rotate-180 text-matcha/25" />
      <div className="relative flex w-full max-w-md flex-col items-center gap-5"><Logo href="/" />{children}</div>
    </main>
  );
}
