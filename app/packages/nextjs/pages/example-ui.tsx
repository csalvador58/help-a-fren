// import { useEffect, useState } from "react";
import { RPCError, RPCErrorCode } from "magic-sdk";
import { Magic } from "magic-sdk";
import type { NextPage } from "next";
import { ArrowSmallRightIcon } from "@heroicons/react/24/outline";
import { MetaHeader } from "~~/components/MetaHeader";
// import { ContractData } from "~~/components/example-ui/ContractData";
// import { ContractInteraction } from "~~/components/example-ui/ContractInteraction";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldContractRead, useScaffoldContractWrite } from "~~/hooks/scaffold-eth";
import { useWalletClient } from "wagmi";

const TEST_WALLET = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

const ExampleUI: NextPage = () => {
  // const { data: totalCounter } = useScaffoldContractRead({
  //   contractName: "YourContract",
  //   functionName: "getGreeting",
  //   args: ["ARGUMENTS IF THE FUNCTION ACCEPTS ANY"],
  // });
  // const [magicIsActive, setMagicIsActive] = useState<boolean>(false);
  const { data: walletClient } = useWalletClient();

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

  const { writeAsync, isLoading } = useScaffoldContractWrite({
    contractName: "HelpAFrenVoteToken",
    functionName: "safeMint",
    args: [TEST_WALLET, "test"],
    // value: parseEther("0.01"),
    onBlockConfirmation: txnReceipt => {
      console.log("📦 Transaction blockHash", txnReceipt.blockHash);
    },
  });

  // useEffect(() => {
  //   const checkLoggedIn = async () => {
  //     try {
  //       const result = await MAGIC.user.isLoggedIn();
  //       console.log('Magic isLoggedIn: ', result);
  //       setMagicIsActive(result);
  //     } catch (error) {
  //       console.error('Error checking Magic logged-in state:', error);
  //     }
  //   };
  //   checkLoggedIn();

  //   return () => {
  //     // Logout of Magic when user leaves page
  //     console.log('Logging out of Magic.');
  //     const logout = async () => await MAGIC.user.logout();
  //     logout();
  //     setMagicIsActive(false);
  //   };
  // }, []);

  // Magic Auth
  const signInWithMagicOTP = async () => {
    try {
      if (typeof window !== "undefined") {
        const MAGIC = new Magic(process.env.NEXT_PUBLIC_MAGIC_API_KEY!, {
          network: {
            rpcUrl: `https://polygon-mumbai.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY!}}`,
            chainId: 80001, // or preferred chain
          },
        });
        const email = ""; // Set to empty string to force Magic to show UI
        if (!!email) {
          // console.log('Logging in Magic with email: ', email);
          const response = await MAGIC?.auth.loginWithEmailOTP({ email: email });
          console.log("response: ", response);
        } else {
          const response = await MAGIC?.wallet.connectWithUI();
          console.log("response: ", response);
        }
        // setMagicIsActive(true);
      } else {
        console.log("Magic not available");
      }

    } catch (err) {
      if (err instanceof RPCError) {
        switch (err.code) {
          case RPCErrorCode.MagicLinkFailedVerification:
            console.log("Magic link failed");
            break;
          case RPCErrorCode.MagicLinkExpired:
            console.log("Magic link timeout");
            break;
          case RPCErrorCode.InternalError:
            console.log("Magic link cancelled");
            break;
          case RPCErrorCode.InvalidRequest:
            console.log("Magic link invalid email");
            break;
          case RPCErrorCode.MagicLinkRateLimited:
            console.log("Magic link rate limited");
            break;
        }
      }
    }
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
            <p>Wallet Client: {walletClient?.toString() || "Loading..."}</p>
          </div>
        </div>

        <button className="btn btn-wide btn-accent" onClick={signInWithMagicOTP}>
          Log Into Magic
        </button>
        {/* Organizer */}
        {/* Proposer */}
        {/* Voter */}
        <div className="card w-96 bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Voter</h2>
            <p>Claims a vote NFT, only one token can be claimed</p>
            <div className="card-actions justify-end">
              <button className="btn btn-accent" onClick={() => writeAsync()} disabled={isLoading}>
                {isLoading ? (
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
