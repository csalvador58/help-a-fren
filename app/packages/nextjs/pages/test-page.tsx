// import { useEffect, useState } from "react";
import { useState } from "react";
import Proposal from "../components/help-a-fren/Proposal";
import HafTreasury from "../components/help-a-fren/Treasury";
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
import { MagicLogin } from "~~/components/help-a-fren/utils/MagicLogin";
import { TEST_WALLET } from "~~/utils/constants";

const TestPage: NextPage = () => {
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

  // Plea For Help
  const [pleaReason, setPleaReason] = useState("");
  const [pleaUse, setPleaUse] = useState("");
  // const [pleaMessage, setPleaMessage] = useState("");

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
    const result = await MagicLogin(true);
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

      <div className="flex justify-center w-full py-2 gap-2 sticky top-1 z-10">
        <a href="#item1" className="btn btn-xs">
          About Help-A-Fren
        </a>
        <a href="#item2" className="btn btn-xs">
          Propose a Plea For Help
        </a>
        <a href="#item3" className="btn btn-xs">
          Vote for a Plea
        </a>
        <a href="#item4" className="btn btn-xs">
          Track Your Frens
        </a>
      </div>

      <div className="carousel carousel-center p-4 space-x-4 rounded-box">
        <div id="item1" className="carousel-item w-full">
          {/* Testing */}

          {/* Treasury */}
          <HafTreasury nftBalance={nftBalance} votingPower={votingPower} />

          {/* <div className="card-body">
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
            </div> */}

          {/* Plea For Help */}
          <div className="card w-full glass shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Plea For Help</h2>
              <p>
                Location <span className="ml-5">USA</span>
                <span className="ml-5">Lahaina</span>
                <span className="ml-5">Maui</span>
                <span className="ml-5">96761</span>
              </p>
              <p>
                Wallet <span className="ml-5">0xafksfk2356fjklasjflsdjfasf678asjfo6787656safj0912</span>
              </p>
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text">Reason for initiating a Plea For Help?</span>
                </label>
                <input
                  type="text"
                  placeholder="a natural disaster, medical misfortune, etc."
                  className="input input-bordered w-full max-w-xs"
                  onChange={e => setPleaReason(e.target.value)}
                />
              </div>
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text">How will the money be used?</span>
                </label>
                <input
                  type="text"
                  placeholder="towards rebuilding"
                  className="input input-bordered w-full max-w-xs"
                  onChange={e => setPleaUse(e.target.value)}
                />
              </div>
              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text">One-Time Campaign</span>
                  <input type="radio" name="radio-10" className="radio checked:bg-blue-500" checked />
                </label>
              </div>
              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text">On-Going Campaign</span>
                  <input type="radio" name="radio-10" className="radio checked:bg-blue-500" checked />
                </label>
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Message prompt to display on Proposal form</span>
                </label>
                <textarea
                  className="textarea textarea-bordered h-24"
                  placeholder="Information or instructions you would like proposers to know..."
                ></textarea>
              </div>
              <div className="card-actions justify-end">
                <button className="btn btn-accent">
                  Submit <ArrowSmallRightIcon className="w-3 h-3 mt-0.5" />
                </button>
                {/* <button
                  className="btn btn-primary rounded-full capitalize font-normal font-white w-24 flex items-center gap-1 hover:gap-2 transition-all tracking-widest"
                  onClick={() => writeAsync()}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    <>
                      Activate <ArrowSmallRightIcon className="w-3 h-3 mt-0.5" />
                    </>
                  )}
                </button> */}
              </div>
            </div>
          </div>
        </div>
        <div id="item2" className="carousel-item w-full">
          {/* Proposer */}
          <Proposal
            submitter={proposalSubmitter}
            setSubmitter={setProposalSubmitter}
            wallet={proposalWallet}
            setWallet={setProposalWallet}
            title={proposalTitle}
            setTitle={setProposalTitle}
            recipient={proposalRecipient}
            setRecipient={setProposalRecipient}
            reason={proposalReason}
            setReason={setProposalReason}
            use={proposalUse}
            setUse={setProposalUse}
            amount={proposalAmount}
            setAmount={setProposalAmount}
          />
        </div>
        <div id="item3" className="carousel-item w-full">
          {/* Voter */}
          <div className="card w-full glass shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Vote</h2>
              <p>Claims a vote NFT, only one token can be claimed</p>
              <p>
                Indicate if you are for, against, or abstain from the proposal request. Be sure to submit each vote.
              </p>
              <div className="form-control">
                <h3>Proposal 1</h3>
                <p>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed eleifend non sapien a condimentum. Nunc
                  imperdiet lorem non massa lobortis dignissim. Nam at nibh iaculis, sagittis sem non, scelerisque
                  tortor. Phasellus dictum lorem at felis fringilla efficitur sit amet a ante. Pellentesque at molestie
                  velit, eu finibus sem.
                </p>
                <div className="w-full max-w-xs">
                  <label className="label">
                    <span className="label-text">Decision</span>
                  </label>
                  <select className="select select-bordered">
                    <option disabled selected>
                      Select
                    </option>
                    <option>For</option>
                    <option>Against</option>
                    <option>Abstain</option>
                  </select>
                </div>
                <h3>Asking</h3>
                <p>$XX,XXX</p>
                <div className="card-actions justify-end">
                  <button className="btn btn-accent">Submit</button>
                </div>
              </div>
              <div className="form-control">
                <h3>Proposal 2</h3>
                <p>
                  Donec risus nunc, gravida quis congue et, convallis ut ipsum. In scelerisque dictum diam sit amet
                  eleifend. Pellentesque non ipsum ac diam cursus aliquet non id est.
                </p>
                <div className="w-full max-w-xs">
                  <label className="label">
                    <span className="label-text">Decision</span>
                  </label>
                  <select className="select select-bordered">
                    <option disabled selected>
                      Select
                    </option>
                    <option>For</option>
                    <option>Against</option>
                    <option>Abstain</option>
                  </select>
                </div>
                <h3>Asking</h3>
                <p>$XX,XXX</p>
                <div className="card-actions justify-end">
                  <button className="btn btn-accent">Submit</button>
                </div>
              </div>
              <div className="form-control">
                <h3>Proposal 3</h3>
                <p>
                  Sed hendrerit porttitor ex a pulvinar. Pellentesque at accumsan nisi, eu commodo nibh. In ultrices,
                  augue at bibendum mollis, neque eros aliquet est, vel ullamcorper ex neque ac magna.
                </p>
                <div className="w-full max-w-xs">
                  <label className="label">
                    <span className="label-text">Decision</span>
                  </label>
                  <select className="select select-bordered">
                    <option disabled selected>
                      Select
                    </option>
                    <option>For</option>
                    <option>Against</option>
                    <option>Abstain</option>
                  </select>
                </div>
                <h3>Asking</h3>
                <p>Unlimited, On-Going</p>
                <div className="card-actions justify-end">
                  <button className="btn btn-accent">Submit</button>
                </div>
              </div>
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
        <div id="item4" className="carousel-item w-full">
          {/* Results */}
          <div className="card w-full glass shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Results</h2>
              <p>
                The following information indicates the status and result of each proposal that has been submitted thus
                far.
              </p>
              <div className="card-actions justify-end">
                <p>
                  Donations to date: <span className="ml-5">$XXX,XXX</span>
                </p>
              </div>
              <div>
                <h3>Proposal 1</h3>
                <p>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed eleifend non sapien a condimentum. Nunc
                  imperdiet lorem non massa lobortis dignissim. Nam at nibh iaculis, sagittis sem non, scelerisque
                  tortor. Phasellus dictum lorem at felis fringilla efficitur sit amet a ante. Pellentesque at molestie
                  velit, eu finibus sem.
                </p>
                <h3>Status</h3>
                <a href="#">Approved and Sent</a>
              </div>
              <div>
                <h3>Proposal 2</h3>
                <p>
                  Donec risus nunc, gravida quis congue et, convallis ut ipsum. In scelerisque dictum diam sit amet
                  eleifend. Pellentesque non ipsum ac diam cursus aliquet non id est.
                </p>
                <h3>Status</h3>
                <p>Active</p>
              </div>
              <div>
                <h3>Proposal 3</h3>
                <p>
                  Sed hendrerit porttitor ex a pulvinar. Pellentesque at accumsan nisi, eu commodo nibh. In ultrices,
                  augue at bibendum mollis, neque eros aliquet est, vel ullamcorper ex neque ac magna.
                </p>
                <h3>Status</h3>
                <p>Active</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-1" data-theme="exampleUi">
        {/* <ContractInteraction /> */}
        {/* <ContractData /> */}

        {/* Organizer */}
      </div>
    </>
  );
};

export default TestPage;
