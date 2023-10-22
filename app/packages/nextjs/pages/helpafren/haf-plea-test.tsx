import { useState } from "react";
import Image from "next/image";
import HafCardWrap from "~~/components/help-a-fren/haf-card-wrap";
import { Address, Balance } from "~~/components/scaffold-eth";
import { TREASURY_WALLET } from "~~/utils/constants";

interface IPleaDetails {
  pleaReason: string;
  pleaUse: string;
  pleaMessage: string;
}

interface IPleaProps extends IPleaDetails {
  setPleaReason: (Reason: string) => void;
  setPleaUse: (use: string) => void;
  setPleaMessage: (message: string) => void;
  setForProposalForm: (message: string) => void;
}

const PleaTest = ({
  pleaReason,
  pleaUse,
  pleaMessage,
  setPleaReason,
  setPleaUse,
  setPleaMessage,
  setForProposalForm,
}: IPleaProps) => {
  const [isRadio1Checked, setIsRadio1Checked] = useState(true);
  const [isRadio2Checked, setIsRadio2Checked] = useState(false);

  const handleRadioChange = () => {
    setIsRadio1Checked(!isRadio1Checked);
    setIsRadio2Checked(!isRadio2Checked);
  };

  const submitHandler = () => {
    setForProposalForm(pleaMessage);
    setPleaReason("");
    setPleaUse("");
    setPleaMessage("");
  };

  return (
    <HafCardWrap>
      <div className="card w-full bg-base-100 shadow-xl">
        <div className="card-body haf-card-body gap-0 p-0 grid md:grid-cols-[35%_65%]">
          <div className="haf-purple grid gap-5 p-xl place-content-center bg-primary text-primary-content rounded-tl-2xl rounded-tr-2xl md:rounded-tr-none md:rounded-bl-2xl image-full justify-center">
            <figure>
              <Image src="/haf-logo-drop-shadow.svg" alt="Help-A-Fren Logo" width={325} height={237} />
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
                <span className="inline-flex m-xs">
                  <Balance address={TREASURY_WALLET} className="min-h-0 h-auto" />
                </span>
              </div>
            </div>
          </div>
          <div className="grid gap-5 p-md">
            <div className="card-header-wrapper place-self-center">
              <div className="card-header max-w-lg">
                <h2 className="card-title justify-center">Plea For Help</h2>
                <p className="text-center max-w-lg justify-center">
                  Fill out each field to initiate and activate Help-A-Fren.
                </p>
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
                value={pleaReason}
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
                value={pleaUse}
                onChange={e => setPleaUse(e.target.value)}
              />
            </div>
            <div className="form-control w-fit flex-row">
              <label className="label cursor-pointer">
                <input
                  type="radio"
                  value="one-time"
                  name="radio-10"
                  className="radio checked:bg-blue-500"
                  checked={isRadio1Checked}
                  onChange={handleRadioChange}
                />
                <span className="label-text ml-sm">One-Time Campaign</span>
              </label>
              <label className="label cursor-pointer">
                <input
                  type="radio"
                  value="on-going"
                  name="radio-10"
                  className="radio checked:bg-blue-500"
                  checked={!isRadio2Checked}
                  onChange={handleRadioChange}
                />
                <span className="label-text ml-sm">On-Going Campaign</span>
              </label>
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Message prompt to display on Proposal form</span>
              </label>
              <textarea
                className="textarea textarea-bordered h-24"
                placeholder="Information or instructions you would like proposers to know..."
                value={pleaMessage}
                onChange={e => setPleaMessage(e.target.value)}
              ></textarea>
            </div>
            <div className="card-actions justify-end my-md">
              <button onClick={submitHandler} className="btn btn-accent outline-none">
                Submit
              </button>
            </div>
          </div>
        </div>
      </div>
    </HafCardWrap>
  );
};
export default PleaTest;
