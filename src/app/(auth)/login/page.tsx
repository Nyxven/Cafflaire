import type { Metadata } from "next";
import AuthForm from "@/components/AuthForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Log in" };
export default function Page() { return <AuthForm mode="login" google={!!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)} />; }
