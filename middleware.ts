import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // DEBUG: confirma que o middleware está rodando sem erros
  console.log("[MW] pathname:", pathname);
  console.log("[MW] cookies:", req.cookies.getAll().map((c) => c.name));

  const token =
    req.cookies.get("__Secure-authjs.session-token") ??
    req.cookies.get("authjs.session-token");

  const isLoggedIn = !!token;

  console.log("[MW] isLoggedIn:", isLoggedIn);

  const isPublic =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/api/auth");

  if (!isLoggedIn && !isPublic) {
    console.log("[MW] redirect -> /login");
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isLoggedIn && (pathname === "/login" || pathname === "/register")) {
    console.log("[MW] redirect -> /");
    return NextResponse.redirect(new URL("/", req.url));
  }

  console.log("[MW] next()");
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|manifest).*)"],
};
