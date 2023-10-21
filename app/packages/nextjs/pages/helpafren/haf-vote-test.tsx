import { Key, use, useEffect, useState } from "react";
import Image from "next/image";
import HafCardWrap from "~~/components/help-a-fren/haf-card-wrap";
import { HafIDFormat } from "~~/components/help-a-fren/haf-id-format";
import { getAllProposals } from "~~/components/help-a-fren/utils/getAllProposals";
import { Address, Balance } from "~~/components/scaffold-eth";
import { PROJECT_PRICE_MULTIPLIER, TREASURY_WALLET } from "~~/utils/constants";

type ProposalDetails = {
  proposalId: string;
  description: Description;
  external_url: string;
  image: string;
};

type Description = {
  submitter: string;
  wallet: string;
  title: string;
  recipient: string;
  reason: string;
  use: string;
  amount: string;
};

const VoteForAFrenTest = () => {
  const [proposals, setProposals] = useState<ProposalDetails[]>([]);
  const [voteOptions, setVoteOptions] = useState<{ [key: string]: string }>({});

  const onVoteChangeHandler = (proposalId: string, selectedVote: string) => {
    // console.log("voteOptions", voteOptions);
    setVoteOptions(previousState => {
      return { ...previousState, [proposalId]: String(selectedVote) };
    });
    // Object.entries(voteOptions).forEach(([id, selectedVote]) => {
    //   if (id === proposalId) {
    //     console.log(`Proposal ID: ${id}, was changed to => Selected Vote: ${selectedVote}`);
    //   }
    // });
  };

  const submitVoteHandler = (proposalId: string) => {
    console.log("submitVoteHandler", proposalId);
  };

  useEffect(() => {
    const getProposals = async () => {
      const proposalsFromRegistry = await getAllProposals();

      const proposals = await proposalsFromRegistry.map(async (proposal: any) => {
        // fetch proposal data from ipfs
        const data = await fetch(proposal[1]);
        const proposalMetadata = await data.json();
        console.log("proposalMetaData", proposalMetadata);

        return proposalMetadata;
      });
      const resolvedProposals = await Promise.all(proposals);
      setProposals(resolvedProposals);
    };
    getProposals();
  }, []);

  return (
    <HafCardWrap>
      <div className="card w-full bg-base-100 shadow-xl">
        <div className="card-body haf-card-body gap-0 p-0 grid md:grid-cols-[35%_65%]">
          <div className="haf-purple grid gap-5 p-md place-content-center bg-primary text-primary-content rounded-tl-2xl rounded-tr-2xl md:rounded-tr-none md:rounded-bl-2xl image-full">
            <figure>
              {/* <img src="/haf-logo-drop-shadow.svg" className="w-6/12 mx-auto max-w-lg" /> */}
              <Image src="/haf-logo-drop-shadow.svg" alt="Help-A-Fren Logo" width={350} height={350} />
            </figure>
            <div className="donation-details">
              <div className="text-lg">
                <p className=" inline-flex">Location</p>
                <span className="badge badge-md badge-accent badge-outline ml-sm inline-flex">USA</span>
                <span className="badge badge-md badge-accent badge-outline ml-sm  inline-flex">Lahaina</span>
                <span className="badge badge-md badge-accent badge-outline ml-sm  inline-flex">Maui</span>
                <span className="badge badge-md badge-accent badge-outline ml-sm  inline-flex">96761</span>
              </div>
              <div className="text-lg">
                <p className="inline-flex">Treasury Wallet</p>
                <span className="inline-flex gap-4 m-sm">
                  <Address address={TREASURY_WALLET} />
                </span>
              </div>
              <div className="text-lg -mt-lg">
                <p className="inline-flex">Balance</p>
                <span className="inline-flex gap-4 m-sm">
                  <Balance address={TREASURY_WALLET} className="min-h-0 h-auto" />
                </span>
              </div>
            </div>
          </div>
          <div className="grid gap-5 p-md">
            <div className="card-header-wrapper place-self-center">
              <div className="card-header max-w-lg">
                <h2 className="card-title justify-center">Vote For A Fren</h2>
                <p className="text-center max-w-lg justify-center">
                  You must be a verifiable resident or business owner in the aforementioned area in order to
                  successfully cast votes. Be sure to submit each proposal vote in order for it to count.
                </p>
              </div>
            </div>
            <div className="grid lg:grid-cols-2 grid-flow-row gap-7 p-6 nested-card-wrapper">
              {proposals &&
                proposals.map((item: ProposalDetails) => (
                  <div key={item.proposalId} className="form-control nested-card place-content-between">
                    <div>
                      <div className="stat my-0 place-items-end">
                        <div className="stat-value text-accent">{`$${
                          +item.description.amount * PROJECT_PRICE_MULTIPLIER
                        }`}</div>
                        <div className="stat-desc">Asking</div>
                      </div>
                      <div className="text-lg">
                        <p className="small-text inline-flex">Proposal ID: </p>
                        <span className="inline-flex gap-4 m-sm">
                          <HafIDFormat address={item.proposalId} />
                        </span>
                      </div>
                      <h3 className="text-accent">{item.description.title || "Not Available"}</h3>

                      <p className="inline-flex">Recipient Name: {item.description.recipient}</p>

                      <div className="text-lg">
                        <p className="inline-flex">Recipient Address: </p>
                        <span className="inline-flex gap-4 m-sm">
                          <Address address={item.description.wallet} />
                        </span>
                      </div>
                      <p>Reason: {item.description.reason}</p>
                      <p>Plan: {item.description.use}</p>
                    </div>
                    <div className="w-full flex flex-row justify-between">
                      <div className="max-w-xs">
                        <select
                          className="select select-bordered"
                          value={voteOptions[item.proposalId] || ""}
                          onChange={e => onVoteChangeHandler(item.proposalId, e.target.value)}
                        >
                          <option id="no-vote" value="" disabled selected>
                            Select
                          </option>
                          <option id="for-vote" value="1">
                            For
                          </option>
                          <option id="ag-vote" value="0">
                            Against
                          </option>
                          <option id="ab-vote" value="2">
                            Abstain
                          </option>
                        </select>
                      </div>
                      <div className="card-actions">
                        <button className="btn btn-accent" onClick={() => submitVoteHandler(item.proposalId)}>
                          Submit
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </HafCardWrap>
  );
};
export default VoteForAFrenTest;
