import { ChangeEvent, useState } from "react";
import Image from "next/image";
import {
  HAF_GOVERNOR_ADDRESS,
  HAF_PROPOSAL_REGISTRY_ADDRESS,
  HAF_TREASURY_ADDRESS,
} from "../../../hardhat/utils/constants";
import hafGovAbi from "../../components/help-a-fren/abi/hafGovAbi.json";
import hafProposalRegistryAbi from "../../components/help-a-fren/abi/hafProposalRegistryAbi.json";
import hafTreasuryAbi from "../../components/help-a-fren/abi/hafTreasuryAbi.json";
import { BiconomySmartAccount } from "../../components/help-a-fren/utils/BiconomySA";
import { MagicLogin } from "../../components/help-a-fren/utils/MagicLogin";
import { getProposalIdFromTx } from "../../components/help-a-fren/utils/getProposalIdFromTx";
import { Metadata, uploadMetadata } from "../../components/help-a-fren/utils/uploadToIPFS";
import { NFT_IMAGE_CID, PROJECT_PRICE_MULTIPLIER } from "../../utils/constants";
import { UserOperation } from "@biconomy/core-types";
import {
  BiconomyPaymaster,
  IHybridPaymaster,
  IPaymaster,
  PaymasterMode,
  SponsorUserOperationDto,
} from "@biconomy/paymaster";
import { ethers } from "ethers";
import { toast } from "react-toastify";
import { ArrowSmallRightIcon } from "@heroicons/react/24/outline";
import HafCardWrap from "~~/components/help-a-fren/haf-card-wrap";
import { Address, Balance } from "~~/components/scaffold-eth";
import { useAccountBalance } from "~~/hooks/scaffold-eth";
import { TREASURY_WALLET } from "~~/utils/constants";

