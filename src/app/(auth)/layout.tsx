import Logo from "@/components/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-gradient-to-b from-milk to-cream p-4">
      <div className="flex w-full max-w-md flex-col items-center gap-4"><Logo href="/" />{children}</div>
    </main>
  );
}
