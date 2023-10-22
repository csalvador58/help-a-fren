import { useEffect, useState } from "react";
import Image from "next/image";
import {
  HAF_GOVERNOR_ADDRESS,
  HAF_NFT_VOTING_ADDRESS,
  HAF_PROPOSAL_REGISTRY_ADDRESS,
  HAF_TREASURY_ADDRESS,
} from "../../../hardhat/utils/constants";
import hafGovAbi from "../../components/help-a-fren/abi/hafGovAbi.json";
import { BiconomySmartAccount } from "../../components/help-a-fren/utils/BiconomySA";
import { MagicLogin } from "../../components/help-a-fren/utils/MagicLogin";
import { UserOperation } from "@biconomy/core-types";
import {
  BiconomyPaymaster,
  IHybridPaymaster,
  IPaymaster,
  PaymasterMode,
  SponsorUserOperationDto,
} from "@biconomy/paymaster";
import { BigNumber, ethers } from "ethers";
import { toast } from "react-toastify";
import { ArrowSmallRightIcon } from "@heroicons/react/24/outline";
import HafCardWrap from "~~/components/help-a-fren/haf-card-wrap";
import { HafIDFormat } from "~~/components/help-a-fren/haf-id-format";
import { checkProposalState } from "~~/components/help-a-fren/utils/checkProposalState";
import { checkProposalVotes } from "~~/components/help-a-fren/utils/checkProposalVotes";
import { getAllProposals } from "~~/components/help-a-fren/utils/getAllProposals";
import { Address, Balance } from "~~/components/scaffold-eth";
import { TEST_WALLET, TREASURY_WALLET } from "~~/utils/constants";

interface IProposalDetails {
  proposalId: string;
  description: Description;
  external_url: string;
  image: string;
}

interface IProposalWithState extends IProposalDetails {
  state?: string | undefined;
  votesFor?: string | undefined;
  votesAgainst?: string | undefined;
  votesAbstain?: string | undefined;
}

interface Description {
  submitter: string;
  wallet: string;
  title: string;
  recipient: string;
  reason: string;
  use: string;
  amount: string;
}

type ProposalRegistry = [BigNumber, string, string];

const PROPOSAL_STATES: { [key: string]: string } = {
  "0": "Pending",
  "1": "Active",
  "2": "Canceled",
  "3": "Defeated",
  "4": "Succeeded",
  "5": "Queued",
  "6": "Expired",
  "7": "Executed",
  "8": "Unavailable",
};

