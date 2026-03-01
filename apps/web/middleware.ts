import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { LANG_COOKIE } from "@/i18n/lang";

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);

  if (!request.cookies.get(LANG_COOKIE)?.value) {
    response.cookies.set(LANG_COOKIE, "sv", { path: "/", sameSite: "lax" });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
