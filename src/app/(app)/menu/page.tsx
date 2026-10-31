import MenuGrid from "@/components/MenuGrid";

export const metadata = { title: "Menu" };
export default function Menu() {
  return (
    <>
      <h1 className="text-4xl font-bold sm:text-5xl">The menu</h1>
      <p className="mb-6 mt-2 max-w-xl text-lg opacity-75">Order a drink as it comes, or tap Customize to make it yours. More drinks are coming soon.</p>
      <MenuGrid />
    </>
  );
}
