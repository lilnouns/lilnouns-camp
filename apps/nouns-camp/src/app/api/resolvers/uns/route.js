import { NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req) {
  const targetUrl = process.env.UNS_RESOLVER_URL;
  const apiKey = process.env.UNS_RESOLVER_API_KEY;

  if (!targetUrl || !apiKey) {
    return NextResponse.json(
      { error: "Missing target URL or API key" },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to proxy the request", details: error.message },
      { status: 500 }
    );
  }
}
