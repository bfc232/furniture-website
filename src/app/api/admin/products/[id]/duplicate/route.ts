import { NextResponse, type NextRequest } from "next/server";
import { resolveAdvancePercent } from "@/lib/pricing";
import { getAdminSession } from "@/lib/auth/admin";
import { createServiceSupabase } from "@/lib/supabase/admin";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: productId } = await params;
  const supabase = createServiceSupabase();

  // Fetch original product and its images
  const { data: original, error: origErr } = await supabase
    .from("products")
    .select("*, product_images(*), product_variants(*)")
    .eq("id", productId)
    .single();

  if (origErr || !original) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const newSku = `${original.sku}-COPY`;
  const newSlug = `${original.slug}-copy-${Date.now().toString(36)}`;
  const newName = `${original.name} (Copy)`;

  const { data: newProd, error: insertErr } = await supabase
    .from("products")
    .insert({
      category_id: original.category_id,
      name: newName,
      slug: newSlug,
      sku: newSku,
      short_description: original.short_description,
      full_description: original.full_description,
      base_price_paise: original.base_price_paise,
      gst_percent: original.gst_percent,
      advance_percent: resolveAdvancePercent(original.advance_percent),
      material: original.material,
      dimensions: original.dimensions,
      colour: original.colour,
      video_url: original.video_url,
      is_featured: false,
      is_active: false, // Inactive draft by default
      min_units: original.min_units,
      booking_window_days: original.booking_window_days,
      delivery_estimate: original.delivery_estimate,
      display_order: original.display_order + 1,
      seo_title: `${newName} | ImportNow`,
      seo_description: original.seo_description,
    })
    .select()
    .single();

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  // Duplicate images
  const origImages = original.product_images ?? [];
  if (origImages.length > 0) {
    const newImages = origImages.map((img: { url: string; alt_text: string | null; is_primary: boolean; display_order: number }) => ({
      product_id: newProd.id,
      url: img.url,
      alt_text: img.alt_text,
      is_primary: img.is_primary,
      display_order: img.display_order,
    }));
    await supabase.from("product_images").insert(newImages);
  }

  const origVariants = original.product_variants ?? [];
  if (origVariants.length > 0) {
    await supabase.from("product_variants").insert(
      origVariants.map((variant: { name: string; value: string; is_active: boolean }) => ({
        product_id: newProd.id,
        name: variant.name,
        value: variant.value,
        is_active: variant.is_active,
      })),
    );
  }

  // Audit log
  await supabase.from("admin_audit_logs").insert({
    admin_id: session.admin.id,
    action: "duplicate_product",
    entity_type: "product",
    entity_id: newProd.id,
    metadata: { originalId: productId, newSku },
  });

  return NextResponse.json({ ok: true, product: newProd });
}
