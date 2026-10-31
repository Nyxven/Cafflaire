"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";

type View = "login" | "signup" | "verify" | "forgot" | "reset";

export default function AuthForm({ mode }: { mode: "login" | "signup" | "forgot" }) {
  const router = useRouter();
  const [view, setView] = useState<View>(mode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const fail = (e: { message?: string; status?: number } | null | undefined, fallback = "Something went wrong. Please try again.") => {
    setError((e?.status ?? 0) >= 500 ? "Server setup problem. The site owner should open /api/health to see what is missing." : e?.message || fallback);
  };

  async function sendCode(type: "email-verification" | "forget-password") {
    const res = type === "forget-password"
      ? await authClient.emailOtp.requestPasswordReset({ email })
      : await authClient.emailOtp.sendVerificationOtp({ email, type });
    if (res.error) { fail(res.error, "Couldn't send the code. Please wait a minute and try again."); return false; }
    setCooldown(30);
    return true;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setInfo(""); setBusy(true);
    try {
      if (view === "signup") {
        const res = await authClient.signUp.email({ name: name.trim(), email, password });
        if (res.error) return fail(res.error);
        setCooldown(30); setCode(""); setView("verify"); setInfo(`We emailed a 6-digit code to ${email}.`);
      } else if (view === "login") {
        const res = await authClient.signIn.email({ email, password });
        if (res.error) {
          if (res.error.code === "EMAIL_NOT_VERIFIED") {
            if (await sendCode("email-verification")) { setCode(""); setView("verify"); setInfo(`Please verify your email first. We sent a code to ${email}.`); }
            return;
          }
          return fail(res.error, "Incorrect email or password.");
        }
        router.push("/welcome");
      } else if (view === "verify") {
        const res = await authClient.emailOtp.verifyEmail({ email, otp: code.trim() });
        if (res.error) return fail(res.error, "That code isn't right or has expired.");
        const login = await authClient.signIn.email({ email, password });
        if (login.error) { setView("login"); setInfo("Email verified! Please log in."); return; }
        router.push("/welcome");
      } else if (view === "forgot") {
        if (await sendCode("forget-password")) { setCode(""); setPassword(""); setView("reset"); setInfo(`If ${email} has an account, a reset code is on its way.`); }
      } else if (view === "reset") {
        const res = await authClient.emailOtp.resetPassword({ email, otp: code.trim(), password });
        if (res.error) return fail(res.error, "That code isn't right or has expired.");
        setPassword(""); setCode(""); setView("login"); setInfo("Password updated. Please log in.");
      }
    } finally { setBusy(false); }
  }

  async function resend() {
    setError(""); setBusy(true);
    const ok = await sendCode(view === "reset" ? "forget-password" : "email-verification");
    setBusy(false);
    if (ok) setInfo("A new code is on its way. Older codes no longer work.");
  }

  const title = { login: "Welcome back", signup: "Create your account", verify: "Check your email", forgot: "Forgot password?", reset: "Set a new password" }[view];
  const sub = { login: "Log in to keep brewing.", signup: "Start building your perfect cup.", verify: "Enter the 6-digit code we sent you.", forgot: "We'll email you a reset code.", reset: "Enter the code and choose a new password." }[view];
  const needsCode = view === "verify" || view === "reset";
  const needsPassword = view === "login" || view === "signup" || view === "reset";

  return (
    <div className="card w-full max-w-md">
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="mt-1 text-sm opacity-70">{sub}</p>
      <form onSubmit={submit} className="mt-5 space-y-3">
        {view === "signup" && (<label className="block text-sm font-semibold">Name<input className="input mt-1" required maxLength={60} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></label>)}
        <label className="block text-sm font-semibold">Email<input className="input mt-1" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" readOnly={needsCode} /></label>
        {needsCode && (<label className="block text-sm font-semibold">6-digit code<input className="input mt-1 text-center text-2xl tracking-[0.5em]" required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} /></label>)}
        {needsPassword && (<label className="block text-sm font-semibold">{view === "reset" ? "New password" : "Password"}<input className="input mt-1" type="password" required minLength={view === "login" ? 1 : 10} maxLength={128} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={view === "login" ? "current-password" : "new-password"} /></label>)}
        {(view === "signup" || view === "reset") && <p className="text-xs opacity-60">At least 10 characters.</p>}
        <p role="status" aria-live="polite" className="min-h-5 text-sm text-matcha">{info}</p>
        <p role="alert" aria-live="assertive" className="min-h-5 text-sm text-berry">{error}</p>
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? "Please wait…" : { login: "Log in", signup: "Sign up", verify: "Verify & continue", forgot: "Send reset code", reset: "Update password" }[view]}
        </button>
      </form>
      {needsCode && (
        <button type="button" className="mt-3 w-full text-sm underline disabled:no-underline disabled:opacity-60" disabled={busy || cooldown > 0} onClick={resend}>
          {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
        </button>
      )}
      <div className="mt-4 space-y-1 text-center text-sm">
        {view === "login" && (<><p><Link className="underline" href="/forgot-password">Forgot password?</Link></p><p>New here? <Link className="font-semibold text-caramel underline" href="/signup">Sign up</Link></p></>)}
        {view === "signup" && <p>Already have an account? <Link className="font-semibold text-caramel underline" href="/login">Log in</Link></p>}
        {(view === "forgot" || view === "reset" || view === "verify") && <p><Link className="font-semibold text-caramel underline" href="/login">Back to log in</Link></p>}
      </div>
    </div>
  );
}
