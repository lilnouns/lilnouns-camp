import { buildSVG } from "@lilnounsdao/sdk";
import { default as ImageData } from "./image-data.json";
import { getPseudorandomPart } from "@lilnounsdao/assets";
import { keccak256 as solidityKeccak256 } from "@ethersproject/solidity";

const svgCacheBySeed = new Map();

const buildSvgStringFromSeed = (seed, { transparent = false } = {}) => {
  let cacheKey = [
    seed.background,
    seed.body,
    seed.accessory,
    seed.head,
    seed.glasses,
  ].join("-");

  if (transparent) cacheKey += "-t";

  if (svgCacheBySeed.has(cacheKey)) return svgCacheBySeed.get(cacheKey);

  const { parts, background } = getNounData(seed);

  return buildSVG(
    parts,
    ImageData.palette,
    transparent ? "00000000" : background,
  );
};

const buildDataUriFromSvgString = (svgString) => {
  const svgBase64 = btoa(svgString);
  return `data:image/svg+xml;base64,${svgBase64}`;
};

const getPseudorandomAccountSeed = (address) => {
  const paddedAddress = `0x${address.replace("0x", "").padStart(32 * 2, "0")}`;
  return getNounSeedFromBlockHash(0, paddedAddress);
};

export const buildAccountPlaceholderSvgString = (accountAddress, options) => {
  const seed = getPseudorandomAccountSeed(accountAddress);
  return buildSvgStringFromSeed(seed, options);
};

export const buildAccountPlaceholderDataUri = (accountAddress, options) => {
  const svgString = buildAccountPlaceholderSvgString(accountAddress, options);
  return buildDataUriFromSvgString(svgString);
};

export const buildDataUriFromSeed = (seed, options) => {
  const svgString = buildSvgStringFromSeed(seed, options);
  return buildDataUriFromSvgString(svgString);
};

export function getNounData(seed) {
  const {
    bgcolors,
    images: { accessories, bodies, glasses, heads },
  } = ImageData;
  return {
    parts: [
      bodies[seed.body],
      accessories[seed.accessory],
      heads[seed.head],
      glasses[seed.glasses],
    ],
    background: bgcolors[seed.background],
  };
}

export function getNounSeedFromBlockHash(nounId, blockHash) {
  const {
    bgcolors,
    images: { accessories, bodies, glasses, heads },
  } = ImageData;
  const pseudorandomness = solidityKeccak256(
    ["bytes32", "uint256"],
    [blockHash, nounId],
  );
  return {
    background: getPseudorandomPart(pseudorandomness, bgcolors.length, 0),
    body: getPseudorandomPart(pseudorandomness, bodies.length, 48),
    accessory: getPseudorandomPart(pseudorandomness, accessories.length, 96),
    head: getPseudorandomPart(pseudorandomness, heads.length, 144),
    glasses: getPseudorandomPart(pseudorandomness, glasses.length, 192),
  };
}
