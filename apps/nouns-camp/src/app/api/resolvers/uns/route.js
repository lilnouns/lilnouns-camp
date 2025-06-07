import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { CHAIN_ID } from "@/constants/env";

// export const runtime = "edge";

export async function POST(req) {
  const {
    env: { UNS_RESOLVER_URL, UNS_RESOLVER_API_KEY, CACHE },
  } = getCloudflareContext();
  const targetUrl = UNS_RESOLVER_URL;
  const apiKey = UNS_RESOLVER_API_KEY;

  if (!targetUrl || !apiKey) {
    return NextResponse.json(
      { error: "Missing target URL or API key" },
      { status: 500 },
    );
  }

  try {
    const body = await req.json();

    // Create a cache key based on the single address
    const address = body.addresses?.[0];
    if (!address) {
      return NextResponse.json(
        { error: "No address provided" },
        { status: 400 },
      );
    }

    const cacheKey = `uns-resolver:${CHAIN_ID}:${address}`;

    // Try to get a cached response first
    if (CACHE) {
      try {
        const cachedResponse = await CACHE.get(cacheKey);
        if (cachedResponse) {
          const parsedResponse = JSON.parse(cachedResponse);
          return NextResponse.json(parsedResponse.data, {
            status: parsedResponse.status,
            headers: {
              "X-Cache": "HIT",
            },
          });
        }
      } catch (cacheError) {
        console.warn("Cache read error:", cacheError);
      }
    }

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    // Cache successful responses for a week (7 days = 604800 seconds)
    if (response.ok && CACHE && data.data) {
      try {
        const cacheData = {
          data,
          status: response.status,
          timestamp: Date.now(),
        };

        await CACHE.put(cacheKey, JSON.stringify(cacheData), {
          expirationTtl: 604800, // 7 days in seconds
        });
      } catch (cacheError) {
        console.warn("Cache write error:", cacheError);
      }
    }

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        "X-Cache": "MISS",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to proxy the request", details: error.message },
      { status: 500 },
    );
  }
}
