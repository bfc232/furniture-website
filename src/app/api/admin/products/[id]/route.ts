import { NextResponse, type NextRequest } from "next/server";
import { getAdminSession } from "@/lib/auth/admin";
import { createServiceSupabase } from "@/lib/supabase/admin";
import { parseAdvancePercent, rupeesToPaise } from "@/lib/pricing";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: productId } = await params;
  const body = await request.json();
  const supabase = createServiceSupabase();

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body.name !== undefined) updates.name = body.name.trim();
  if (body.sku !== undefined) updates.sku = body.sku.trim().toUpperCase();
  if (body.category_id !== undefined) updates.category_id = body.category_id;
  if (body.base_price_rupees !== undefined) {
    updates.base_price_paise = rupeesToPaise(Number(body.base_price_rupees));
  }
  if (body.gst_percent !== undefined) updates.gst_percent = Number(body.gst_percent);
  if (body.advance_percent !== undefined) {
    try {
      updates.advance_percent = parseAdvancePercent(body.advance_percent);
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Invalid advance percentage." },
        { status: 400 },
      );
    }
  }
  if (body.min_units !== undefined) updates.min_units = Number(body.min_units);
  if (body.booking_window_days !== undefined) updates.booking_window_days = Number(body.booking_window_days);
  if (body.delivery_estimate !== undefined) updates.delivery_estimate = body.delivery_estimate.trim();
  if (body.material !== undefined) updates.material = body.material?.trim() || null;
  if (body.dimensions !== undefined) updates.dimensions = body.dimensions?.trim() || null;
  if (body.colour !== undefined) updates.colour = body.colour?.trim() || null;
  if (body.short_description !== undefined) updates.short_description = body.short_description?.trim() || null;
  if (body.full_description !== undefined) updates.full_description = body.full_description?.trim() || null;
  if (body.video_url !== undefined) updates.video_url = body.video_url?.trim() || null;
  if (body.is_featured !== undefined) updates.is_featured = Boolean(body.is_featured);
  if (body.is_active !== undefined) updates.is_active = Boolean(body.is_active);
  if (body.display_order !== undefined) updates.display_order = Number(body.display_order);
  if (body.seo_title !== undefined) updates.seo_title = body.seo_title?.trim() || null;
  if (body.seo_description !== undefined) updates.seo_description = body.seo_description?.trim() || null;

  const { data: product, error } = await supabase
    .from("products")
    .update(updates)
    .eq("id", productId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Handle images update if provided
  if (Array.isArray(body.images)) {
    // Delete existing images and reinsert
    await supabase.from("product_images").delete().eq("product_id", productId);
    type ImageInput = { url?: string; alt_text?: string };
    const validImages = (body.images as ImageInput[])
      .filter((img): img is ImageInput & { url: string } => typeof img?.url === "string" && img.url.trim().length > 0)
      .map((img, index) => ({
        product_id: productId,
        url: img.url.trim(),
        alt_text: img.alt_text?.trim() || `${product.name} image ${index + 1}`,
        is_primary: index === 0,
        display_order: index + 1,
      }));

    if (validImages.length > 0) {
      await supabase.from("product_images").insert(validImages);
    }
  }

  if (Array.isArray(body.variants)) {
    await supabase.from("product_variants").delete().eq("product_id", productId);
    type VariantInput = { name?: string; value?: string };
    const variantRows = (body.variants as VariantInput[])
      .filter((v) => typeof v?.value === "string" && v.value.trim().length > 0)
      .map((v) => ({
        product_id: productId,
        name: v.name?.trim() || "Colour",
        value: v.value!.trim(),
        is_active: true,
      }));
    if (variantRows.length > 0) {
      await supabase.from("product_variants").insert(variantRows);
    }
  }

  // Audit log
  await supabase.from("admin_audit_logs").insert({
    admin_id: session.admin.id,
    action: "update_product",
    entity_type: "product",
    entity_id: productId,
    metadata: updates,
  });

  return NextResponse.json({ ok: true, product });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: productId } = await params;
  const supabase = createServiceSupabase();

  const { error } = await supabase.from("products").delete().eq("id", productId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from("admin_audit_logs").insert({
    admin_id: session.admin.id,
    action: "delete_product",
    entity_type: "product",
    entity_id: productId,
  });

  return NextResponse.json({ ok: true });
}
