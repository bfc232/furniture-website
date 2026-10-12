import { NextResponse, type NextRequest } from "next/server";
import { getAdminSession } from "@/lib/auth/admin";
import { createServiceSupabase } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, slug, description, display_order = 0, is_active = true } = body;

  if (!name || !slug) {
    return NextResponse.json(
      { error: "Category name and slug are required." },
      { status: 400 }
    );
  }

  const supabase = createServiceSupabase();

  const { data, error } = await supabase
    .from("categories")
    .insert({
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      description: description?.trim() || null,
      display_order: Number(display_order) || 0,
      is_active: Boolean(is_active),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Audit log
  await supabase.from("admin_audit_logs").insert({
    admin_id: session.admin.id,
    action: "create_category",
    entity_type: "category",
    entity_id: data.id,
    metadata: { name, slug },
  });

  return NextResponse.json({ ok: true, category: data });
}

export async function PATCH(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, name, slug, description, display_order, is_active } = body;

  if (!id) {
    return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
  }

  const supabase = createServiceSupabase();

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (name !== undefined) updates.name = name.trim();
  if (slug !== undefined) updates.slug = slug.trim().toLowerCase();
  if (description !== undefined) updates.description = description?.trim() || null;
  if (display_order !== undefined) updates.display_order = Number(display_order);
  if (is_active !== undefined) updates.is_active = Boolean(is_active);

  const { data, error } = await supabase
    .from("categories")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Audit log
  await supabase.from("admin_audit_logs").insert({
    admin_id: session.admin.id,
    action: "update_category",
    entity_type: "category",
    entity_id: id,
    metadata: updates,
  });

  return NextResponse.json({ ok: true, category: data });
}
