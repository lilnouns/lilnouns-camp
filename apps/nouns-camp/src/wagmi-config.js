import {
  http,
  createConfig,
  cookieStorage,
  createStorage,
  cookieToInitialState,
  fallback,
} from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import {
  walletConnect,
  coinbaseWallet,
  safe,
  injected,
} from "wagmi/connectors";
import { CHAIN_ID } from "@/constants/env";
import { getChain } from "@/utils/chains";

const chain = getChain(CHAIN_ID);

export const getJsonRpcUrl = (chainId) => {
  switch (chainId) {
    case mainnet.id:
      return `https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`;
    case sepolia.id:
      return `https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`;
    default:
      throw new Error();
  }
};

export const getAnkrJsonRpcUrl = (chainId) => {
  switch (chainId) {
    case mainnet.id:
      return `https://rpc.ankr.com/eth/${process.env.NEXT_PUBLIC_ANKR_API_KEY}`;
    case sepolia.id:
      return `https://rpc.ankr.com/eth_sepolia/${process.env.NEXT_PUBLIC_ANKR_API_KEY}`;
    default:
      throw new Error();
  }
};

export const config = createConfig({
  ssr: true,
  storage: createStorage({ storage: cookieStorage }),
  syncConnectedChain: false,
  chains: [chain],
  connectors: [
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID,
    }),
    coinbaseWallet({ appName: "Nouns Camp" }),
    safe(),
    injected(),
  ],
  transports: {
    [chain.id]: fallback([
      http(getJsonRpcUrl(chain.id)),
      http(getAnkrJsonRpcUrl(chain.id)),
    ]),
  },
  batch: {
    multicall: {
      wait: 50,
      batchSize: 1024 * 8, // 8kb seems to be the max size for cloudflare
    },
  },
});

export const getStateFromCookie = (cookie) =>
  cookieToInitialState(config, cookie);
