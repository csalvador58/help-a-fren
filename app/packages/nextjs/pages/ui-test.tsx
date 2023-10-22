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
  const [forProposalForm, setForProposalForm] = useState("");

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
            setForProposalForm={setForProposalForm}
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
            forProposalForm={forProposalForm}
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





//////////////////////////////////////////
// Code cut from default index.tsx file//
////////////////////////////////////////

// import Link from "next/link";
// import type { NextPage } from "next";
// import { BugAntIcon, MagnifyingGlassIcon, SparklesIcon } from "@heroicons/react/24/outline";
// import { MetaHeader } from "~~/components/MetaHeader";

// const Home: NextPage = () => {
//   return (
//     <>
//       <MetaHeader />
//       <div className="flex items-center flex-col flex-grow pt-10">
//         <div className="px-5">
//           <h1 className="text-center mb-8">
//             <span className="block text-2xl mb-2">Welcome to</span>
//             <span className="block text-4xl font-bold">Scaffold-ETH 2</span>
//           </h1>
//           <p className="text-center text-lg">
//             Get started by editing{" "}
//             <code className="italic bg-base-300 text-base font-bold max-w-full break-words break-all inline-block">
//               packages/nextjs/pages/index.tsx
//             </code>
//           </p>
//           <p className="text-center text-lg">
//             Edit your smart contract{" "}
//             <code className="italic bg-base-300 text-base font-bold max-w-full break-words break-all inline-block">
//               YourContract.sol
//             </code>{" "}
//             in{" "}
//             <code className="italic bg-base-300 text-base font-bold max-w-full break-words break-all inline-block">
//               packages/hardhat/contracts
//             </code>
//           </p>
//         </div>

//         <div className="flex-grow bg-base-300 w-full mt-16 px-8 py-12">
//           <div className="flex justify-center items-center gap-12 flex-col sm:flex-row">
//             {/* <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl">
//               <BugAntIcon className="h-8 w-8 fill-secondary" />
//               <p>
//                 Tinker with your smart contract using the{" "}
//                 <Link href="/debug" passHref className="link">
//                   Debug Contract
//                 </Link>{" "}
//                 tab.
//               </p>
//             </div> */}
//             <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl">
//               <SparklesIcon className="h-8 w-8 fill-secondary" />
//               <p>
//                 Experiment with{" "}
//                 <Link href="/example-ui" passHref className="link">
//                   Example UI
//                 </Link>{" "}
//                 to build your own UI.
//               </p>
//             </div>
//             <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl">
//               <MagnifyingGlassIcon className="h-8 w-8 fill-secondary" />
//               <p>
//                 Explore your local transactions with the{" "}
//                 <Link href="/blockexplorer" passHref className="link">
//                   Block Explorer
//                 </Link>{" "}
//                 tab.
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// };

// export default Home;