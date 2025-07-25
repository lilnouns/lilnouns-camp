import getDateYear from "date-fns/getYear";
import datesDifferenceInMonths from "date-fns/differenceInCalendarMonths";
import { formatAbiParameters } from "abitype";
import { formatEther, formatUnits } from "viem";
import React from "react";
import { css } from "@emotion/react";
import { ethereum as ethereumUtils } from "@shades/common/utils";
import Button from "@shades/ui-web/button";
import {
  CaretDown as CaretDownIcon,
  Checkmark as CheckmarkIcon,
  CrossCircle as CrossCircleIcon,
} from "@shades/ui-web/icons";
import * as Tooltip from "@shades/ui-web/tooltip";
import { resolveIdentifier as resolveContractIdentifier } from "@/contracts";
import useAccountDisplayName from "@/hooks/account-display-name";
import useContract from "@/hooks/contract";
import useDecodedFunctionData from "@/hooks/decoded-function-data";
import Code from "@/components/code";
import FormattedDateWithTooltip from "@/components/formatted-date-with-tooltip";
import NounPreviewPopoverTrigger from "@/components/noun-preview-popover-trigger";
import Link from "@shades/ui-web/link";
import Spinner from "@shades/ui-web/spinner";
import { buildEtherscanLink } from "@/utils/etherscan";

const decimalsByCurrency = {
  eth: 18,
  weth: 18,
  usdc: 6,
};

export const useEnhancedParsedTransaction = (transaction) => {
  const { type, target, signature, calldata, value, simulation } = transaction;
  const isUnparsed = [
    "unparsed-function-call",
    "unparsed-payable-function-call",
  ].includes(type);

  const decodedFunctionData = useDecodedFunctionData(
    { target, calldata, signature },
    { enabled: isUnparsed },
  );

  if (decodedFunctionData == null) return transaction;

  const enhancedType = [
    decodedFunctionData.proxy ? "proxied" : null,
    type === "unparsed-payable-function-call" ? "payable" : null,
    "function-call",
  ]
    .filter(Boolean)
    .join("-");

  return {
    target,
    proxyImplementationAddress: decodedFunctionData.proxyImplementationAddress,
    type: enhancedType,
    functionName: decodedFunctionData.name,
    functionInputs: decodedFunctionData.inputs,
    functionInputTypes: decodedFunctionData.inputTypes,
    value,
    simulation,
  };
};

const TransactionList = ({ transactions, isSimulationRunning }) => (
  <ol
    data-count={transactions.length}
    css={(t) =>
      css({
        margin: 0,
        padding: 0,
        fontSize: t.text.sizes.base,
        li: { listStyle: "none" },
        '&:not([data-count="1"])': {
          paddingLeft: "2rem",
          li: { listStyle: "decimal" },
        },
        "li + li": { marginTop: "1.5rem" },
        "li:has(pre code) + li": {
          marginTop: "2.6rem",
        },
        "pre:has(code)": {
          marginTop: "0.8rem",
        },
      })
    }
  >
    {transactions.map((t, i) => (
      <li key={i}>
        <ListItem transaction={t} isSimulationRunning={isSimulationRunning} />
      </li>
    ))}
  </ol>
);

