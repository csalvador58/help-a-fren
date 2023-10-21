import Image from "next/image";
import HafCardWrap from "~~/components/help-a-fren/haf-card-wrap";
import { Address, Balance } from "~~/components/scaffold-eth";
import { TEST_WALLET, TREASURY_WALLET } from "~~/utils/constants";

const ResultsTest = () => {
  const voteHandler = (e: any) => {
    console.log("vote opt", e.target.id);
    // setVoteOptions()
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
                <h2 className="card-title justify-center">Results</h2>
                <p className="text-center max-w-lg justify-center">
                  You must be a verifiable resident or business owner in the aforementioned area in order to
                  successfully cast votes. Be sure to submit each proposal vote in order for it to count.
                </p>
              </div>
            </div>
            <div className="grid lg:grid-cols-2 grid-flow-row gap-7 p-6 nested-card-wrapper">
              <div className="form-control nested-card place-content-between bg-light">
                <div>
                  <div className="stat my-0 place-items-end">
                    <div className="stat-value text-accent">$20,000</div>
                    <div className="stat-desc">Asking</div>
                  </div>
                  <p className="small-text">Proposal 1</p>
                  <h3 className="text-accent">Title</h3>
                  <p>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed eleifend non sapien a condimentum. Nunc
                    imperdiet lorem non massa lobortis dignissim. Nam at nibh iaculis, sagittis sem non, scelerisque
                    tortor. Phasellus dictum lorem at felis fringilla efficitur sit amet a ante. Pellentesque at
                    molestie velit, eu finibus sem.
                  </p>
                </div>
                <div className="w-full text-center">
                  <p className="inline-flex text-accent">Approved and Sent</p>
                  <a href={`https://mumbai.polygonscan.com/address/${TEST_WALLET}`} target="_blank" rel="noreferrer">
                    <img src="/assets/icon-open-browser.svg" className="w-4 ml-sm inline-flex" />
                  </a>
                </div>
              </div>
              <div className="form-control nested-card place-content-between">
                <div>
                  <div className="stat my-0 place-items-end">
                    <div className="stat-value text-accent">$50,000</div>
                    <div className="stat-desc">Asking</div>
                  </div>
                  <p className="small-text">Proposal 2</p>
                  <h3 className="text-accent">Title</h3>
                  <p>
                    Donec risus nunc, gravida quis congue et, convallis ut ipsum. In scelerisque dictum diam sit amet
                    eleifend. Pellentesque non ipsum ac diam cursus aliquet non id est.
                  </p>
                </div>
                <div className="w-full flex flex-row text-center">
                  <p>Active</p>
                </div>
              </div>
              <div className="form-control nested-card place-content-between">
                <div>
                  <div className="stat my-0 place-items-end">
                    <div className="stat-value text-accent">Unlimited</div>
                    <div className="stat-desc">Asking</div>
                  </div>
                  <p className="small-text">Proposal 3</p>
                  <h3 className="text-accent">Title</h3>
                  <p>
                    Sed hendrerit porttitor ex a pulvinar. Pellentesque at accumsan nisi, eu commodo nibh. In ultrices,
                    augue at bibendum mollis, neque eros aliquet est, vel ullamcorper ex neque ac magna.
                  </p>
                </div>
                <div className="w-full flex flex-row text-center">
                  <p>Active</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </HafCardWrap>
  );
};
export default ResultsTest;
