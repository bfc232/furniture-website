import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";

import { hasSupabaseConfig } from "@/lib/supabase/admin";

export async function getAdminSession() {
  if (!hasSupabaseConfig()) return null;
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: admin } = await supabase
      .from("admins")
      .select("id, user_id, email, display_name")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!admin) return null;
    return { user, admin };
  } catch {
    return null;
  }
}

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }
  return session;
}
