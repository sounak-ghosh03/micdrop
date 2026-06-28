// client/middleware.ts
// Next.js edge middleware — protects all /admin/* routes.
// Redirects unauthenticated users to /admin/login.
// The /admin/login page itself is always accessible.
import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
   const { pathname } = request.nextUrl;

   // Allow the login page itself — no token needed
   if (pathname === "/admin/login") {
      return NextResponse.next();
   }

   // Protect everything under /admin
   if (pathname.startsWith("/admin")) {
      // The admin token is stored in localStorage (client-side only).
      // Edge middleware cannot read localStorage, so we rely on a cookie
      // as a lightweight presence indicator. The real verification still
      // happens server-side via adminAuthMiddleware on every API call.
      const adminToken = request.cookies.get("adminTokenPresent")?.value;

      if (!adminToken) {
         const loginUrl = new URL("/admin/login", request.url);
         loginUrl.searchParams.set("redirect", pathname);
         return NextResponse.redirect(loginUrl);
      }
   }

   return NextResponse.next();
}

export const config = {
   matcher: ["/admin/:path*"],
};