const ListItem = ({ transaction, isSimulationRunning }) => {
  const daoPayerContract = useContract("payer");
  const treasuryContract = useContract("executor");
  const [isExpanded, setExpanded] = React.useState(false);
  const t = useEnhancedParsedTransaction(transaction);

  const renderCode = () => {
    switch (t.type) {
      case "function-call":
      case "payable-function-call":
      case "proxied-function-call":
      case "proxied-payable-function-call":
        return (
          <FunctionCallCodeBlock
            target={t.target}
            name={t.functionName}
            inputs={t.functionInputs}
            inputTypes={t.functionInputTypes}
            value={t.value}
            simulation={t.simulation}
            isSimulationRunning={isSimulationRunning}
          />
        );

      case "unparsed-function-call":
      case "unparsed-payable-function-call":
        return (
          <UnparsedFunctionCallCodeBlock
            transaction={t}
            isSimulationRunning={isSimulationRunning}
          />
        );

      case "transfer":
      case "usdc-approval":
      case "usdc-transfer-via-payer":
      case "usdc-transfer":
      case "weth-transfer":
      case "weth-deposit":
      case "weth-approval":
      case "weth-stream-funding":
      case "steth-transfer":
      case "usdc-stream-funding-via-payer":
      case "payer-top-up":
      case "stream":
      case "treasury-noun-transfer":
      case "escrow-noun-transfer":
      case "nftx-vault-redeem":
      case "nftx-pool-claim-rewards":
        return null;

      default:
        throw new Error(`Unknown transaction type: "${t.type}"`);
    }
  };

  const renderComment = () => {
    switch (t.type) {
      case "unparsed-function-call":
        if (t.error === "calldata-decoding-failed")
          return (
            <span css={(t) => css({ color: t.colors.textNegative })}>
              Decoding failed. This likely means that the signature or calldata
              is incorrectly formatted.
            </span>
          );
        return (
          <>
            Displaying the raw calldata as the contract ABI cound not be fetched
            from Etherscan.
          </>
        );

      case "proxied-function-call":
        return (
          <>
            Implementation contract at{" "}
            <AddressDisplayNameWithTooltip
              address={t.proxyImplementationAddress}
            />
            .
          </>
        );

      case "usdc-approval":
        return (
          <>
            This transaction sets an allowance for{" "}
            <AddressDisplayNameWithTooltip address={t.spenderAddress} /> to
            spend up to{" "}
            {parseFloat(formatUnits(t.usdcAmount, 6)).toLocaleString()} USDC
            from the treasury.
          </>
        );

      case "usdc-transfer-via-payer":
        return (
          <>
            USDC is transfered from the{" "}
            <AddressDisplayNameWithTooltip address={t.target} /> contract.
          </>
        );

      case "usdc-transfer":
        return (
          <>
            USDC is transfered from the{" "}
            <AddressDisplayNameWithTooltip address={treasuryContract.address} />
            .
          </>
        );

      case "payer-top-up":
        return (
          <>
            This transaction refills USDC to the{" "}
            <AddressDisplayNameWithTooltip address={daoPayerContract.address} />{" "}
            contract via the{" "}
            <AddressDisplayNameWithTooltip address={t.target} /> (
            <FormattedEthWithConditionalTooltip value={t.value} />
            ).
          </>
        );

      case "usdc-stream-funding-via-payer":
        return (
          <>
            This transaction funds the stream with the required amount via the{" "}
            <AddressDisplayNameWithTooltip address={t.target} />.
          </>
        );

      case "weth-stream-funding":
        return (
          <>
            This transaction funds the stream with the required amount via the{" "}
            <AddressDisplayNameWithTooltip address={t.target} />.
          </>
        );

      case "nftx-pool-claim-rewards":
        return (
          <>
            This transaction claims rewards from the{" "}
            <AddressDisplayNameWithTooltip address={t.target} />.
          </>
        );

      case "function-call":
      case "payable-function-call":
      case "proxied-payable-function-call":
      case "unparsed-payable-function-call":
      case "transfer":
      case "weth-transfer":
      case "steth-transfer":
      case "weth-deposit":
      case "weth-approval":
      case "stream":
      case "treasury-noun-transfer":
      case "escrow-noun-transfer":
      case "nftx-vault-redeem":
        return null;

      default:
        throw new Error(`Unknown transaction type: "${t.type}"`);
    }
  };

  const renderExpandedContent = () => {
    switch (t.type) {
      case "weth-transfer":
      case "steth-transfer":
      case "weth-deposit":
      case "weth-approval":
      case "usdc-approval":
      case "usdc-transfer":
      case "usdc-transfer-via-payer":
      case "stream":
      case "usdc-stream-funding-via-payer":
      case "weth-stream-funding":
      case "treasury-noun-transfer":
      case "escrow-noun-transfer":
      case "nftx-vault-redeem":
        return (
          <FunctionCallCodeBlock
            target={t.target}
            name={t.functionName}
            inputs={t.functionInputs}
            inputTypes={t.functionInputTypes}
            value={t.value}
            simulation={t.simulation}
            isSimulationRunning={isSimulationRunning}
          />
        );

      case "transfer":
      case "payer-top-up":
      case "nftx-pool-claim-rewards":
        return (
          <UnparsedFunctionCallCodeBlock
            transaction={t}
            isSimulationRunning={isSimulationRunning}
          />
        );

      case "unparsed-function-call":
      case "proxied-function-call":
      case "function-call":
      case "payable-function-call":
      case "proxied-payable-function-call":
      case "unparsed-payable-function-call":
        return null;

      default:
        throw new Error(`Unknown transaction type: "${t.type}"`);
    }
  };

  const code = renderCode();
  const comment = renderComment();
  const expandedContent = renderExpandedContent();

  return (
    <>
      <div
        css={(t) =>
          css({
            a: { color: t.colors.textDimmed },
            em: {
              color: t.colors.textDimmed,
              fontStyle: "normal",
              fontWeight: t.text.weights.emphasis,
            },
          })
        }
      >
        <TransactionExplanation transaction={t} />
      </div>
      {code}
      {comment != null && (
        <div
          css={(t) =>
            css({
              a: { color: "currentcolor" },
              fontSize: t.text.sizes.small,
              color: t.colors.textDimmed,
            })
          }
          style={{ marginTop: code == null ? "0.4rem" : "0.8rem" }}
        >
          {comment}
        </div>
      )}
      {expandedContent != null && (
        <div style={{ marginTop: "0.6rem" }}>
          <Button
            variant="opaque"
            size="tiny"
            onClick={() => {
              setExpanded((s) => !s);
            }}
            css={(t) =>
              css({
                fontSize: t.text.sizes.small,
                "[data-underline]": { textDecoration: "underline" },
              })
            }
            iconRight={
              <CaretDownIcon
                style={{
                  width: "0.85rem",
                  transform: isExpanded ? "scaleY(-1)" : undefined,
                }}
              />
            }
          >
            Expand
          </Button>
          {isExpanded && expandedContent}
        </div>
      )}
    </>
  );
};

