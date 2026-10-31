import MenuGrid from "@/components/MenuGrid";

export const metadata = { title: "Menu" };
export default function Menu() {
  return (<><h1 className="text-4xl font-bold">Menu</h1><p className="mb-6 mt-1 opacity-70">Order as-is, or tap Customize to make it yours. More drinks coming soon.</p><MenuGrid /></>);
}
