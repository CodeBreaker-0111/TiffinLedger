"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState(mode === "login" ? "owner@tiffin.local" : "");
  const [password, setPassword] = useState(mode === "login" ? "demo1234" : "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const body = mode === "login" ? { email, password } : { name, email, password };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Something went wrong.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="auth">
      <div className="card auth-card">
        <Link href="/" className="logo">TiffinLedger</Link>
        <h1 style={{fontSize: 36, marginTop: 22}}>{mode === "login" ? "Owner login" : "Create your account"}</h1>
        <p className="muted">{mode === "login" ? "Open your tiffin billing dashboard." : "Start managing subscriptions and bills."}</p>
        <form className="form" onSubmit={submit}>
          {mode === "register" && <><label>Name</label><input value={name} onChange={e => setName(e.target.value)} required /></>}
          <label>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          <label>Password</label><input type="password" minLength={6} value={password} onChange={e => setPassword(e.target.value)} required />
          {error && <div className="error">{error}</div>}
          <button className="btn btn-primary" disabled={loading}>{loading ? "Please wait…" : mode === "login" ? "Login" : "Register"}</button>
        </form>
        <p className="muted" style={{marginTop: 18, fontSize: 13}}>
          {mode === "login" ? <>New owner? <Link href="/register"><u>Create an account</u></Link></> : <>Already registered? <Link href="/login"><u>Login</u></Link></>}
        </p>
      </div>
    </main>
  );
}
