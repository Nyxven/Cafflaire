"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const signup = mode === "signup";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const res = signup
      ? await authClient.signUp.email({ name: name.trim(), email, password })
      : await authClient.signIn.email({ email, password });
    setBusy(false);
    if (res.error) return setError(res.error.message || "Something went wrong. Please try again.");
    router.push("/welcome");
  }

  async function google() {
    setError("");
    const res = await authClient.signIn.social({ provider: "google", callbackURL: "/welcome" });
    if (res?.error) setError(res.error.message || "Google sign-in isn't set up yet.");
  }

  return (
    <div className="card w-full max-w-md">
      <h1 className="text-3xl font-bold">{signup ? "Create your account" : "Welcome back"}</h1>
      <p className="mt-1 text-sm opacity-70">{signup ? "Start building your perfect cup." : "Log in to keep brewing."}</p>
      <button type="button" onClick={google} className="btn-ghost mt-5 w-full">
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.7 2.5 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.6 17.7 9.5 24 9.5z" /><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" /><path fill="#FBBC05" d="M10.4 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.9-4.7l-7.8-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.8-6.1z" /><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.7-4.1-13.6-9.8l-7.8 6.1C6.5 42.6 14.6 48 24 48z" /></svg>
        Continue with Google
      </button>
      <div className="my-4 flex items-center gap-3 text-xs opacity-60"><hr className="flex-1" />or<hr className="flex-1" /></div>
      <form onSubmit={submit} className="space-y-3">
        {signup && (<label className="block text-sm font-semibold">Name<input className="input mt-1" required value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></label>)}
        <label className="block text-sm font-semibold">Email<input className="input mt-1" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></label>
        <label className="block text-sm font-semibold">Password<input className="input mt-1" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={signup ? "new-password" : "current-password"} /></label>
        {signup && <p className="text-xs opacity-60">At least 8 characters.</p>}
        <p role="alert" aria-live="polite" className="min-h-5 text-sm text-berry">{error}</p>
        <button className="btn-primary w-full" disabled={busy}>{busy ? "Please wait…" : signup ? "Sign up" : "Log in"}</button>
      </form>
      <p className="mt-4 text-center text-sm">
        {signup ? "Already have an account? " : "New here? "}
        <Link className="font-semibold text-caramel underline" href={signup ? "/login" : "/signup"}>{signup ? "Log in" : "Sign up"}</Link>
      </p>
    </div>
  );
}
