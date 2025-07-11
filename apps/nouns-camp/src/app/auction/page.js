"use client";

import { useEffect } from "react";
import ClientAppProvider from "@/app/client-app-provider";
// import { build as buildMetadata } from "@/utils/metadata";
import NounScreen from "@/components/noun-screen";

// export const metadata = buildMetadata({
//   title: "Auction",
//   canonicalPathname: "/auction",
// });

export default function Page() {
  useEffect(() => {
    // Temporary redirect to main site
    window.location.href = "https://lilnouns.auction";
  }, []);

  return (
    <ClientAppProvider>
      <NounScreen />
    </ClientAppProvider>
  );
}
