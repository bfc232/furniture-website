import { NextResponse, type NextRequest } from "next/server";
import { getAdminSession } from "@/lib/auth/admin";
import { createServiceSupabase } from "@/lib/supabase/admin";
import { parseAdvancePercent, rupeesToPaise } from "@/lib/pricing";

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    name,
    sku,
    category_id,
    base_price_rupees,
    gst_percent = 18,
    advance_percent = 10,
    min_units = 5,
    booking_window_days = 7,
    delivery_estimate = "30–40 days",
    material,
    dimensions,
    colour,
    short_description,
    full_description,
    video_url,
    is_featured = false,
    is_active = true,
    display_order = 0,
    seo_title,
    seo_description,
    images = [],
    variants = [],
  } = body;

  if (!name || !sku || !category_id || !base_price_rupees) {
    return NextResponse.json(
      { error: "Name, SKU, category, and base price are required." },
      { status: 400 }
    );
  }

  const basePricePaise = rupeesToPaise(Number(base_price_rupees));
  if (basePricePaise <= 0) {
    return NextResponse.json(
      { error: "Base price must be greater than zero." },
      { status: 400 }
    );
  }

  let advancePercent = 10;
  try {
    advancePercent = parseAdvancePercent(advance_percent);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid advance percentage." },
      { status: 400 },
    );
  }

  // Generate URL slug from name
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const supabase = createServiceSupabase();

  // Insert product
  const { data: product, error: prodErr } = await supabase
    .from("products")
    .insert({
      name: name.trim(),
      slug: `${slug}-${sku.toLowerCase().trim()}`,
      sku: sku.trim().toUpperCase(),
      category_id,
      base_price_paise: basePricePaise,
      gst_percent: Number(gst_percent) || 18,
      advance_percent: advancePercent,
      min_units: Number(min_units) || 5,
      booking_window_days: Number(booking_window_days) || 7,
      delivery_estimate: delivery_estimate.trim() || "30–40 days",
      material: material?.trim() || null,
      dimensions: dimensions?.trim() || null,
      colour: colour?.trim() || null,
      short_description: short_description?.trim() || null,
      full_description: full_description?.trim() || null,
      video_url: video_url?.trim() || null,
      is_featured: Boolean(is_featured),
      is_active: Boolean(is_active),
      display_order: Number(display_order) || 0,
      seo_title: seo_title?.trim() || `${name.trim()} | ImportNow`,
      seo_description:
        seo_description?.trim() ||
        short_description?.trim() ||
        `Imported ${name.trim()} at factory prices.`,
    })
    .select()
    .single();

  if (prodErr) {
    return NextResponse.json({ error: prodErr.message }, { status: 500 });
  }

  // Insert images if provided
  if (Array.isArray(images) && images.length > 0) {
    type ImageInput = { url?: string; alt_text?: string };
    const imageRows = (images as ImageInput[])
      .filter((img): img is ImageInput & { url: string } => typeof img?.url === "string" && img.url.trim().length > 0)
      .map((img, index) => ({
        product_id: product.id,
        url: img.url.trim(),
        alt_text: img.alt_text?.trim() || `${name} image ${index + 1}`,
        is_primary: index === 0,
        display_order: index + 1,
      }));

    if (imageRows.length > 0) {
      await supabase.from("product_images").insert(imageRows);
    }
  }

  if (Array.isArray(variants) && variants.length > 0) {
    type VariantInput = { name?: string; value?: string };
    const variantRows = (variants as VariantInput[])
      .filter((v) => typeof v?.value === "string" && v.value.trim().length > 0)
      .map((v) => ({
        product_id: product.id,
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
    action: "create_product",
    entity_type: "product",
    entity_id: product.id,
    metadata: { name: product.name, sku: product.sku },
  });

  return NextResponse.json({ ok: true, product });
}
