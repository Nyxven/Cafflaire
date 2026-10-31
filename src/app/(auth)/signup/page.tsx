import type { Metadata } from "next";
import AuthForm from "@/components/AuthForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sign up" };
export default function Page() { return <AuthForm mode="signup" google={!!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)} />; }
