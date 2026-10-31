import Builder from "@/components/Builder";

export const metadata = { title: "Build My Coffee" };
export default async function Build({ searchParams }: { searchParams: Promise<{ preset?: string }> }) {
  const { preset } = await searchParams;
  return (<><h1 className="mb-4 text-4xl font-bold">Build my coffee</h1><Builder preset={preset} /></>);
}
