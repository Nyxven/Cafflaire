import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import { getSession, isAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  return (
    <>
      <Navbar user={{ name: session.user.name, email: session.user.email }} admin={isAdmin(session.user.email)} />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">{children}</main>
    </>
  );
}
