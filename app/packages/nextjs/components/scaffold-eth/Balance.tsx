import { useAccountBalance } from "~~/hooks/scaffold-eth";
import { PROJECT_PRICE_MULTIPLIER } from "~~/utils/constants";
import { getTargetNetwork } from "~~/utils/scaffold-eth";

type TBalanceProps = {
  address?: string;
  className?: string;
};

/**
 * Display (ETH & USD) balance of an ETH address.
 */
export const Balance = ({ address, className = "" }: TBalanceProps) => {
  const configuredNetwork = getTargetNetwork();
  const { balance, price, isError, isLoading, onToggleBalance, isEthBalance } = useAccountBalance(address);

  if (!address || isLoading || balance === null) {
    return (
      <div className="animate-pulse flex space-x-4">
        <div className="rounded-md bg-slate-300 h-6 w-6"></div>
        <div className="flex items-center space-y-6">
          <div className="h-2 w-28 bg-slate-300 rounded"></div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={`border-2 border-gray-400 rounded-md px-2 flex flex-col items-center max-w-fit cursor-pointer`}>
        <div className="text-warning">Error</div>
      </div>
    );
  }

  return (
    // ml-1.5 text-${size} font-normal bg-gray text-sm badge badge-md badge-accent badge-outline ml-xs
    <button
      className={`btn btn-sm btn-ghost shadow-none flex flex-col font-normal items-center hover:bg-transparent ${className}`}
      onClick={onToggleBalance}
    >
      <div className="w-full flex items-center justify-center">
        {isEthBalance ? (
          <>
            <span className="text-[1em] font-normal badge badge-md badge-accent badge-outline ml-0 mr-sm">{+balance?.toFixed(4) * PROJECT_PRICE_MULTIPLIER}</span>
            <span className="text-[1em] font-bold ml-1.5"> {configuredNetwork.nativeCurrency.symbol}</span>
          </>
        ) : (
          <>
            <span className="text-[1em]">$</span>
            {/* <span>{(balance * price * PROJECT_PRICE_MULTIPLIER).toFixed(2)}</span> */}
            <span className="text-[1em] font-normal badge badge-md badge-accent badge-outline ml-sm">
              {" "}
              {(balance * price * PROJECT_PRICE_MULTIPLIER).toLocaleString("en-US", { maximumFractionDigits: 0 })}
            </span>
          </>
        )}
      </div>
    </button>
  );
};
