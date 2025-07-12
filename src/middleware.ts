import { auth } from "@/server/auth";
import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow access to auth pages and API routes
  if (
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/public") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Get session
  const session = await auth();

  // If no session, redirect to sign in
  if (!session) {
    return NextResponse.redirect(new URL("/auth/signin", request.url));
  }

  // Allow access to pending page
  if (pathname === "/pending") {
    return NextResponse.next();
  }

  // If user is pending or suspended, redirect to pending page
  if (session.user.state !== "ACTIVE" && pathname !== "/pending") {
    return NextResponse.redirect(new URL("/pending", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
