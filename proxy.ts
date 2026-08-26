import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only protect /dashboard routes — prevent redirect loops
  // /login, /register, and / are never redirected by middleware
  if (!pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    // Unauthenticated → redirect to login with callbackUrl
    // Avoid loop: /login is not under /dashboard, so this is safe
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = (token as { role?: string }).role;

  if (role !== "ADMIN") {
    // Authenticated but not admin → redirect to storefront
    // Avoid loop: / is not under /dashboard, so this is safe
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
