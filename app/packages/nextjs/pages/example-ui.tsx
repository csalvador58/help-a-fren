// import { useEffect, useState } from "react";
import { useState } from "react";
import { InstanceWithExtensions, SDKBase } from "@magic-sdk/provider";
import { Magic, MagicSDKExtensionsOption, MagicUserMetadata } from "magic-sdk";
import type { NextPage } from "next";
// import { useWalletClient } from "wagmi";
import { ArrowSmallRightIcon } from "@heroicons/react/24/outline";
import { MetaHeader } from "~~/components/MetaHeader";
// import { ContractData } from "~~/components/example-ui/ContractData";
// import { ContractInteraction } from "~~/components/example-ui/ContractInteraction";
import { Address, Balance } from "~~/components/scaffold-eth";
import {
  // useAccountBalance,
  useDeployedContractInfo,
  useScaffoldContractRead,
  useScaffoldContractWrite,
} from "~~/hooks/scaffold-eth";
import { MagicLogin } from "~~/utils/MagicLogin";
import { TEST_WALLET } from "~~/utils/constants";

const ExampleUI: NextPage = () => {
  // const { data: totalCounter } = useScaffoldContractRead({
  //   contractName: "YourContract",
  //   functionName: "getGreeting",
  //   args: ["ARGUMENTS IF THE FUNCTION ACCEPTS ANY"],
  // });
  let magic: InstanceWithExtensions<SDKBase, MagicSDKExtensionsOption<string>>;
  if (typeof window !== "undefined") {
    magic = new Magic(process.env.NEXT_PUBLIC_MAGIC_API_KEY as string);
  }
  const [magicLogin, setMagicLogin] = useState<any>(null);
  const [magicAddress, setMagicAddress] = useState<string>("");

  // Treasury
  const { data: treasuryInfo } = useDeployedContractInfo("HelpAFrenTreasury");

  // Voting Token
  const { data: nftBalance } = useScaffoldContractRead({
    contractName: "HelpAFrenVoteToken",
    functionName: "balanceOf",
    args: [TEST_WALLET],
  });
  const { data: votingPower } = useScaffoldContractRead({
    contractName: "HelpAFrenVoteToken",
    functionName: "getVotes",
    args: [TEST_WALLET],
  });

  // Voter claims Vote token and delegates to self
  const { writeAsync: claimVoteToken, isLoading: isClaimVoteTokenLoading } = useScaffoldContractWrite({
    contractName: "HelpAFrenVoteToken",
    functionName: "safeMint",
    args: [TEST_WALLET, "test"],
    // value: parseEther("0.01"),
    onBlockConfirmation: txnReceipt => {
      console.log("📦 Transaction blockHash", txnReceipt.blockHash);
    },
  });

  const { writeAsync: delegateVoteToken, isLoading: isDelegateVoteTokenLoading } = useScaffoldContractWrite({
    contractName: "HelpAFrenVoteToken",
    functionName: "delegate",
    args: [TEST_WALLET],
    // value: parseEther("0.01"),
    onBlockConfirmation: txnReceipt => {
      console.log("📦 Transaction blockHash", txnReceipt.blockHash);
    },
  });

  const handleNFTTokenClaim = async () => {
    claimVoteToken();
    delegateVoteToken();
  };

  // Magic Auth
  const signInWithMagicOTP = async () => {
    const result = await MagicLogin();
    console.log("Magic Login Response: ", result?.response);
    if (result?.MAGIC) {
      setMagicLogin(result.MAGIC);
    }

    const magicResponse: MagicUserMetadata = await magic.user.getMetadata();
    if (magicResponse.publicAddress) setMagicAddress(magicResponse.publicAddress);
  };

  return (
    <>
      <MetaHeader
        title="Example UI | Scaffold-ETH 2"
        description="Example UI created with 🏗 Scaffold-ETH 2, showcasing some of its features."
      >
        {/* We are importing the font this way to lighten the size of SE2. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Bai+Jamjuree&display=swap" rel="stylesheet" />
      </MetaHeader>
      {/* <div className="grid lg:grid-cols-2 flex-grow" data-theme="exampleUi"> */}
      <div className="grid lg:grid-cols-2" data-theme="exampleUi">
        {/* <ContractInteraction /> */}
        {/* <ContractData /> */}

        {/* Testing */}

        <div className="card w-96 bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Current Account</h2>
            <Address address={TEST_WALLET} />
            <p>NFT Balance: {nftBalance?.toString() || "Loading..."}</p>
            <p>Voting Power: {votingPower?.toString() || "Loading..."}</p>
          </div>
        </div>

        <div className="card w-96 bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Magic</h2>
            {!magicLogin && (
              <button className="btn btn-wide btn-accent" onClick={signInWithMagicOTP}>
                Log Into Magic
              </button>
            )}
            {magicLogin && (
              <>
                <p>Logged in with Magic</p>
                <Address address={magicAddress} />
                <button className="btn btn-wide btn-accent" onClick={() => magicLogin?.user.logout()}>
                  Log Out
                </button>
              </>
            )}
          </div>
        </div>

        {/* Organizer */}

        {/* Treasury */}
        <div className="card w-96 bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Treasury Account</h2>
            <Address address={treasuryInfo?.address} />
            <div>
              <div>Treasury Balance: </div>
              <Balance address={treasuryInfo?.address} className="min-h-0 h-auto" />
            </div>
            <div>*Need Deposit Input*</div>
          </div>
        </div>

        {/* Proposer */}

        {/* Voter */}
        <div className="card w-96 bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Voter</h2>
            <p>Claims a vote NFT, only one token can be claimed</p>
            <div className="card-actions justify-end">
              <button
                className="btn btn-accent"
                onClick={handleNFTTokenClaim}
                disabled={isClaimVoteTokenLoading || isDelegateVoteTokenLoading}
              >
                {isClaimVoteTokenLoading || isDelegateVoteTokenLoading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <>
                    Claim <ArrowSmallRightIcon className="w-3 h-3 mt-0.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ExampleUI;