const SimulationBadge = ({ simulation, isSimulationRunning }) => {
  const SimulationIcon = () => {
    return simulation.error ? (
      <CrossCircleIcon
        aria-hidden="true"
        css={(t) => css({ width: "1.3rem", color: t.colors.textNegative })}
      />
    ) : (
      <CheckmarkIcon
        aria-hidden="true"
        css={(t) => css({ width: "1.2rem", color: t.colors.textPositive })}
      />
    );
  };

  const SimulationStatus = () => {
    const simulationTitle = simulation.error
      ? (simulation?.error ?? "Simulation failed")
      : "Simulation passed";

    return (
      <div title={simulationTitle}>
        {simulation.id ? (
          <Link
            component="a"
            href={`https://www.tdly.co/shared/simulation/${simulation.id}`}
            rel="noreferrer"
            target="_blank"
          >
            <SimulationIcon />
          </Link>
        ) : (
          <SimulationIcon />
        )}
      </div>
    );
  };

  const renderContent = () => {
    if (isSimulationRunning) return <Spinner size="1.2rem" />;
    if (simulation?.error || simulation?.success) return <SimulationStatus />;
    return null;
  };

  return (
    <div css={css({ position: "absolute", bottom: "1.1rem", right: "1.1rem" })}>
      {renderContent()}
    </div>
  );
};