const ResultsTest = () => {
  const [proposals, setProposals] = useState<IProposalWithState[]>([]);
  const [isMagicActive, setMagicActive] = useState(false);

  useEffect(() => {
    const getProposals = async () => {
      const proposalsFromRegistry = await getAllProposals();
      console.log("proposalsFromRegistry", proposalsFromRegistry);

      const proposalResults = await Promise.all(
        proposalsFromRegistry.map(async (proposal: ProposalRegistry) => {
          // fetch proposal data from ipfs
          const data = await fetch(proposal[1]);
          const proposalMetadata: IProposalDetails = await data.json();
          console.log("proposalMetaData", proposalMetadata);

          return proposalMetadata;
        }),
      );

      // Add proposal state and vote status to proposal data
      const proposalStates = await Promise.all(
        proposalResults.map(async (proposal: IProposalDetails) => {
          const proposalState = await checkProposalVotes(proposal.proposalId);
          return {
            ...proposal,
            state: proposalState.state || "Unavailable",
            votesFor: proposalState.votesFor || "Unavailable",
            votesAgainst: proposalState.votesAgainst || "Unavailable",
            votesAbstain: proposalState.votesAbstain || "Unavailable",
          };
        }),
      );

      setProposals(proposalStates);
    };
    getProposals();
  }, []);

  const executeHandler = async (proposalId: string) => {
    try {
      await toast.promise(
        proceedWithAATransactions(),
        {
          pending: "Releasing funds to recipient, please wait...",
          success: "Funds successfully released to recipient.",
          error: "An error occurred, please try again.",
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
        // Check Proposal State, must 5 to proceed with executing fund transfer
        let currentProposalState = await checkProposalState(proposalId);
        console.log("**** currentProposalState: ", currentProposalState);

        if (currentProposalState !== "4") {
          console.log("Proposal is not in the correct state to execute. Proposal state must be at 4 - Succeeded.");
          return;
        }

        // ==========================================================
        // Setup Variables
        // ==========================================================
        const alchemyProvider = new ethers.providers.AlchemyProvider(
          "maticmum",
          process.env.NEXT_PUBLIC_ALCHEMY_KEY || "2olqx6rQSWK3TThRmPvylRkNPbD0dDNj",
        );
        const deployer_alchemy = new ethers.Wallet(process.env.NEXT_PUBLIC_DEPLOYER_PK!, alchemyProvider);
        console.log("**** deployer: ", deployer_alchemy.address);

        // Get contracts
        const HelpAFrenGovContract = new ethers.Contract(HAF_GOVERNOR_ADDRESS, hafGovAbi, alchemyProvider);

        const paymasterServiceData: SponsorUserOperationDto = {
          mode: PaymasterMode.SPONSORED,
          smartAccountInfo: {
            name: "BICONOMY",
            version: "2.0.0",
          },
          // optional params...
        };

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

        // Validate wallet address
        if (!biconomyAccountAddress) {
          console.log("Error during log in, try again.");
          setMagicActive(false);
          return;
        }
        console.log("**** wallet: ", biconomyAccountAddress);
        const walletAddress = ethers.utils.getAddress(biconomyAccountAddress);
        const validRecipient = ethers.utils.isAddress(walletAddress);
        if (!validRecipient) {
          alert("Please enter a valid recipient address.");
          return;
        }

        // ==========================================================
        // Run Biconomy Paymaster for Queue & Execute Process
        // ==========================================================

        // setup paymaster transaction to mint
        const queueCallData = HelpAFrenGovContract.interface.encodeFunctionData("queueProposal", [proposalId]);
        const executeCallData = HelpAFrenGovContract.interface.encodeFunctionData("executeProposal", [proposalId]);
        const tx_queue = {
          to: HAF_GOVERNOR_ADDRESS,
          data: queueCallData,
        };
        const tx_execute = {
          to: HAF_GOVERNOR_ADDRESS,
          data: executeCallData,
        };

        console.log("Building user op_execute...");
        if (!biconomySmartAccount) {
          console.log("Missing Biconomy smart account.");
          return;
        }
        const partialUserOp_execute: Partial<UserOperation> = await biconomySmartAccount.buildUserOp([
          tx_queue,
          tx_execute,
        ]);
        console.log("**** partialUserOp_execute: ");
        console.log(partialUserOp_execute);

        console.log("Getting paymaster and data...");

        if (!biconomySmartAccount) {
          console.log("Missing Biconomy smart account.");
          return;
        }

        const BiconomyPaymaster = biconomySmartAccount.paymaster as IHybridPaymaster<SponsorUserOperationDto>;
        const paymasterAndDataResponse_execute = await BiconomyPaymaster.getPaymasterAndData(
          partialUserOp_execute,
          paymasterServiceData,
        );
        partialUserOp_execute.paymasterAndData = paymasterAndDataResponse_execute.paymasterAndData;

        console.log("**** partialUserOp_execute.paymasterAndData: ");
        console.log(partialUserOp_execute.paymasterAndData);

        const userOpResponse_execute = await biconomySmartAccount.sendUserOp(partialUserOp_execute);
        console.log("**** userOpResponse_execute: ");
        console.log(userOpResponse_execute);
        const transactionDetails_execute = await userOpResponse_execute.wait();

        console.log("**** transactionDetails_execute: ");
        console.log(transactionDetails_execute);

        console.log("**** transactionDetails_execute.receipt.transactionHash: ");
        console.log(transactionDetails_execute.receipt?.transactionHash);

        console.log(" End of proposal execute process.");

        // Check Proposal State: 7 indicates proposal was executed successfully
        currentProposalState = await checkProposalState(proposalId);
        console.log("**** currentProposalState: ", currentProposalState);
      }
    } catch (error) {
      console.log("error", error);
    }
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
              {proposals &&
                proposals.map((item: IProposalWithState) => (
                  <div key={item.proposalId} className="form-control nested-card place-content-between">
                    <div>
                      <div className="stat my-0 place-items-end">
                        <div className="stat-value text-accent">{`$${item.description.amount}`}</div>
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
                      <p>Proposal State: {item.state ? PROPOSAL_STATES[item.state] : PROPOSAL_STATES[8]}</p>
                      <p>Votes For: {item.votesFor}</p>
                      <p>Votes Against: {item.votesAgainst}</p>
                      <p>Votes Abstain: {item.votesAbstain}</p>
                    </div>
                    {item.state && PROPOSAL_STATES[item.state] === "Succeeded" && (
                      // {
                      <div className="card-actions flex justify-center">
                        <button className="btn btn-accent" onClick={() => executeHandler(item.proposalId)}>
                          Send Funds to Recipient
                        </button>
                      </div>
                    )}
                    {item.state && PROPOSAL_STATES[item.state] === "Executed" && (
                      // {(
                      <>
                        <div className="text-lg">
                          <p className="inline-flex">Funds sent to the Recipient Address: </p>
                          <span className="inline-flex gap-4 m-sm">
                            <Address address={item.description.wallet} />
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </HafCardWrap>
  );
};
export default ResultsTest;
