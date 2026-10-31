import ProfileTabs from "@/components/ProfileTabs";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-4xl font-bold sm:text-5xl">Your account</h1>
      <ProfileTabs />
      {children}
    </div>
  );
}