export const FunctionCallCodeBlock = ({
  target,
  name,
  inputs,
  value,
  inputTypes,
  simulation,
  isSimulationRunning,
}) => (
  <Code block>
    <AddressDisplayNameWithTooltip address={target} data-identifier>
      {ethereumUtils.truncateAddress(target)}
    </AddressDisplayNameWithTooltip>
    .
    <Tooltip.Root
      // Disable the tooltip if the function lack arguments
      open={inputs.length === 0 ? false : undefined}
    >
      <Tooltip.Trigger asChild>
        <span data-function-name>{name}</span>
      </Tooltip.Trigger>
      <Tooltip.Content side="top" sideOffset={6}>
        <Code>
          <span css={(t) => css({ color: t.colors.textPrimary })}>{name}</span>(
          {inputTypes ? formatAbiParameters(inputTypes) : ""})
        </Code>
      </Tooltip.Content>
    </Tooltip.Root>
    (
    {inputs.length > 0 && (
      <>
        <br />
        {inputs.map((input, i, inputs) => {
          const inputType = inputTypes?.[i]?.type;
          return (
            <React.Fragment key={i}>
              &nbsp;&nbsp;
              {Array.isArray(input) ? (
                <>
                  [
                  {input.map((item, i, items) => (
                    <React.Fragment key={i}>
                      <span data-argument>
                        {inputType === "address[]" ? (
                          <AddressDisplayNameWithTooltip address={item} />
                        ) : (
                          ethereumUtils.formatSolidityArgument(item)
                        )}
                      </span>
                      {i < items.length - 1 && <>, </>}
                    </React.Fragment>
                  ))}
                  ]
                </>
              ) : (
                <span data-argument>
                  {inputType === "address" ? (
                    <AddressDisplayNameWithTooltip address={input} />
                  ) : (
                    ethereumUtils.formatSolidityArgument(input)
                  )}
                </span>
              )}
              {i !== inputs.length - 1 && <>,</>}
              <br />
            </React.Fragment>
          );
        })}
      </>
    )}
    )
    {value > 0 && (
      <>
        <br />
        <span data-identifier>value</span>:{" "}
        <span data-argument>{value.toString()}</span>
        <span data-comment>
          {" // "}
          <FormattedEthWithConditionalTooltip value={value} />
        </span>
      </>
    )}
    <SimulationBadge
      simulation={simulation}
      isSimulationRunning={isSimulationRunning}
    />
  </Code>
);

export const UnparsedFunctionCallCodeBlock = ({
  transaction: t,
  isSimulationRunning,
}) => (
  <Code block>
    <span data-identifier>target</span>:{" "}
    <span data-argument>
      <AddressDisplayNameWithTooltip address={t.target} data-identifier>
        {t.target}
      </AddressDisplayNameWithTooltip>
    </span>
    {t.signature != null && (
      <>
        <br />
        <span data-identifier>signature</span>:{" "}
        <span data-argument>{t.signature}</span>
      </>
    )}
    {t.calldata != null && (
      <>
        <br />
        <span data-identifier>calldata</span>:{" "}
        <span data-argument>{t.calldata}</span>
      </>
    )}
    {t.value > 0 && (
      <>
        <br />
        <span data-identifier>value</span>:{" "}
        <span data-argument>{t.value.toString()}</span>
        <span data-comment>
          {" // "}
          <FormattedEthWithConditionalTooltip value={t.value} />
        </span>
      </>
    )}
    <SimulationBadge
      simulation={t.simulation}
      isSimulationRunning={isSimulationRunning}
    />
  </Code>
);

