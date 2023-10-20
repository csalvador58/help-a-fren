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
import { MagicLogin } from "~~/components/help-a-fren/utils/MagicLogin";
import { TEST_WALLET } from "~~/utils/constants";
import { TREASURY_WALLET } from "~~/utils/constants";
import { log } from "console";

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
  const [isDisabled, setDisabled] = useState(false);
  const [btnActive, setBtnActive] = useState(null);

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
  // const [proposalReason, setProposalReason] = useState("");
  // const [proposalUse, setProposalUse] = useState("");
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

  const setBtnActiveHandler = (button:any) => {
    console.log("Target", button.target.id)
    setBtnActive(button.target.id);
    console.log("Value", button.target.value)
    console.log(button)
  }
  console.log("Working", btnActive)
  const buttons = [
    {id:1, text:`$25`, value:25},
    {id:2, text:`$50`, value:50},
    {id:3, text:`$100`, value:100},
    {id:4, text:`$500`, value:500},
    {id:5, text:`Other`, value:0}
  ]

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
          <div className="card w-full bg-base-100 shadow-xl">
            <div className="card-body haf-card-body gap-0 p-0 grid md:grid-cols-[55%_45%]">
              <div className="haf-purple grid gap-5 p-md place-content-center bg-primary text-primary-content rounded-tl-2xl rounded-tr-2xl md:rounded-tr-none md:rounded-bl-2xl image-full">
                <figure><img src="./haf-logo-drop-shadow.svg" className="w-6/12 mx-auto max-w-lg" /></figure>
              </div>
              <div className="grid gap-5 p-md">
                <div className="card-header-wrapper place-self-center">
                  <div className="card-header max-w-lg">
                    <h2 className="card-title justify-center">Donations</h2>
                    <p className="text-center max-w-lg justify-center">The fires in West Maui have devastated Lahaina and surrounding communities. Please Help-A-Fren and consider donating to this historical piece of Hawaiian history. Your generosity will go towards helping the local residents begin to rebuild their lives.</p>
                  </div>
                </div>
                <div>
                  <div className="text-lg">
                    <p className=" inline-flex">Location</p>
                    <span className="badge badge-md badge-accent badge-outline ml-sm inline-flex">USA</span>
                    <span className="badge badge-md badge-accent badge-outline ml-sm  inline-flex">Lahaina</span>
                    <span className="badge badge-md badge-accent badge-outline ml-sm  inline-flex">Maui</span>
                    <span className="badge badge-md badge-accent badge-outline ml-sm  inline-flex">96761</span>
                  </div>
                  <div className="text-lg">
                    <p className="inline-flex">Wallet</p>
                    <span className="inline-flex gap-4 m-sm"><Address address={TREASURY_WALLET} /></span>
                  </div>
                </div>
                <div className="card-actions my-md grid grid-cols-2 gap-6">
                  {buttons.map((button) => (
                    <button 
                      key={button.id} 
                      id={button.id.toString()}
                      className={btnActive == button.id ? `btn btn-success outline-none text-accent shadow-xl` : 'btn btn-neutral outline-none text-accent shadow-xl'}
                      onClick={(e) => setBtnActiveHandler(e)}
                      value={button.value}
                      >
                        {button.text}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Plea For Help */}
          <div className="card w-full bg-base-100 shadow-xl">
            <div className="card-body haf-card-body gap-0 p-0 grid md:grid-cols-[35%_65%]">
              <div className="haf-purple grid gap-5 p-md place-content-center bg-primary text-primary-content rounded-tl-2xl rounded-tr-2xl md:rounded-tr-none md:rounded-bl-2xl image-full">
                <figure><img src="./haf-logo-drop-shadow.svg" className="w-6/12 mx-auto max-w-lg" /></figure>
                <div className="text-lg">
                  <p className=" inline-flex">Location</p>
                  <span className="badge badge-md badge-accent badge-outline ml-sm inline-flex">USA</span>
                  <span className="badge badge-md badge-accent badge-outline ml-sm  inline-flex">Lahaina</span>
                  <span className="badge badge-md badge-accent badge-outline ml-sm  inline-flex">Maui</span>
                  <span className="badge badge-md badge-accent badge-outline ml-sm  inline-flex">96761</span>
                </div>
                <div className="text-lg">
                  <p className="inline-flex">Wallet</p>
                  <span className="inline-flex gap-4 m-sm"><Address address={TREASURY_WALLET} /></span>
                </div>
              </div>
              <div className="grid gap-5 p-md">
                <div className="card-header-wrapper place-self-center">
                  <div className="card-header max-w-lg">
                    <h2 className="card-title justify-center">Plea For Help</h2>
                    <p className="text-center max-w-lg justify-center">Fill out each field to initiate and activate Help-A-Fren.</p>
                  </div>
                </div>
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text">Reason for initiating a Plea For Help?</span>
                  </label>
                  <input 
                    type="text" 
                    placeholder="a natural disaster, medical misfortune, etc." 
                    className="input input-bordered w-full max-w-xl" 
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
                    className="input input-bordered w-full max-w-xl" 
                    onChange={e => setPleaUse(e.target.value)}
                  />
                </div>
                <div className="form-control w-fit flex-row">
                  <label className="label cursor-pointer">
                    <input type="radio" name="radio-10" className="radio checked:bg-blue-500" checked />
                    <span className="label-text ml-sm">One-Time Campaign</span> 
                  </label>
                  <label className="label cursor-pointer">
                    <input type="radio" name="radio-10" className="radio checked:bg-blue-500" checked />
                    <span className="label-text ml-sm">On-Going Campaign</span> 
                  </label>
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Message prompt to display on Proposal form</span>
                  </label>
                  <textarea className="textarea textarea-bordered h-24" placeholder="Information or instructions you would like proposers to know..."></textarea>
                </div>
                <div className="card-actions justify-end my-md">
                  <button
                    className="btn btn-accent outline-none"
                    >
                      Submit
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Proposer */}
          <div className="card w-full bg-base-100 shadow-xl">
            <div className="card-body haf-card-body gap-0 p-0 grid md:grid-cols-[35%_65%]">
              <div className="haf-purple grid gap-5 p-md place-content-center bg-primary text-primary-content rounded-tl-2xl rounded-tr-2xl md:rounded-tr-none md:rounded-bl-2xl image-full">
                <figure><img src="./haf-logo-drop-shadow.svg" className="w-6/12 mx-auto max-w-lg" /></figure>
                <div className="text-lg">
                  <p className=" inline-flex">Location</p>
                  <span className="badge badge-md badge-accent badge-outline ml-sm inline-flex">USA</span>
                  <span className="badge badge-md badge-accent badge-outline ml-sm  inline-flex">Lahaina</span>
                  <span className="badge badge-md badge-accent badge-outline ml-sm  inline-flex">Maui</span>
                  <span className="badge badge-md badge-accent badge-outline ml-sm  inline-flex">96761</span>
                </div>
                <div className="text-lg">
                  <p className="inline-flex">Wallet</p>
                  <span className="inline-flex gap-4 m-sm"><Address address={TREASURY_WALLET} /></span>
                </div>
              </div>
              <div className="grid gap-5 p-md">
                <div className="card-header-wrapper place-self-center">
                  <div className="card-header max-w-lg">
                    <h2 className="card-title justify-center">Proposal Form</h2>
                    <p className="text-center max-w-lg justify-center">You must be a verifiable resident or business owner in the aforementioned area in order to successfully submit a proposal.</p>
                  </div>
                </div>
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text">Name</span>
                  </label>
                  <input type="text" 
                    placeholder="Jane Doe" 
                    className="input input-bordered w-full max-w-xs" 
                    onChange={e => setProposalSubmitter(e.target.value)}
                  />
                </div>
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text">Wallet address funds should be sent to?</span>
                  </label>
                  <input type="text" 
                    placeholder="0x..." 
                    className="input input-bordered w-full max-w-xs" 
                    onChange={e => setProposalWallet(e.target.value)}
                  />
                </div>
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text">Title, name, or descriptor to refer to proposal as</span>
                  </label>
                  <input type="text" 
                    placeholder="Park Clean Up" 
                    className="input input-bordered w-full max-w-xs" 
                    onChange={e => setProposalTitle(e.target.value)}
                  />
                </div>
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text">Who will be the recipent of any approved funds?</span>
                  </label>
                  <input type="text" 
                    placeholder="Green Park clean up group" 
                    className="input input-bordered w-full max-w-xs" 
                    onChange={e => setProposalRecipient(e.target.value)}
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Reason for proposal?</span>
                  </label>
                  <textarea className="textarea textarea-bordered h-24"></textarea>
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">How will the money be used?</span>
                  </label>
                  <textarea className="textarea textarea-bordered h-24"></textarea>
                </div>
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text">Amount seeking</span>
                  </label>
                  <input 
                    type="text" 
                    placeholder="$" 
                    className="input input-bordered w-44 max-w-xs" 
                    onChange={e => setProposalAmount(e.target.value)}
                  />
                </div>
                <div className="form-control w-fit flex-row">
                  <label className="label cursor-pointer">
                    <input type="radio" name="radio-10" className="radio checked:bg-blue-500" checked />
                    <span className="label-text ml-sm">One-Time Ask</span> 
                  </label>
                  <label className="label cursor-pointer">
                    <input type="radio" name="radio-10" className="radio checked:bg-blue-500" checked />
                    <span className="label-text ml-sm">On-Going Need</span> 
                  </label>
                </div>
                <div className="card-actions justify-end my-md">
                  <button
                    className="btn btn-accent outline-none"
                  >
                        Submit <ArrowSmallRightIcon className="w-3 h-3 mt-0.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Voter */}
          <div className="card w-full bg-base-100 shadow-xl">
            <div className="card-body haf-card-body gap-0 p-0 grid md:grid-cols-[35%_65%]">
              <div className="haf-purple grid gap-5 p-md place-content-center bg-primary text-primary-content rounded-tl-2xl rounded-tr-2xl md:rounded-tr-none md:rounded-bl-2xl image-full">
                <figure><img src="./haf-logo-drop-shadow.svg" className="w-6/12 mx-auto max-w-lg" /></figure>
                <div className="text-lg">
                  <p className=" inline-flex">Location</p>
                  <span className="badge badge-md badge-accent badge-outline ml-sm inline-flex">USA</span>
                  <span className="badge badge-md badge-accent badge-outline ml-sm  inline-flex">Lahaina</span>
                  <span className="badge badge-md badge-accent badge-outline ml-sm  inline-flex">Maui</span>
                  <span className="badge badge-md badge-accent badge-outline ml-sm  inline-flex">96761</span>
                </div>
                <div className="text-lg">
                  <p className="inline-flex">Wallet</p>
                  <span className="inline-flex gap-4 m-sm"><Address address={TREASURY_WALLET} /></span>
                </div>
              </div>
              <div className="grid gap-5 p-md">
                <div className="card-header-wrapper place-self-center">
                  <div className="card-header max-w-lg">
                    <h2 className="card-title justify-center">Vote For A Fren</h2>
                    <p className="text-center max-w-lg justify-center">You must be a verifiable resident or business owner in the aforementioned area in order to successfully cast votes. Be sure to submit each proposal vote in order for it to count.</p>
                  </div>
                </div>
                <div className="grid lg:grid-cols-2 grid-flow-row gap-7 p-6 nested-card-wrapper">
                  <div className="form-control nested-card">
                    <div className="stat my-0 place-items-end">
                      <div className="stat-value">$20,000</div>
                      <div className="stat-desc">Asking</div>
                    </div>
                    <p className="small-text">Proposal 1</p>
                    <h3>Title</h3>
                    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed eleifend non sapien a condimentum. Nunc imperdiet lorem non massa lobortis dignissim. Nam at nibh iaculis, sagittis sem non, scelerisque tortor. Phasellus dictum lorem at felis fringilla efficitur sit amet a ante. Pellentesque at molestie velit, eu finibus sem.</p>
                    <div className="w-full flex flex-row justify-between">
                      <div className="max-w-xs">
                        <select className="select select-bordered">
                          <option disabled selected>Select</option>
                          <option>For</option>
                          <option>Against</option>
                          <option>Abstain</option>
                        </select>
                      </div>
                      <div className="card-actions">
                        <button
                          className="btn btn-accent"
                        >
                              Submit
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="form-control nested-card">
                    <div className="stat my-0 place-items-end">
                      <div className="stat-value">$50,000</div>
                      <div className="stat-desc">Asking</div>
                    </div>
                    <p className="small-text">Proposal 2</p>
                    <h3>Title</h3>
                    <p>Donec risus nunc, gravida quis congue et, convallis ut ipsum. In scelerisque dictum diam sit amet eleifend. Pellentesque non ipsum ac diam cursus aliquet non id est.</p>
                    <div className="w-full flex flex-row justify-between">
                      <div className="max-w-xs">
                        <select className="select select-bordered">
                          <option disabled selected>Select</option>
                          <option>For</option>
                          <option>Against</option>
                          <option>Abstain</option>
                        </select>
                      </div>
                      <div className="card-actions">
                        <button
                          className="btn btn-accent"
                        >
                              Submit
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="form-control nested-card">
                    <div className="stat my-0 place-items-end">
                      <div className="stat-value">Unlimited</div>
                      <div className="stat-desc">Asking</div>
                    </div>
                    <p className="small-text">Proposal 3</p>
                    <h3>Title</h3>
                    <p>Sed hendrerit porttitor ex a pulvinar. Pellentesque at accumsan nisi, eu commodo nibh. In ultrices, augue at bibendum mollis, neque eros aliquet est, vel ullamcorper ex neque ac magna.</p>
                    <div className="w-full flex flex-row justify-between">
                      <div className="max-w-xs">
                        <select className="select select-bordered">
                          <option disabled selected>Select</option>
                          <option>For</option>
                          <option>Against</option>
                          <option>Abstain</option>
                        </select>
                      </div>
                      <div className="card-actions">
                        <button
                          className="btn btn-accent"
                        >
                              Submit
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Results */}
          <div className="card w-full bg-base-100 shadow-xl">
            <div className="card-body haf-card-body gap-0 p-0 grid md:grid-cols-[35%_65%]">
              <div className="haf-purple grid gap-5 p-md place-content-center bg-primary text-primary-content rounded-tl-2xl rounded-tr-2xl md:rounded-tr-none md:rounded-bl-2xl image-full">
                <figure><img src="./haf-logo-drop-shadow.svg" className="w-6/12 mx-auto max-w-lg" /></figure>
                <div className="text-lg">
                  <p className=" inline-flex">Location</p>
                  <span className="badge badge-md badge-accent badge-outline ml-sm inline-flex">USA</span>
                  <span className="badge badge-md badge-accent badge-outline ml-sm  inline-flex">Lahaina</span>
                  <span className="badge badge-md badge-accent badge-outline ml-sm  inline-flex">Maui</span>
                  <span className="badge badge-md badge-accent badge-outline ml-sm  inline-flex">96761</span>
                </div>
                <div className="text-lg">
                  <p className="inline-flex">Wallet</p>
                  <span className="inline-flex gap-4 m-sm"><Address address={TREASURY_WALLET} /></span>
                </div>
              </div>
              <div className="grid gap-5 p-md">
                <div className="card-header-wrapper place-self-center">
                  <div className="card-header max-w-lg">
                    <h2 className="card-title justify-center">Results</h2>
                    <p className="text-center max-w-lg justify-center">You must be a verifiable resident or business owner in the aforementioned area in order to successfully cast votes. Be sure to submit each proposal vote in order for it to count.</p>
                  </div>
                </div>
                <div className="grid lg:grid-cols-2 grid-flow-row gap-7 p-6 nested-card-wrapper">
                  <div className="form-control nested-card bg-light">
                    <div className="stat my-0 place-items-end">
                      <div className="stat-value text-accent">$20,000</div>
                      <div className="stat-desc">Asking</div>
                    </div>
                    <p className="small-text">Proposal 1</p>
                    <h3 className="text-accent">Title</h3>
                    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed eleifend non sapien a condimentum. Nunc imperdiet lorem non massa lobortis dignissim. Nam at nibh iaculis, sagittis sem non, scelerisque tortor. Phasellus dictum lorem at felis fringilla efficitur sit amet a ante. Pellentesque at molestie velit, eu finibus sem.</p>
                    <div className="w-full text-center">
                      <p className="inline-flex text-accent">Approved and Sent</p>
                      <a href={`https://mumbai.polygonscan.com/address/${TEST_WALLET}`} target="_blank"><img src="./assets/icon-open-browser.svg" className="w-4 ml-sm inline-flex" /></a>
                    </div>
                  </div>
                  <div className="form-control nested-card">
                    <div className="stat my-0 place-items-end">
                      <div className="stat-value text-accent">$50,000</div>
                      <div className="stat-desc">Asking</div>
                    </div>
                    <p className="small-text">Proposal 2</p>
                    <h3 className="text-accent">Title</h3>
                    <p>Donec risus nunc, gravida quis congue et, convallis ut ipsum. In scelerisque dictum diam sit amet eleifend. Pellentesque non ipsum ac diam cursus aliquet non id est.</p>
                    <div className="w-full flex flex-row text-center">
                      <p>Active</p>
                    </div>
                  </div>
                  <div className="form-control nested-card">
                    <div className="stat my-0 place-items-end">
                      <div className="stat-value text-accent">Unlimited</div>
                      <div className="stat-desc">Asking</div>
                    </div>
                    <p className="small-text">Proposal 3</p>
                    <h3 className="text-accent">Title</h3>
                    <p>Sed hendrerit porttitor ex a pulvinar. Pellentesque at accumsan nisi, eu commodo nibh. In ultrices, augue at bibendum mollis, neque eros aliquet est, vel ullamcorper ex neque ac magna.</p>
                    <div className="w-full flex flex-row text-center">
                      <p>Active</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ExampleUI;
