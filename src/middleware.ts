import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req });
  // If no token, redirect to login for protected routes
  if (!token) {
    if (
      req.nextUrl.pathname.startsWith("/publisher")  ||
      req.nextUrl.pathname.startsWith("/admin")
    ) {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }
    // If route isn't protected, allow
    return NextResponse.next();
  }

  const isPublisher = token.role === "publisher";
  const isAdmin = token.role === "admin";

  // Protect /publisher/* for publisher role only
  if (req.nextUrl.pathname.startsWith("/publisher") && !isPublisher) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  // Protect /admin/dashboard for admin role only
  if (req.nextUrl.pathname.startsWith("/admin") && !isAdmin) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  // Protect root "/" - allow only if admin or publisher (adjust as needed)
  if (!isAdmin && !isPublisher) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/publisher/:path*",
    "/admin/:path*",
  ],
};
