"use client";

import { useActionState, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { BrandMark } from "@/components/layout/BrandMark";
import { hasSupabaseConfig } from "@/lib/supabase/env";
import { adminLogin, type LoginState } from "./actions";

function loginErrorFromUrl(value: string | null) {
  if (!value) return null;
  if (value === "unauthorized") {
    return "You do not have administrative privileges.";
  }
  return value;
}

function AdminLoginForm({ supabaseReady }: { supabaseReady: boolean }) {
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || "/admin";
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    adminLogin,
    { error: loginErrorFromUrl(searchParams.get("error")) },
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="w-full max-w-sm rounded-3xl border border-line bg-card p-7 shadow-sm">
      <div className="text-center">
        <BrandMark className="justify-center" />
        <h1 className="mt-4 font-serif text-2xl font-bold">Admin Portal</h1>
        <p className="mt-1 text-xs text-muted">
          Sign in with your authorized admin credentials
        </p>
      </div>

      {state.error ? (
        <div role="alert" className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-800">
          {state.error}
        </div>
      ) : null}

      <form action={formAction} className="mt-6 space-y-4">
        <input type="hidden" name="next" value={nextUrl.startsWith("/admin") ? nextUrl : "/admin"} />
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted" htmlFor="admin-email">
            Admin Email
          </label>
          <input
            id="admin-email"
            name="email"
            type="email"
            required
            autoComplete="username"
            placeholder="admin@importnow.in"
            className="field text-sm"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted" htmlFor="admin-password">
            Password
          </label>
          <input
            id="admin-password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••••••"
            className="field text-sm"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={pending || !supabaseReady}
          className="btn btn-primary mt-2 w-full py-3 text-sm disabled:opacity-50"
        >
          {pending ? "Authenticating..." : "Sign In to Admin"}
        </button>
      </form>

      <div className="mt-6 border-t border-line/60 pt-4 text-center">
        <p className="text-[11px] text-muted">
          Restricted area. No public registration.
        </p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  const supabaseReady = hasSupabaseConfig();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f5f7fb] p-4 text-ink">
      {!supabaseReady ? (
        <div className="mb-4 w-full max-w-sm rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
          Supabase is not configured. Copy <code className="font-mono">.env.example</code> to{" "}
          <code className="font-mono">.env.local</code>, add your project keys, run the SQL migrations, then create an
          admin user.
        </div>
      ) : null}
      <Suspense fallback={<div className="text-sm text-muted">Loading admin portal...</div>}>
        <AdminLoginForm supabaseReady={supabaseReady} />
      </Suspense>
    </div>
  );
}
