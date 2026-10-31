import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative grid min-h-dvh place-items-center bg-gradient-to-b from-milk to-cream p-4">
      <div className="absolute right-3 top-3"><ThemeToggle /></div>
      <div className="flex w-full max-w-md flex-col items-center gap-4"><Logo href="/" />{children}</div>
    </main>
  );
}