interface IProposalDetails {
  submitter: string;
  wallet: string;
  title: string;
  recipient: string;
  reason: string;
  use: string;
  amount: string;
  pleaMessage?: string;
  forProposalForm?: string;
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
  forProposalForm,
}: IProposalProps) => {
  const [isMagicActive, setMagicActive] = useState(false);
  const [isRadio1Checked, setIsRadio1Checked] = useState(true);
  const [isRadio2Checked, setIsRadio2Checked] = useState(false);
  // const { balance, price, isError, isLoading, onToggleBalance, isEthBalance } = useAccountBalance(HAF_TREASURY_ADDRESS);

  const handleRadioChange = () => {
    setIsRadio1Checked(!isRadio1Checked);
    setIsRadio2Checked(!isRadio2Checked);
  };

  // ==========================================================
  // Submit Proposal
  // ==========================================================
  const submitProposalHandler = async () => {
    // Validate form
    if (!submitter || !wallet || !title || !recipient || !reason || !use || !amount) {
      alert("Please fill out all fields.");
      return;
    }

    // User confirms proposal details
    if (
      !confirm(`
      Name: ${submitter}
      Wallet: ${wallet}
      Title: ${title}
      Recipient: ${recipient}
      Reason: ${reason}
      Use: ${use}
      Amount: ${amount}
      `)
    ) {
      return;
    }
    try {
      await toast.promise(
        proceedWithAATransactions(),
        {
          pending: "Submitting Proposal",
          success: "Proposal Successfully submitted!",
          error: "Proposal submittal failed, please try again.",
        },
        {
          position: "top-right",
          autoClose: false,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        },
      );

      async function proceedWithAATransactions() {
        // Setup deployer signer
        const alchemyProvider = new ethers.providers.AlchemyProvider(
          "maticmum",
          process.env.NEXT_PUBLIC_ALCHEMY_KEY || "2olqx6rQSWK3TThRmPvylRkNPbD0dDNj",
        );
        const deployer_alchemy = new ethers.Wallet(process.env.NEXT_PUBLIC_DEPLOYER_PK!, alchemyProvider);
        console.log("**** deployer: ", deployer_alchemy.address);

        // Validate Recipient address
        console.log("**** wallet: ", wallet);
        const recipientAddress = ethers.utils.getAddress(wallet);
        const validRecipient = ethers.utils.isAddress(recipientAddress);
        if (!validRecipient) {
          alert("Please enter a valid recipient address.");
          return;
        }

        // hash proposal details
        const encodeData = (data: IProposalDetails) => {
          const abiCoder = new ethers.utils.AbiCoder();
          const types = ["string", "string", "string", "string", "string", "string"];
          const values = [data.submitter, data.wallet, data.title, data.recipient, data.reason, data.use];
          return abiCoder.encode(types, values);
        };

        // converted amount to Project's Price Multiplier
        const amountConverted = (+amount / PROJECT_PRICE_MULTIPLIER).toString();
        console.log("**** amount converted to project's token multiple: ", amountConverted);
        const proposalDetails: IProposalDetails = {
          submitter: submitter,
          wallet: wallet,
          title: title,
          recipient: recipient,
          reason: reason,
          use: use,
          amount: amountConverted,
        };

        const encodedProposalDetails = encodeData(proposalDetails);
        console.log("**** encodedProposalDetails: ", encodedProposalDetails);
        // convert to bytes
        const hashedProposalDetails = ethers.utils.keccak256(encodedProposalDetails);
        console.log("**** hashedProposalDetails: ", hashedProposalDetails);

        // ==========================================================
        // Setup Biconnomy Smart Account with Magic signer
        // ==========================================================
        // Get magic instance
        const magic = await MagicLogin(true);
        setMagicActive(true);

        // Setup Biconomy Smart Account
        if (!magic) {
          console.log("Error during log in, try again.");
          setMagicActive(false);
          return;
        }
        const biconomySmartAccount = await BiconomySmartAccount(magic.rpcProvider, false);
        const biconomyAccountAddress = await biconomySmartAccount?.getAccountAddress();
        console.log("**** biconomyAccountAddress: ", biconomyAccountAddress);

        // Setup Biconomy user operations
        //   const grantAmount = ethers.BigNumber.from(amount);
        const grantAmount = ethers.utils.parseEther(amountConverted || "0");
        const web3Provider = new ethers.providers.Web3Provider(magic.rpcProvider as any);

        // Call data for grant withdraw to include with governor proposal
        const deployer_magic = new ethers.Wallet(process.env.NEXT_PUBLIC_DEPLOYER_PK!, web3Provider);
        console.log("**** deployer: ", deployer_alchemy.address);
        const hafTreasuryContract = new ethers.Contract(HAF_TREASURY_ADDRESS, hafTreasuryAbi, deployer_magic);
        const withdrawCallData = hafTreasuryContract.interface.encodeFunctionData("withdraw", [
          recipientAddress,
          grantAmount,
        ]);

        // Call data for proposal submittal to include with Biconomy paymaster
        const HelpAFrenGovContract = new ethers.Contract(HAF_GOVERNOR_ADDRESS, hafGovAbi, web3Provider);
        const submitProposalCallData = HelpAFrenGovContract.interface.encodeFunctionData("propose", [
          [HAF_TREASURY_ADDRESS],
          [0],
          [withdrawCallData],
          hashedProposalDetails,
        ]);

        // Create transactions
        const tx_submitProposalToGovernor = {
          to: HAF_GOVERNOR_ADDRESS,
          data: submitProposalCallData,
        };

        if (!biconomySmartAccount) {
          console.log("Missing Biconomy smart account.");
          return;
        }
        console.log("Building user op...");
        const partialUserOp: Partial<UserOperation> = await biconomySmartAccount.buildUserOp([
          tx_submitProposalToGovernor,
        ]);
        console.log("**** partialUserOp: ");
        console.log(partialUserOp);
        const BiconomyPaymaster = biconomySmartAccount.paymaster as IHybridPaymaster<SponsorUserOperationDto>;

        const paymasterServiceData: SponsorUserOperationDto = {
          mode: PaymasterMode.SPONSORED,
          smartAccountInfo: {
            name: "BICONOMY",
            version: "2.0.0",
          },
          // optional params...
        };

        console.log("Getting paymaster and data...");
        const paymasterAndDataResponse = await BiconomyPaymaster.getPaymasterAndData(
          partialUserOp,
          paymasterServiceData,
        );
        partialUserOp.paymasterAndData = paymasterAndDataResponse.paymasterAndData;

        console.log("**** partialUserOp.paymasterAndData: ");
        console.log(partialUserOp.paymasterAndData);

        const userOpResponse = await biconomySmartAccount.sendUserOp(partialUserOp);
        console.log("**** userOpResponse: ");
        console.log(userOpResponse);
        const transactionDetails = await userOpResponse.wait();

        console.log("**** transactionDetails: ");
        console.log(transactionDetails);

        console.log("**** transactionDetails.receipt.transactionHash: ");
        console.log(transactionDetails.receipt?.transactionHash);

        // Create Token Id
        // Get proposal Id from transaction hash
        const proposalId = (
          await getProposalIdFromTx(transactionDetails.receipt?.transactionHash, hafGovAbi, "ProposalCreated")
        )?.toString();
        if (!proposalId) {
          console.log("Error getting proposal ID.");
          return;
        }
        console.log("**** proposalId: ", proposalId);

        // ==========================================================
        // Store Proposal details in Proposal Registry
        // ==========================================================

        // Upload metadata to IPFS and get CID
        const proposalURI = await uploadMetadata({
          proposalId: proposalId,
          description: {
            submitter: submitter,
            wallet: wallet,
            title: title,
            recipient: recipient,
            reason: reason,
            use: use,
            amount: amount,
          },
          external_url: "help-a-fren",
          imageCID: NFT_IMAGE_CID,
        } as Metadata);

        // Setup Biconomy user operations for storing proposal details
        // Call data for storing proposal details to include with Biconomy paymaster
        const HelpAFrenProposalRegistryContract = new ethers.Contract(
          HAF_PROPOSAL_REGISTRY_ADDRESS,
          hafProposalRegistryAbi,
          alchemyProvider,
        );
        // Proposal contract Requires DEFAULT_ADMIN_ROLE
        const storeProposalCallData = HelpAFrenProposalRegistryContract.interface.encodeFunctionData("addProposal", [
          proposalId,
          `https://ipfs.io/ipfs/${proposalURI}`,
          biconomyAccountAddress,
        ]);

        // Create transactions
        const tx_storeProposalDetailsInRegistry = {
          to: HAF_PROPOSAL_REGISTRY_ADDRESS,
          data: storeProposalCallData,
        };

        // setup an admin role Biconomy smart account as Proposal Registry requires DEFAULT_ADMIN_ROLE
        const biconomySmartAccount_admin = await BiconomySmartAccount(magic.rpcProvider, true);
        if (!biconomySmartAccount_admin) {
          console.log("Missing Biconomy smart account.");
          return;
        }
        console.log("Building user op_2...");
        const partialUserOp_2: Partial<UserOperation> = await biconomySmartAccount_admin.buildUserOp([
          tx_storeProposalDetailsInRegistry,
        ]);
        console.log("**** partialUserOp_2: ");
        console.log(partialUserOp_2);

        console.log("Getting paymaster and data...");
        const paymasterAndDataResponse_2 = await BiconomyPaymaster.getPaymasterAndData(
          partialUserOp_2,
          paymasterServiceData,
        );
        partialUserOp_2.paymasterAndData = paymasterAndDataResponse_2.paymasterAndData;

        console.log("**** partialUserOp_2.paymasterAndData: ");
        console.log(partialUserOp_2.paymasterAndData);

        const userOpResponse_2 = await biconomySmartAccount_admin.sendUserOp(partialUserOp_2);
        console.log("**** userOpResponse_2: ");
        console.log(userOpResponse_2);
        const transactionDetails_2 = await userOpResponse_2.wait();

        console.log("**** transactionDetails_2: ");
        console.log(transactionDetails_2);

        console.log("**** transactionDetails_2.receipt.transactionHash: ");
        console.log(transactionDetails_2.receipt?.transactionHash);

        console.log(" End of submitProposalHandler");
      }
    } catch (error) {
      console.log(error);
      return;
    }

    // Clear form
    setSubmitter("");
    setWallet("");
    setTitle("");
    setRecipient("");
    setReason("");
    setUse("");
    setAmount("");
  };

  const clearFormHandler = () => {
    setSubmitter("");
    setWallet("");
    setTitle("");
    setRecipient("");
    setReason("");
    setUse("");
    setAmount("");
  };

  const getMagicUserInfo = async () => {
    const magic = await MagicLogin(true);
    if (magic) {
      const userInfo = await magic?.user.getInfo();
      console.log(userInfo);
    } else {
      console.log("Error during log in, try again.");
      setMagicActive(false);
    }
  };
  const logInMagic = async () => {
    const magic = await MagicLogin(true);
    if (magic) {
      console.log("Magic log in status: ", await magic?.user.isLoggedIn());
      setMagicActive(true);
    } else {
      console.log("Error during log in, try again.");
      setMagicActive(false);
    }
  };
  const logoutMagic = async () => {
    const magic = await MagicLogin(false);
    if (magic) {
      await magic.user.logout();
      console.log("Magic logged out");
    }
    setMagicActive(false);
  };
  const biconomyTest = async () => {
    // Get magic instance
    const magic = await MagicLogin(true);

    // Setup Biconomy Smart Account
    if (!magic) {
      console.log("Error during log in, try again.");
      setMagicActive(false);
      return;
    }
    const biconomySmartAccount = await BiconomySmartAccount(magic.rpcProvider, true);
    const accountAddress = await biconomySmartAccount?.getAccountAddress();
    console.log("**** accountAddress: ", accountAddress);
  };
  const getProposalId = async () => {
    const result = await getProposalIdFromTx(
      "0x727c36a9115583d369c1c4123be6c4adf51e475d24c187ade172dcf9c5e2f66d",
      hafGovAbi,
      "ProposalCreated",
    );
    if (!result) {
      console.log("Null returned from getProposalIdFromTx");
      return;
    }
    console.log("**** result: ", result);
    console.log("Proposal ID:", result.toString());
  };
  const getAllProposalData = async () => {
    const alchemyProvider = new ethers.providers.AlchemyProvider(
      "maticmum",
      process.env.NEXT_PUBLIC_ALCHEMY_KEY || "2olqx6rQSWK3TThRmPvylRkNPbD0dDNj",
    );
    const HelpAFrenProposalRegistryContract = new ethers.Contract(
      HAF_PROPOSAL_REGISTRY_ADDRESS,
      hafProposalRegistryAbi,
      alchemyProvider,
    );
    const getProposalsTx = await HelpAFrenProposalRegistryContract.getAllProposals();

    console.log("**** getProposalsTx: ");
    console.log(getProposalsTx);
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
            <div className="text-lg">
              <h4 className="mt-lg">A message from the organizer:</h4>
              <p>{forProposalForm}</p>
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
                  value={"one-time"}
                  type="radio"
                  name="radio-10"
                  className="radio checked:bg-blue-500"
                  checked={isRadio1Checked}
                  onChange={handleRadioChange}
                />
                <span className="label-text ml-sm">One-Time Ask</span>
              </label>
              <label className="label cursor-pointer">
                <input
                  id="on-going"
                  value={"on-going"}
                  type="radio"
                  name="radio-10"
                  className="radio checked:bg-blue-500"
                  checked={!isRadio2Checked}
                  onChange={handleRadioChange}
                />
                <span className="label-text ml-sm">On-Going Need</span>
              </label>
            </div>
            <div className="card-actions justify-end my-md">
              {/* <button className="btn btn-accent outline-none">Submit</button> */}
              {/* <button className="btn btn-accent" onClick={clearFormHandler}>
                Clear Form <ArrowSmallRightIcon className="w-3 h-3 mt-0.5" />
              </button> */}
              <button className="btn btn-accent outline-none" onClick={submitProposalHandler}>
                Submit
              </button>
              {/* <button className="btn btn-accent" onClick={getMagicUserInfo}>
                get user info <ArrowSmallRightIcon className="w-3 h-3 mt-0.5" />
              </button>
              <button className="btn btn-accent" onClick={logInMagic}>
                logInMagic <ArrowSmallRightIcon className="w-3 h-3 mt-0.5" />
              </button>
              <button className="btn btn-accent" onClick={logoutMagic}>
                logOutMagic <ArrowSmallRightIcon className="w-3 h-3 mt-0.5" />
              </button>
              <button className="btn btn-accent" onClick={biconomyTest}>
                Biconomy <ArrowSmallRightIcon className="w-3 h-3 mt-0.5" />
              </button>
              <button className="btn btn-accent" onClick={getProposalId}>
                getProposalId <ArrowSmallRightIcon className="w-3 h-3 mt-0.5" />
              </button>
              <button className="btn btn-accent" onClick={getAllProposalData}>
                getAllProposalData <ArrowSmallRightIcon className="w-3 h-3 mt-0.5" />
              </button> */}
            </div>
          </div>
        </div>
      </div>
    </HafCardWrap>
  );
};
export default ProposalTest;
