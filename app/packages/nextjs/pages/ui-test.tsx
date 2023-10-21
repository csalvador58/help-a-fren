// import { useEffect, useState } from "react";
import { ChangeEvent, useState } from "react";
import DonationTest from "./helpafren/haf-donation-test";
import PleaTest from "../pages/helpafren/haf-plea-test";
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
          {/* Donations */}
          <DonationTest btnActive={btnActive} setBtnActive={setBtnActive} />

          {/* Plea For Help */}
          <PleaTest
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
