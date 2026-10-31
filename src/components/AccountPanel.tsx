"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function AccountPanel() {
  const router = useRouter();
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [del, setDel] = useState(false);
  const [delPw, setDelPw] = useState("");

  async function changePw(e: React.FormEvent) {
    e.preventDefault(); setMsg(""); setErr("");
    const res = await authClient.changePassword({ currentPassword: cur, newPassword: next, revokeOtherSessions: true });
    if (res.error) return setErr(res.error.message || "Couldn't change your password.");
    setCur(""); setNext(""); setMsg("Password changed. Other devices were signed out.");
  }
  async function signOutAll() {
    await authClient.revokeSessions();
    router.push("/"); router.refresh();
  }
  async function remove(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    const res = await authClient.deleteUser({ password: delPw });
    if (res.error) return setErr(res.error.message || "Couldn't delete the account.");
    router.push("/"); router.refresh();
  }

  return (
    <div className="mt-6 space-y-6">
      <form onSubmit={changePw} className="card space-y-3">
        <h2 className="text-xl font-bold">Change password</h2>
        <label className="block text-sm font-semibold">Current password<input className="input mt-1" type="password" required value={cur} onChange={(e) => setCur(e.target.value)} autoComplete="current-password" /></label>
        <label className="block text-sm font-semibold">New password (10+ characters)<input className="input mt-1" type="password" required minLength={10} maxLength={128} value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" /></label>
        <p role="status" className="min-h-5 text-sm text-matcha">{msg}</p>
        <button className="btn-primary">Update password</button>
      </form>
      <div className="card space-y-3">
        <h2 className="text-xl font-bold">Devices</h2>
        <p className="text-sm opacity-70">Sign out everywhere, including this device.</p>
        <button className="btn-ghost" onClick={signOutAll}>Sign out of all devices</button>
      </div>
      <div className="card space-y-3 border border-berry/30">
        <h2 className="text-xl font-bold text-berry">Delete account</h2>
        <p className="text-sm opacity-70">Permanently deletes your account, sessions and order history. This can&apos;t be undone.</p>
        {!del ? <button className="btn-ghost" onClick={() => setDel(true)}>Delete my account…</button> : (
          <form onSubmit={remove} className="space-y-3">
            <label className="block text-sm font-semibold">Confirm with your password<input className="input mt-1" type="password" required value={delPw} onChange={(e) => setDelPw(e.target.value)} autoComplete="current-password" /></label>
            <p role="alert" className="min-h-5 text-sm text-berry">{err}</p>
            <div className="flex gap-2"><button className="btn bg-berry text-white">Delete forever</button><button type="button" className="btn-ghost" onClick={() => setDel(false)}>Cancel</button></div>
          </form>
        )}
      </div>
      {err && !del && <p role="alert" className="text-sm text-berry">{err}</p>}
    </div>
  );
}
