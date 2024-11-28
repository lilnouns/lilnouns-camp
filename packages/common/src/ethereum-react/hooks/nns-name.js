import { useQuery } from "@tanstack/react-query";

async function fetchNNSName(address) {
  const res = await fetch(`https://api.nns.xyz/resolve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ address }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to resolve NNS name: ${res.status} - ${errorText}`);
  }

  const body = await res.json();
  return body.name || null;
}

export function useNNSName(address) {
  return useQuery({
    queryKey: ["nns-name", address],
    queryFn: () => fetchNNSName(address),
    enabled: Boolean(address),
    onError: (error) => {
      console.error("Failed to fetch NNS name:", error);
    },
  });
}
