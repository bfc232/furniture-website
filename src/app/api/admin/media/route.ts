import { NextResponse, type NextRequest } from "next/server";
import { getAdminSession } from "@/lib/auth/admin";
import { createServiceSupabase } from "@/lib/supabase/admin";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);

function extensionFor(type: string, name: string) {
  if (type === "image/jpeg") return "jpg";
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "image/gif") return "gif";
  if (type === "image/avif") return "avif";
  const fromName = name.split(".").pop()?.toLowerCase();
  return fromName && fromName.length <= 5 ? fromName : "jpg";
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose a photo to upload." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image must be under 8 MB." }, { status: 400 });
  }
  if (file.type && !ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "Use a JPG, PNG, WebP, or GIF image." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = extensionFor(file.type, file.name);
  const path = `${session.admin.id}/${crypto.randomUUID()}.${ext}`;
  const supabase = createServiceSupabase();
  const { error } = await supabase.storage.from("product-media").upload(path, buffer, {
    contentType: file.type || "image/jpeg",
    upsert: false,
  });

  if (error) {
    return NextResponse.json(
      { error: "Unable to upload image. Confirm the product-media storage bucket exists." },
      { status: 500 },
    );
  }

  const { data } = supabase.storage.from("product-media").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
