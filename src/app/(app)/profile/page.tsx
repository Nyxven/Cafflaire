import { SignOutButton } from "@/components/Misc";
import { getSession } from "@/lib/session";

export const metadata = { title: "Profile" };
export default async function Profile() {
  const s = (await getSession())!;
  return (
    <div className="max-w-md">
      <h1 className="mb-5 text-4xl font-bold">Profile</h1>
      <div className="card space-y-3">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-caramel text-2xl font-bold text-white">{s.user.name[0]?.toUpperCase()}</div>
        <div><div className="text-xs opacity-60">Name</div><div className="font-semibold">{s.user.name}</div></div>
        <div><div className="text-xs opacity-60">Email</div><div className="font-semibold">{s.user.email}</div></div>
        <SignOutButton />
      </div>
    </div>
  );
}
