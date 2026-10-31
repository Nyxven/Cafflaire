import CartView from "@/components/CartView";

export const metadata = { title: "Basket" };
export default function Cart() { return (<><h1 className="mb-5 text-4xl font-bold">Your basket</h1><CartView /></>); }
