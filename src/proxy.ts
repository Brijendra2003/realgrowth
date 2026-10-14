import { NextResponse, type NextRequest } from "next/server";

// Optimistic route guard: only checks that a session cookie exists.
// Real authorisation (role checks) happens on the server in each page and action.
const SIGNED_IN = [
  "/dashboard",
  "/list-project",
  "/my-projects",
  "/leads",
  "/my-enquiries",
  "/profile",
  "/notifications",
  "/saved",
  "/requirements",
  "/matching-buyers",
];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = request.cookies.has("rg_session");

  if (pathname.startsWith("/admin") && pathname !== "/admin/login" && !hasSession) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  if (SIGNED_IN.some((p) => pathname === p || pathname.startsWith(`${p}/`)) && !hasSession) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/list-project/:path*",
    "/my-projects/:path*",
    "/leads/:path*",
    "/my-enquiries/:path*",
    "/profile/:path*",
    "/notifications/:path*",
    "/saved/:path*",
    "/requirements/:path*",
    "/matching-buyers/:path*",
  ],
};
