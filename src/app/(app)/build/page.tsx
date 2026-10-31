import Builder from "@/components/Builder";
import SoundToggle from "@/components/SoundToggle";

export const metadata = { title: "Build My Coffee" };
export default async function Build({ searchParams }: { searchParams: Promise<{ preset?: string }> }) {
  const { preset } = await searchParams;
  return (<><div className="mb-4 flex items-center justify-between"><h1 className="text-4xl font-bold">Build my coffee</h1><SoundToggle /></div><Builder preset={preset} /></>);
}
