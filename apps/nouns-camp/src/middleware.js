import { NextResponse } from "next/server";

const BUILD_ID = process.env.BUILD_ID;

// eslint-disable-next-line no-unused-vars
export function middleware(request) {
  const res = NextResponse.next();
  res.headers.set("x-camp-build-id", BUILD_ID);

  return res;
}

export const config = {
  matcher: ["/:path*"],
};
