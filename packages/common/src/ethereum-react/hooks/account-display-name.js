import { isAddress as isEthereumAccountAddress } from "viem";
import { useEnsName } from "wagmi";
import { truncateAddress } from "../../utils/ethereum.js";
import { useNNSName } from "./nns-name";

const useAccountDisplayName = (
  accountAddress,
  { enabled = true, chainId } = {},
) => {
  const isAddress =
    accountAddress != null && isEthereumAccountAddress(accountAddress);

  const { data: nnsName } = useNNSName(accountAddress);

  const { data: ensName } = useEnsName({
    address: accountAddress,
    chainId,
    query: {
      enabled: enabled && isAddress,
    },
  });

  const truncatedAddress = isAddress ? truncateAddress(accountAddress) : null;

  if (accountAddress != null && !isAddress)
    console.warn(`Invalid address "${accountAddress}"`);

  return nnsName ?? ensName ?? truncatedAddress;
};

export default useAccountDisplayName;
