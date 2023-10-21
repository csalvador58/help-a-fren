import { useState } from "react";
import Image from "next/image";
import HafCardWrap from "~~/components/help-a-fren/haf-card-wrap";
import { Address } from "~~/components/scaffold-eth";
import { TREASURY_WALLET } from "~~/utils/constants";

interface IProposalDetails {
  submitter: string;
  wallet: string;
  title: string;
  recipient: string;
  reason: string;
  use: string;
  amount: string;
  pleaMessage: string;
}

interface IProposalProps extends IProposalDetails {
  setSubmitter: (submitter: string) => void;
  setWallet: (wallet: string) => void;
  setTitle: (title: string) => void;
  setRecipient: (recipient: string) => void;
  setReason: (Reason: string) => void;
  setUse: (use: string) => void;
  setAmount: (amount: string) => void;
}

const ProposalTest = ({
  submitter,
  wallet,
  title,
  recipient,
  reason,
  use,
  amount,
  pleaMessage,
  setSubmitter,
  setWallet,
  setTitle,
  setRecipient,
  setReason,
  setUse,
  setAmount,
}: IProposalProps) => {
  const [isChecked, setIsChecked] = useState(false);

  const handleRadioChange = () => {
    setIsChecked(!isChecked);
  };

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
                <p className="inline-flex">Wallet</p>
                <span className="inline-flex gap-4 m-sm">
                  <Address address={TREASURY_WALLET} />
                </span>
              </div>
            </div>
            <div className="text-lg">
              <h4 className="mt-lg">A message from the organizer:</h4>
              <p>{pleaMessage}</p>
            </div>
          </div>
          <div className="grid gap-5 p-md">
            <div className="card-header-wrapper place-self-center">
              <div className="card-header max-w-lg">
                <h2 className="card-title justify-center">Proposal Form</h2>
                <p className="text-center max-w-lg justify-center">
                  You must be a verifiable resident or business owner in the aforementioned area in order to
                  successfully submit a proposal.
                </p>
              </div>
            </div>
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">Name</span>
              </label>
              <input
                type="text"
                placeholder="Jane Doe"
                className="input input-bordered w-full max-w-xs"
                value={submitter}
                onChange={e => setSubmitter(e.target.value)}
              />
            </div>
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">Wallet address funds should be sent to?</span>
              </label>
              <input
                type="text"
                placeholder="0x..."
                className="input input-bordered w-full max-w-xs"
                value={wallet}
                onChange={e => setWallet(e.target.value)}
              />
            </div>
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">Title, name, or descriptor to refer to proposal as</span>
              </label>
              <input
                type="text"
                placeholder="Park Clean Up"
                className="input input-bordered w-full max-w-xs"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">Who will be the recipent of any approved funds?</span>
              </label>
              <input
                type="text"
                placeholder="Green Park clean up group"
                className="input input-bordered w-full max-w-xs"
                value={recipient}
                onChange={e => setRecipient(e.target.value)}
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Reason for proposal?</span>
              </label>
              <textarea
                className="textarea textarea-bordered h-24"
                value={reason}
                onChange={e => setReason(e.target.value)}
              ></textarea>
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">How will the money be used?</span>
              </label>
              <textarea
                className="textarea textarea-bordered h-24"
                value={use}
                onChange={e => setUse(e.target.value)}
              ></textarea>
            </div>
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">Amount seeking</span>
              </label>
              <input
                type="text"
                placeholder="$"
                className="input input-bordered w-44 max-w-xs"
                value={amount}
                onChange={e => setAmount(e.target.value)}
              />
            </div>
            <div className="form-control w-fit flex-row">
              <label className="label cursor-pointer">
                <input
                  id="one-time"
                  type="radio"
                  name="radio-10"
                  className="radio checked:bg-blue-500"
                  checked={!isChecked}
                  onChange={handleRadioChange}
                />
                <span className="label-text ml-sm">One-Time Ask</span>
              </label>
              <label className="label cursor-pointer">
                <input
                  id="on-going"
                  type="radio"
                  name="radio-10"
                  className="radio checked:bg-blue-500"
                  checked={isChecked}
                  onChange={handleRadioChange}
                />
                <span className="label-text ml-sm">On-Going Need</span>
              </label>
            </div>
            <div className="card-actions justify-end my-md">
              <button className="btn btn-accent outline-none">Submit</button>
            </div>
          </div>
        </div>
      </div>
    </HafCardWrap>
  );
};
export default ProposalTest;