export const TransactionExplanation = ({ transaction: t }) => {
  switch (t.type) {
    case "transfer":
      return (
        <>
          Transfer{" "}
          <em>
            <FormattedEthWithConditionalTooltip value={t.value} />
          </em>{" "}
          to{" "}
          <em>
            <AddressDisplayNameWithTooltip address={t.target} />
          </em>
        </>
      );

    case "usdc-approval":
      return (
        <>
          Approve{" "}
          <em>
            <AddressDisplayNameWithTooltip address={t.spenderAddress} />
          </em>{" "}
          to spend{" "}
          <em>
            {parseFloat(formatUnits(t.usdcAmount, 6)).toLocaleString()} USDC
          </em>
        </>
      );

    case "usdc-transfer-via-payer":
      return (
        <>
          Transfer{" "}
          <em>
            {parseFloat(formatUnits(t.usdcAmount, 6)).toLocaleString()} USDC
          </em>{" "}
          to{" "}
          <em>
            <AddressDisplayNameWithTooltip address={t.receiverAddress} />
          </em>
        </>
      );

    case "usdc-transfer":
      return (
        <>
          Transfer{" "}
          <em>
            {parseFloat(formatUnits(t.usdcAmount, 6)).toLocaleString()} USDC
          </em>{" "}
          to{" "}
          <em>
            <AddressDisplayNameWithTooltip address={t.receiverAddress} />
          </em>
        </>
      );

    case "weth-transfer":
      return (
        <>
          Transfer{" "}
          <em>
            <FormattedEthWithConditionalTooltip
              value={t.wethAmount}
              tokenSymbol="WETH"
            />
          </em>{" "}
          to{" "}
          <em>
            <AddressDisplayNameWithTooltip address={t.receiverAddress} />
          </em>
        </>
      );

    case "steth-transfer":
      return (
        <>
          Transfer{" "}
          <em>
            <FormattedEthWithConditionalTooltip
              value={t.stethAmount}
              tokenSymbol="stETH"
            />
          </em>{" "}
          to{" "}
          <em>
            <AddressDisplayNameWithTooltip address={t.receiverAddress} />
          </em>
        </>
      );

    case "weth-approval":
      return (
        <>
          Approve{" "}
          <em>
            <AddressDisplayNameWithTooltip address={t.receiverAddress} />
          </em>{" "}
          to spend{" "}
          <em>
            <FormattedEthWithConditionalTooltip
              value={t.wethAmount}
              tokenSymbol="WETH"
            />
          </em>
        </>
      );

    case "weth-deposit":
      return (
        <>
          Deposit{" "}
          <em>
            <FormattedEthWithConditionalTooltip value={t.value} />
          </em>{" "}
          to the{" "}
          <em>
            <AddressDisplayNameWithTooltip address={t.target} />
          </em>{" "}
          contract
        </>
      );

    case "payer-top-up": {
      const { address: nounsPayerAddress } = resolveContractIdentifier("payer");
      return (
        <>
          Top up the{" "}
          <em>
            <AddressDisplayNameWithTooltip address={nounsPayerAddress} />
          </em>
        </>
      );
    }

    case "nftx-pool-claim-rewards": {
      const { address: nftxPoolAddress } =
        resolveContractIdentifier("nftx-pool");
      return (
        <>
          Claim rewards from the{" "}
          <em>
            <AddressDisplayNameWithTooltip address={nftxPoolAddress} />
          </em>
        </>
      );
    }

    case "stream": {
      const formattedUnits = formatUnits(
        t.tokenAmount,
        decimalsByCurrency[t.token.toLowerCase()],
      );
      // TODO: handle unknown token contract
      return (
        <>
          Stream{" "}
          {t.token != null && (
            <>
              <em>
                {t.token === "USDC"
                  ? parseFloat(formattedUnits).toLocaleString()
                  : formattedUnits}{" "}
                {t.token}
              </em>{" "}
            </>
          )}
          to{" "}
          <em>
            <AddressDisplayNameWithTooltip address={t.receiverAddress} />
          </em>{" "}
          between{" "}
          <FormattedDateWithTooltip
            disableRelative
            day="numeric"
            month="short"
            year={
              getDateYear(t.startDate) !== getDateYear(t.endDate)
                ? "numeric"
                : undefined
            }
            value={t.startDate}
          />{" "}
          and{" "}
          <FormattedDateWithTooltip
            disableRelative
            day="numeric"
            month="short"
            year="numeric"
            value={t.endDate}
          />{" "}
          ({datesDifferenceInMonths(t.endDate, t.startDate)} months)
        </>
      );
    }

    case "usdc-stream-funding-via-payer":
    case "weth-stream-funding":
      return (
        <>
          Fund the{" "}
          <em>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <a
                  href={buildEtherscanLink(`/address/${t.receiverAddress}`)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Stream Contract
                </a>
              </Tooltip.Trigger>
              <Tooltip.Content side="top" sideOffset={6}>
                {t.receiverAddress}
              </Tooltip.Content>
            </Tooltip.Root>
          </em>
        </>
      );

    case "treasury-noun-transfer":
      return (
        <>
          Transfer{" "}
          <NounPreviewPopoverTrigger
            nounId={t.nounId}
            css={(t) => css({ color: t.colors.textDimmed })}
          />{" "}
          to{" "}
          <em>
            <AddressDisplayNameWithTooltip address={t.receiverAddress} />
          </em>
        </>
      );

    case "escrow-noun-transfer":
      return (
        <>
          Transfer{" "}
          {t.nounIds.map((nounId, i, all) => {
            const isFirst = i === 0;
            const isLast = i === all.length - 1;
            return (
              <React.Fragment key={nounId}>
                {!isFirst && <>, </>}
                {!isFirst && isLast && <>and </>}
                <NounPreviewPopoverTrigger
                  nounId={nounId}
                  css={(t) => css({ color: t.colors.textDimmed })}
                />
              </React.Fragment>
            );
          })}{" "}
          to{" "}
          <em>
            <AddressDisplayNameWithTooltip address={t.receiverAddress} />
          </em>
        </>
      );

    case "nftx-vault-redeem":
      return (
        <>
          Transfer{" "}
          <strong>
            {Number(t.tokenAmount)} lil{" "}
            {t.tokenAmount > 1 ? "lil nouns" : "lil noun"}
          </strong>{" "}
          to{" "}
          <em>
            <AddressDisplayNameWithTooltip address={t.receiverAddress} />
          </em>
        </>
      );

    case "function-call":
    case "unparsed-function-call":
    case "payable-function-call":
    case "unparsed-payable-function-call":
    case "proxied-function-call":
    case "proxied-payable-function-call":
      return (
        <>
          {t.value > 0 ? (
            <>
              <em>
                <FormattedEthWithConditionalTooltip value={t.value} />
              </em>{" "}
              payable function call
            </>
          ) : (
            "Function call"
          )}{" "}
          to{" "}
          {t.proxyImplementationAddress != null ? "proxy contract" : "contract"}{" "}
          <em>
            <AddressDisplayNameWithTooltip address={t.target} />
          </em>
        </>
      );

    default:
      throw new Error(`Unknown transaction type: "${t.type}"`);
  }
};

export const FormattedEthWithConditionalTooltip = ({
  value,
  currency = "eth",
  tokenSymbol = "ETH",
  portal = false,
  truncate = true,
  decimals = 3,
  truncationDots = true,
  localeFormatting = false,
  tooltip,
}) => {
  const ethString = (() => {
    switch (currency) {
      case "eth":
        return formatEther(value ?? 0);
      case "usdc":
        return formatUnits(value ?? 0, 6);
      default:
        throw new Error();
    }
  })();
  let [integerPart, fractionalPart] = ethString.split(".");

  if (localeFormatting) integerPart = parseFloat(integerPart).toLocaleString();

  const truncateDecimals =
    truncate && fractionalPart != null && fractionalPart.length > decimals;

  const truncatedEthString = [
    integerPart,
    truncateDecimals
      ? `${fractionalPart.slice(0, decimals)}${truncationDots ? "..." : ""}`
      : fractionalPart,
  ]
    .filter(Boolean)
    .join(".");

  const formattedString = !tokenSymbol
    ? truncatedEthString
    : `${truncatedEthString} ${tokenSymbol}`;

  if (tooltip === false || !truncateDecimals) return formattedString;

  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <span role="button">{formattedString}</span>
      </Tooltip.Trigger>
      <Tooltip.Content side="top" sideOffset={6} portal={portal}>
        {tooltip ?? (
          <>
            {ethString} {tokenSymbol}
          </>
        )}
      </Tooltip.Content>
    </Tooltip.Root>
  );
};

