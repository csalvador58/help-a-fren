// import { useEffect, useState } from "react";
import { ChangeEvent, useState } from "react";
import DonationTest from "./helpafren/haf-donation-test";
import Plea from "./helpafren/haf-plea";
import ProposalTest from "./helpafren/haf-proposal-test";
import ResultsTest from "./helpafren/haf-results-test";
import VoteForAFrenTest from "./helpafren/haf-vote-test";
import { InstanceWithExtensions, SDKBase } from "@magic-sdk/provider";
import { log } from "console";
import { Magic, MagicSDKExtensionsOption, MagicUserMetadata } from "magic-sdk";
import type { NextPage } from "next";
// import { useWalletClient } from "wagmi";
import { ArrowSmallRightIcon } from "@heroicons/react/24/outline";
import { MetaHeader } from "~~/components/MetaHeader";
import { MagicLogin } from "~~/components/help-a-fren/utils/MagicLogin";
// import { ContractData } from "~~/components/example-ui/ContractData";
// import { ContractInteraction } from "~~/components/example-ui/ContractInteraction";
import { Address, Balance } from "~~/components/scaffold-eth";
import {
  // useAccountBalance,
  useDeployedContractInfo,
  useScaffoldContractRead,
  useScaffoldContractWrite,
} from "~~/hooks/scaffold-eth";
import { TEST_WALLET } from "~~/utils/constants";
import { TREASURY_WALLET } from "~~/utils/constants";

const UITest: NextPage = () => {
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
  const [isDisabled, setDisabled] = useState(false);
  const [btnActive, setBtnActive] = useState<string | null>(null);
  //   const [voteSelect, setVoteSelect] = useState([]);

  // Treasury
  const { data: treasuryInfo } = useDeployedContractInfo("HelpAFrenTreasury");

  // Plea For Help
  const [pleaReason, setPleaReason] = useState("");
  const [pleaUse, setPleaUse] = useState("");
  const [pleaMessage, setPleaMessage] = useState("");

  // Proposal
  const [proposalSubmitter, setProposalSubmitter] = useState("");
  const [proposalWallet, setProposalWallet] = useState("");
  const [proposalTitle, setProposalTitle] = useState("");
  const [proposalRecipient, setProposalRecipient] = useState("");
  const [proposalReason, setProposalReason] = useState("");
  const [proposalUse, setProposalUse] = useState("");
  const [proposalAmount, setProposalAmount] = useState("");

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

  //   const setBtnActiveHandler = (button:any) => {
  //     setBtnActive(button.target.id);
  //   }
  //   console.log("Working", btnActive)
  //   const buttons = [
  //     {id:1, text:`$25`, value:25},
  //     {id:2, text:`$50`, value:50},
  //     {id:3, text:`$100`, value:100},
  //     {id:4, text:`$500`, value:500},
  //     {id:5, text:`Other`, value:0}
  //   ]

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
      <div className="wrapper p-md justify-center" data-theme="exampleUi">
        <div className="container grid gap-6 max-w-screen-xl">
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

          {/* Donations */}
          <DonationTest btnActive={btnActive} setBtnActive={setBtnActive} />

          {/* Plea For Help */}
          <Plea
            pleaReason={pleaReason}
            pleaUse={pleaUse}
            pleaMessage={pleaMessage}
            setPleaReason={setPleaReason}
            setPleaUse={setPleaUse}
            setPleaMessage={setPleaMessage}
          />

          {/* Proposer */}
          <ProposalTest
            submitter={proposalSubmitter}
            wallet={proposalWallet}
            title={proposalTitle}
            recipient={proposalRecipient}
            reason={proposalReason}
            use={proposalUse}
            amount={proposalAmount}
            setSubmitter={setProposalSubmitter}
            setWallet={setProposalWallet}
            setTitle={setProposalTitle}
            setRecipient={setProposalRecipient}
            setReason={setProposalReason}
            setUse={setProposalUse}
            setAmount={setProposalAmount}
            pleaMessage={pleaMessage}
          />

          {/* Voter */}
          <VoteForAFrenTest />

          {/* Results */}
          <ResultsTest />
        </div>
      </div>
    </>
  );
};

export default UITest;
