import type { Metadata } from "next";
import Truck from "@/components/Truck";

export const metadata: Metadata = { title: "Welcome" };
export default function Page() { return <Truck />; }