export const AddressDisplayNameWithTooltip = ({
  address,
  children,
  ...props
}) => {
  const knownContract = useContract(address);
  const displayName = useAccountDisplayName(address);
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild {...props}>
        <a
          href={buildEtherscanLink(`/address/${address}`)}
          target="_blank"
          rel="noreferrer"
        >
          {children ?? knownContract?.name ?? displayName}
        </a>
      </Tooltip.Trigger>
      <Tooltip.Content
        side="top"
        sideOffset={6}
        css={(t) =>
          css({
            fontFamily: t.text.fontStacks.monospace,
            fontSize: t.text.sizes.small,
            color: t.colors.textDimmed,
          })
        }
      >
        <div
          style={{
            // This can’t be on `Tooltip.Content` for some reason I refuse to
            // spend time investigating
            userSelect: "text",
          }}
        >
          {knownContract != null && (
            <p
              css={(t) =>
                css({
                  fontFamily: t.text.fontStacks.default,
                  fontSize: t.text.sizes.small,
                  fontWeight: t.text.weights.header,
                  lineHeight: 1.5,
                })
              }
            >
              {knownContract.description ?? knownContract.name}
            </p>
          )}
          {address}
        </div>
      </Tooltip.Content>
    </Tooltip.Root>
  );
};

export default TransactionList;
