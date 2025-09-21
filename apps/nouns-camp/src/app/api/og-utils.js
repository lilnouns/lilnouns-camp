import { isAddress as isEthereumAccountAddress } from "viem";
import { ethereum as ethereumUtils } from "@shades/common/utils";

const { truncateAddress } = ethereumUtils;

export const getFonts = async () => {
  const fontName = "Inter";

  const fonts = [];

  const load = async (relativePath, weight) => {
    try {
      const res = await fetch(new URL(relativePath, import.meta.url));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.arrayBuffer();
      fonts.push({ data, name: fontName, weight, style: "normal" });
    } catch (e) {
      // Gracefully degrade if the font asset is missing or URL resolution fails.
      // This keeps OG generation working with default fonts instead of 500s.
      console.warn(
        `[og] Failed to load font '${relativePath}': ${e?.message ?? e}`,
      );
    }
  };

  await Promise.all([
    load("../../assets/fonts/Inter-SemiBold.woff", 400),
    load("../../assets/fonts/Inter-Bold.woff", 700),
  ]);

  return fonts;
};

export const formatDate = ({ value, ...options }) => {
  if (!value) return null;
  const formatter = new Intl.DateTimeFormat(undefined, options);
  return formatter.format(
    typeof value === "string" ? parseFloat(value) : value,
  );
};

export const displayName = ({ address, ensName }) => {
  const isAddress = address != null && isEthereumAccountAddress(address);
  const truncatedAddress = isAddress ? truncateAddress(address) : null;
  return ensName ?? truncatedAddress;
};
