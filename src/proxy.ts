import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareSupabase } from "@/lib/supabase/middleware";

function redirectWithSession(
  request: NextRequest,
  sessionResponse: NextResponse,
  pathname: string,
  search: Record<string, string> = {},
) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  for (const [key, value] of Object.entries(search)) {
    url.searchParams.set(key, value);
  }
  const redirectResponse = NextResponse.redirect(url);
  sessionResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });
  return redirectResponse;
}

function safeAdminPath(next: string | null) {
  if (
    !next ||
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

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { supabase, response } = createMiddlewareSupabase(request);

  if (pathname === "/admin/login") {
    if (supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: admin } = await supabase
          .from("admins")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();
        if (admin) {
          return redirectWithSession(
            request,
            response,
            safeAdminPath(request.nextUrl.searchParams.get("next")),
          );
        }
      }
    }
    return response;
  }

  if (pathname.startsWith("/admin")) {
    if (!supabase) {
      return redirectWithSession(request, response, "/admin/login");
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return redirectWithSession(request, response, "/admin/login", {
        next: pathname,
      });
    }
    const { data: admin } = await supabase
      .from("admins")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!admin) {
      await supabase.auth.signOut();
      return redirectWithSession(request, response, "/admin/login", {
        error: "unauthorized",
      });
    }
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
