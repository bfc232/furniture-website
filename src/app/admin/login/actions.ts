"use server";

import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/env";

export type LoginState = { error: string | null };

function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "";
  if (
    !next.startsWith("/admin") ||
    next.startsWith("//") ||
    next.startsWith("/admin/login") ||
    next.includes("://") ||
    next.includes("\\") ||
    next.includes("?")
  ) {
    return "/admin";
  }
  return next;
}

export async function adminLogin(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { error: "Enter your admin email and password." };
  }

  if (!hasSupabaseConfig()) {
    return { error: "Supabase environment variables are missing." };
  }

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  if (!data.user) {
    return { error: "Unable to sign in." };
  }

  const { data: adminRecord, error: adminError } = await supabase
    .from("admins")
    .select("id")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (adminError) {
    await supabase.auth.signOut();
    const missingTable = /schema cache|does not exist|PGRST205/i.test(adminError.message);
    return {
      error: missingTable
        ? "The admins table is not in the database yet. Run the SQL migrations in Supabase, add this user to admins, then sign in again."
        : "Signed in, but admin access could not be verified. Try again.",
    };
  }

  if (!adminRecord) {
    await supabase.auth.signOut();
    return {
      error:
        "This account is not an administrator. In Supabase, add this user to the admins table, then sign in again.",
    };
  }

  redirect(safeNext(formData.get("next")));
}
