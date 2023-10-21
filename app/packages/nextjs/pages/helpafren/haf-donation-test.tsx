import Image from "next/image";
import HafCardWrap from "~~/components/help-a-fren/haf-card-wrap";
import { Address } from "~~/components/scaffold-eth";
import { TREASURY_WALLET } from "~~/utils/constants";

interface IDonationDetails {
  btnActive: string | null;
}

interface IDonationProps extends IDonationDetails {
  setBtnActive: (button: string | null) => void;
}

const DonationTest = ({ btnActive, setBtnActive }: IDonationProps) => {
  const setBtnActiveHandler = (button: any) => {
    setBtnActive(button.target.id);
  };
  console.log("Working", btnActive);
  const buttons = [
    { id: 1, text: `$25`, value: 25 },
    { id: 2, text: `$50`, value: 50 },
    { id: 3, text: `$100`, value: 100 },
    { id: 4, text: `$500`, value: 500 },
    { id: 5, text: `Other`, value: 0 },
  ];
  return (
    <HafCardWrap>
      <div className="card w-full bg-base-100 shadow-xl">
        <div className="card-body haf-card-body gap-0 p-0 grid md:grid-cols-[55%_45%]">
          <div className="haf-purple grid gap-5 p-md place-content-center bg-primary text-primary-content rounded-tl-2xl rounded-tr-2xl md:rounded-tr-none md:rounded-bl-2xl image-full">
            <figure>
              {/* <img src="./haf-logo-drop-shadow.svg" className="w-6/12 mx-auto max-w-lg" /> */}
              <Image src="/haf-logo-drop-shadow.svg" alt="Help-A-Fren Logo" width={350} height={350} />
            </figure>
          </div>
          <div className="grid gap-5 p-md">
            <div className="card-header-wrapper place-self-center">
              <div className="card-header max-w-lg">
                <h2 className="card-title justify-center">Donations</h2>
                <p className="text-center max-w-lg justify-center">
                  The fires in West Maui have devastated Lahaina and surrounding communities. Please Help-A-Fren and
                  consider donating to this historical piece of Hawaiian history. Your generosity will go towards
                  helping the local residents begin to rebuild their lives.
                </p>
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
                <span className="inline-flex gap-4 m-sm">
                  <Address address={TREASURY_WALLET} />
                </span>
              </div>
            </div>
            <div className="card-actions my-md grid grid-cols-2 gap-6">
              {buttons.map(button => (
                <button
                  key={button.id}
                  id={button.id.toString()}
                  className={
                    btnActive == button.id
                      ? `btn btn-success outline-none text-accent shadow-xl`
                      : "btn btn-neutral outline-none text-accent shadow-xl"
                  }
                  onClick={e => setBtnActiveHandler(e)}
                  value={button.value}
                >
                  {button.text}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </HafCardWrap>
  );
};
export default DonationTest;
