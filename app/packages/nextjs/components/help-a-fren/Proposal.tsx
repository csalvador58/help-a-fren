import { useState } from "react";
import { NFT_IMAGE_CID } from "../../utils/constants";
import { MagicLogin } from "./utils/MagicLogin";
import { Metadata, uploadMetadata } from "./utils/uploadToIPFS";
import { RPCError, RPCErrorCode } from "magic-sdk";
import { ArrowSmallRightIcon } from "@heroicons/react/24/outline";

type ProposalProps = {
  submitter?: string;
  setSubmitter: (submitter: string) => void;
  wallet?: string;
  setWallet: (wallet: string) => void;
  title?: string;
  setTitle: (title: string) => void;
  recipient?: string;
  setRecipient: (recipient: string) => void;
  reason?: string;
  setReason: (amount: string) => void;
  use?: string;
  setUse: (use: string) => void;
  amount?: string;
  setAmount: (amount: string) => void;
};

const HafProposal = ({
  submitter,
  setSubmitter,
  wallet,
  setWallet,
  title,
  setTitle,
  recipient,
  setRecipient,
  amount,
  setAmount,
  use,
  setUse,
  reason,
  setReason,
}: ProposalProps) => {
  const [isMagicActive, setMagicActive] = useState(false);
  const submitProposalHandler = async () => {
    alert(`
    Name: ${submitter}
    Wallet: ${wallet}
    Title: ${title}
    Recipient: ${recipient}
    Reason: ${reason}
    Use: ${use}
    Amount: ${amount}
    `);

    const magic = await MagicLogin(true);
    console.log(magic);
    setMagicActive(true);

    // const ipfsHash = await uploadMetadata({
    //   proposalId: "123",
    //   description: {
    //     submitter: submitter,
    //     wallet: wallet,
    //     title: title,
    //     recipient: recipient,
    //     reason: reason,
    //     use: use,
    //     amount: amount,
    //   },
    //   external_url: "https://help-a-fren.org",
    //   imageCID: NFT_IMAGE_CID,
    // } as Metadata);

    setSubmitter("");
    setWallet("");
    setTitle("");
    setRecipient("");
    setReason("");
    setUse("");
    setAmount("");
  };

  const logInMagic = async () => {
    const magic = await MagicLogin(true);
    console.log(magic);
    setMagicActive(true);
  };
  const logoutMagic = async () => {
    const magic = await MagicLogin(false);
    if (magic) {
      await magic.user.logout();
    }
    setMagicActive(false);
  };
  return (
    <div className="card w-full bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Proposal Form</h2>
        <p>
          Message from organizer Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed eleifend non sapien a
          condimentum. Nunc imperdiet lorem non massa lobortis dignissim. Nam at nibh iaculis, sagittis sem non,
          scelerisque tortor.
        </p>
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
          />
        </div>
        <div className="form-control">
          <label className="label">
            <span className="label-text">How will the money be used?</span>
          </label>
          <textarea className="textarea textarea-bordered h-24" value={use} onChange={e => setUse(e.target.value)} />
        </div>
        <div className="form-control w-full">
          <label className="label">
            <span className="label-text">Amount seeking</span>
          </label>
          <input
            type="text"
            placeholder="$"
            className="input input-bordered w-full max-w-xs"
            value={amount}
            onChange={e => setAmount(e.target.value)}
          />
        </div>
        <div className="form-control">
          <label className="label cursor-pointer">
            <span className="label-text">One-Time Ask</span>
            <input type="radio" name="radio-10" className="radio checked:bg-blue-500" checked />
          </label>
        </div>
        <div className="form-control">
          <label className="label cursor-pointer">
            <span className="label-text">On-Going Need</span>
            <input type="radio" name="radio-10" className="radio checked:bg-blue-500" checked />
          </label>
        </div>
        <div className="card-actions justify-end">
          <button className="btn btn-accent" onClick={submitProposalHandler}>
            Submit <ArrowSmallRightIcon className="w-3 h-3 mt-0.5" />
          </button>
          <button className="btn btn-accent" onClick={logInMagic}>
            logInMagic <ArrowSmallRightIcon className="w-3 h-3 mt-0.5" />
          </button>
          <button className="btn btn-accent" onClick={logoutMagic}>
            logOutMagic <ArrowSmallRightIcon className="w-3 h-3 mt-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default HafProposal;
