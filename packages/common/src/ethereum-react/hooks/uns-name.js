import { useQuery } from "@tanstack/react-query";

async function fetchUNSName(address) {
  const res = await fetch(`/resolvers/uns`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ addresses: [address] }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to resolve UNS name: ${res.status} - ${errorText}`);
  }

  const body = await res.json();
  return body.data[0].meta.domain || null;
}

export function useUNSName(address) {
  return useQuery({
    queryKey: ["uns-name", address],
    queryFn: () => fetchUNSName(address),
    enabled: Boolean(address),
    onError: (error) => {
      console.error("Failed to fetch UNS name:", error);
    },
  });
}
