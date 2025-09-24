import { NextResponse } from "next/server";

const BUILD_ID = process.env.BUILD_ID;

export function middleware(request) {
  const { nextUrl } = request;
  const { pathname } = nextUrl;

  // Rewrite /topics/:path* to /candidates/:path*
  let response;
  if (pathname === "/topics" || pathname.startsWith("/topics/")) {
    const url = nextUrl.clone();
    url.pathname = pathname.replace(/^\/topics(\/|$)/, "/candidates$1");
    response = NextResponse.rewrite(url);
  } else {
    response = NextResponse.next();
  }

  response.headers.set("x-camp-build-id", BUILD_ID);
  return response;
}

export const config = {
  matcher: ["/:path*"],
};
