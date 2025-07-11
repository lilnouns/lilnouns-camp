import { NextResponse } from "next/server";

// eslint-disable-next-line no-unused-vars
export function middleware(request) {
  const res = NextResponse.next();
  res.headers.set(
    "x-camp-build-id",
    process.env.WORKERS_CI_COMMIT_SHA?.slice(0, 7) ?? "dev",
  );
  return res;
}

export const config = {
  matcher: ["/:path*"],
};
