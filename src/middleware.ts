import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const { pathname } = request.nextUrl;

  // Allow access to auth pages when not authenticated
  if (pathname.startsWith("/auth/") || pathname === "/request-account") {
    if (token) {
      // Redirect authenticated users away from auth pages
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Protect admin routes
  if (pathname.startsWith("/admin")) {
    if (!token) {
      return NextResponse.redirect(new URL("/auth/signin", request.url));
    }

    if (token.role !== "ORG_ADMIN") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    if (token.state === "PENDING" && pathname !== "/onboarding/admin") {
      return NextResponse.redirect(new URL("/onboarding/admin", request.url));
    }

    return NextResponse.next();
  }

  // Protect onboarding routes
  if (pathname.startsWith("/onboarding")) {
    if (!token) {
      return NextResponse.redirect(new URL("/auth/signin", request.url));
    }

    if (token.state !== "PENDING") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    if (pathname === "/onboarding/admin" && token.role !== "ORG_ADMIN") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    if (pathname === "/onboarding/faculty" && token.role !== "DEPT_COORD") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  }

  // Redirect users based on their state
  if (token) {
    if (token.state === "PENDING") {
      if (token.role === "ORG_ADMIN") {
        return NextResponse.redirect(new URL("/onboarding/admin", request.url));
      } else if (token.role === "DEPT_COORD") {
        return NextResponse.redirect(
          new URL("/onboarding/faculty", request.url),
        );
      } else {
        return NextResponse.redirect(new URL("/pending-approval", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/onboarding/:path*",
    "/auth/:path*",
    "/request-account",
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
