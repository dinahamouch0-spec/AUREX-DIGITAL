"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Loader2, AlertCircle } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.status === 429) {
        setError("Too many attempts. Please try again later.");
      } else if (!res.ok) {
        setError("Incorrect email or password.");
      } else {
        router.push("/admin");
        router.refresh();
        return;
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-brand-line bg-white p-8 shadow-[var(--shadow-card)]">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand-pink to-brand-purple text-white">
            <BookOpen className="h-6 w-6" aria-hidden="true" />
          </span>
          <h1 className="text-xl font-bold text-brand-navy">Ya 7kayti Admin</h1>
          <p className="text-sm text-brand-navy-soft">Sign in to manage your store</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-semibold text-brand-navy">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="min-h-11 rounded-xl border border-brand-line bg-white px-4 py-2.5 text-base text-brand-navy focus-visible:border-brand-pink"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-semibold text-brand-navy">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="min-h-11 rounded-xl border border-brand-line bg-white px-4 py-2.5 text-base text-brand-navy focus-visible:border-brand-pink"
            />
          </div>

          {error && (
            <p role="alert" className="flex items-center gap-1.5 text-sm font-semibold text-brand-pink-deep">
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex min-h-11 items-center justify-center gap-2 rounded-full bg-brand-pink px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-pink-deep disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
