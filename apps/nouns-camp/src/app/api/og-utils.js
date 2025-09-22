import { isAddress as isEthereumAccountAddress } from "viem";
import { ethereum as ethereumUtils } from "@shades/common/utils";
import { getCloudflareContext } from "@opennextjs/cloudflare";

const { truncateAddress } = ethereumUtils;

export const getFonts = async () => {
  const { env } = await getCloudflareContext({ async: true });
  const fontName = "Inter";

  const semiBoldResp = await env.ASSETS.fetch(
    "/assets/fonts/Inter-SemiBold.woff",
  );
  const semiBoldFontArray = await semiBoldResp.arrayBuffer();

  const boldResp = await env.ASSETS.fetch("/assets/fonts/Inter-Bold.woff");
  const boldFontArray = await boldResp.arrayBuffer();

  return [
    {
      data: semiBoldFontArray,
      name: fontName,
      weight: 400,
      style: "normal",
    },
    {
      data: boldFontArray,
      name: fontName,
      weight: 700,
      style: "normal",
    },
  ];
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
