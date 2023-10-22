import { useEffect, useState } from "react";
import Image from "next/image";
import {
  HAF_GOVERNOR_ADDRESS,
  HAF_NFT_VOTING_ADDRESS,
  HAF_PROPOSAL_REGISTRY_ADDRESS,
  HAF_TREASURY_ADDRESS,
} from "../../../hardhat/utils/constants";
import hafGovAbi from "../../components/help-a-fren/abi/hafGovAbi.json";
import hafProposalRegistryAbi from "../../components/help-a-fren/abi/hafProposalRegistryAbi.json";
import hafTreasuryAbi from "../../components/help-a-fren/abi/hafTreasuryAbi.json";
import hafVoteTokenAbi from "../../components/help-a-fren/abi/hafVoteTokenAbi.json";
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
import { ArrowSmallRightIcon } from "@heroicons/react/24/outline";
import HafCardWrap from "~~/components/help-a-fren/haf-card-wrap";
import { HafIDFormat } from "~~/components/help-a-fren/haf-id-format";
import { checkProposalState } from "~~/components/help-a-fren/utils/checkProposalState";
import { checkProposalVotes } from "~~/components/help-a-fren/utils/checkProposalVotes";
import { checkVotingPower } from "~~/components/help-a-fren/utils/checkVotePower";
import { getAllProposals } from "~~/components/help-a-fren/utils/getAllProposals";
import { Address, Balance } from "~~/components/scaffold-eth";
import { useAccountBalance } from "~~/hooks/scaffold-eth";
import { PROJECT_PRICE_MULTIPLIER, TREASURY_WALLET } from "~~/utils/constants";

type Proposal = [BigNumber, string, string];

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
  const [isMagicActive, setMagicActive] = useState(false);
  // const { balance, price, isError, isLoading, onToggleBalance, isEthBalance } = useAccountBalance(HAF_TREASURY_ADDRESS);

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

  const submitVoteHandler = async (proposalId: string) => {
    console.log("submitVoteHandler", proposalId);

    try {
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
      const HelpAFrenVoteTokenContract = new ethers.Contract(HAF_NFT_VOTING_ADDRESS, hafVoteTokenAbi, alchemyProvider);
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
      // Setup Minting Process
      // ==========================================================
      const tokenHash = ethers.utils.id(biconomyAccountAddress + proposalId);
      console.log("tokenHash: ", tokenHash);
      // take last 7 digits to create token ID
      const tokenId = ethers.BigNumber.from(tokenHash).toString().slice(-7);
      console.log("tokenId: ", tokenId);

      // Get proposal uri
      const proposalsFromRegistry = await getAllProposals();
      // proposalsFromRegistry.forEach((proposal: Proposal) => {
      //   if (proposalId === proposal[0].toString()) {
      //     console.log("proposal[0]: ", proposal[0].toString());
      //     console.log("proposal[1]: ", proposal[1]);
      //     console.log("proposal[2]: ", proposal[2]);
      //   }
      // });
      const proposalUri = proposalsFromRegistry.filter(
        (proposal: Proposal) => proposal[0].toString() === proposalId,
      )[0][1];
      console.log("proposalUri: ", proposalUri);

      // ==========================================================
      // Run Biconomy Paymaster for Minting Process
      // ==========================================================

      // setup paymaster transaction to mint
      const mintTokenCallData = HelpAFrenVoteTokenContract.interface.encodeFunctionData("safeMint", [
        biconomyAccountAddress,
        proposalUri,
        tokenId,
      ]);
      const tx_mintToken = {
        to: HAF_NFT_VOTING_ADDRESS,
        data: mintTokenCallData,
      };

      // setup an admin role Biconomy smart account as Vote contract requires MINTER_ROLE
      const biconomySmartAccount_admin = await BiconomySmartAccount(magic.rpcProvider, true);
      if (!biconomySmartAccount_admin) {
        console.log("Missing Biconomy smart account.");
        return;
      }

      console.log("Building user op_mint...");
      const partialUserOp_mint: Partial<UserOperation> = await biconomySmartAccount_admin.buildUserOp([tx_mintToken]);
      console.log("**** partialUserOp_mint: ");
      console.log(partialUserOp_mint);

      console.log("Getting paymaster and data...");

      const BiconomyPaymaster_admin = biconomySmartAccount_admin.paymaster as IHybridPaymaster<SponsorUserOperationDto>;
      const paymasterAndDataResponse_mint = await BiconomyPaymaster_admin.getPaymasterAndData(
        partialUserOp_mint,
        paymasterServiceData,
      );
      partialUserOp_mint.paymasterAndData = paymasterAndDataResponse_mint.paymasterAndData;

      console.log("**** partialUserOp_mint.paymasterAndData: ");
      console.log(partialUserOp_mint.paymasterAndData);

      const userOpResponse_mint = await biconomySmartAccount_admin.sendUserOp(partialUserOp_mint);
      console.log("**** userOpResponse_mint: ");
      console.log(userOpResponse_mint);
      const transactionDetails_mint = await userOpResponse_mint.wait();

      console.log("**** transactionDetails_mint: ");
      console.log(transactionDetails_mint);

      console.log("**** transactionDetails_mint.receipt.transactionHash: ");
      console.log(transactionDetails_mint.receipt?.transactionHash);

      console.log(transactionDetails_mint.success);
      if (transactionDetails_mint.success.toString() === "false") {
        throw new Error("Minting process failed.");
      }

      console.log(" End of minting process.");

      // ==========================================================
      // Run Token Delegate Process
      // ==========================================================

      // Setup Biconomy user operations to delegate token to voter

      const delegateTokenCallData = HelpAFrenVoteTokenContract.interface.encodeFunctionData("delegate", [
        biconomyAccountAddress,
      ]);
      const tx_delegateToken = {
        to: HAF_NFT_VOTING_ADDRESS,
        data: delegateTokenCallData,
      };

      console.log("Building user op_delegate...");
      if (!biconomySmartAccount) {
        console.log("Missing Biconomy smart account.");
        return;
      }
      const partialUserOp_delegate: Partial<UserOperation> = await biconomySmartAccount.buildUserOp([tx_delegateToken]);
      console.log("**** partialUserOp_delegate: ");
      console.log(partialUserOp_delegate);

      console.log("Getting paymaster and data...");

      if (!biconomySmartAccount) {
        console.log("Missing Biconomy smart account.");
        return;
      }
      const BiconomyPaymaster = biconomySmartAccount.paymaster as IHybridPaymaster<SponsorUserOperationDto>;
      const paymasterAndDataResponse_delegate = await BiconomyPaymaster.getPaymasterAndData(
        partialUserOp_delegate,
        paymasterServiceData,
      );
      partialUserOp_delegate.paymasterAndData = paymasterAndDataResponse_delegate.paymasterAndData;

      console.log("**** partialUserOp_delegate.paymasterAndData: ");
      console.log(partialUserOp_delegate.paymasterAndData);

      const userOpResponse_delegate = await biconomySmartAccount.sendUserOp(partialUserOp_delegate);
      console.log("**** userOpResponse_delegate: ");
      console.log(userOpResponse_delegate);
      const transactionDetails_delegate = await userOpResponse_delegate.wait();

      console.log("**** transactionDetails_delegate: ");
      console.log(transactionDetails_delegate);

      console.log("**** transactionDetails_delegate.receipt.transactionHash: ");
      console.log(transactionDetails_delegate.receipt?.transactionHash);

      console.log(" End of delegate process.");

      // check vote power
      const votingPower = await checkVotingPower(biconomyAccountAddress);
      console.log(`**** votingPower for ${biconomyAccountAddress}: `, votingPower);
      if (votingPower && +votingPower < 1) {
        console.log("No vote power, minting and delegate process failed.");
        return;
      }

      // ==========================================================
      // Submit Vote for voter
      // ==========================================================

      // Proposal States
      //   0 - Pending,
      //   1 - Active,
      //   2 - Canceled,
      //   3 - Defeated,
      //   4 - Succeeded,
      //   5 - Queued,
      //   6 - Expired,
      //   7 - Executed

      // Check Proposal State, must be 0 or 1 to accept a vote
      let currentProposalState = await checkProposalState(proposalId);
      console.log("**** currentProposalState: ", currentProposalState);

      const voteSelected = voteOptions[proposalId];
      const proposalIdToBigNumber = ethers.BigNumber.from(proposalId);
      console.log("voteSelected", voteSelected);
      console.log("proposalIdToBigNumber", proposalIdToBigNumber);

      // Setup Biconomy user operations to vote on proposal
      const voteCallData = HelpAFrenGovContract.interface.encodeFunctionData("castVote", [
        proposalIdToBigNumber,
        +voteSelected,
      ]);
      const tx_vote = {
        to: HAF_GOVERNOR_ADDRESS,
        data: voteCallData,
      };

      console.log("Building user op_vote...");
      if (!biconomySmartAccount) {
        console.log("Missing Biconomy smart account.");
        return;
      }
      const partialUserOp_vote: Partial<UserOperation> = await biconomySmartAccount.buildUserOp([tx_vote]);
      console.log("**** partialUserOp_vote: ");
      console.log(partialUserOp_vote);

      console.log("Getting paymaster and data...");

      const paymasterAndDataResponse_vote = await BiconomyPaymaster.getPaymasterAndData(
        partialUserOp_vote,
        paymasterServiceData,
      );
      partialUserOp_vote.paymasterAndData = paymasterAndDataResponse_vote.paymasterAndData;

      console.log("**** partialUserOp_vote.paymasterAndData: ");
      console.log(partialUserOp_vote.paymasterAndData);

      const userOpResponse_vote = await biconomySmartAccount.sendUserOp(partialUserOp_vote);
      console.log("**** userOpResponse_vote: ");
      console.log(userOpResponse_vote);
      const transactionDetails_vote = await userOpResponse_vote.wait();

      console.log("**** transactionDetails_vote: ");
      console.log(transactionDetails_vote);

      console.log("**** transactionDetails_vote.receipt.transactionHash: ");
      console.log(transactionDetails_vote.receipt?.transactionHash);

      console.log(" End of vote process.");

      // Check Proposal State, must be 0 or 1 to accept a vote
      currentProposalState = await checkProposalState(proposalId);
      console.log("**** currentProposalState: ", currentProposalState);
    } catch (error) {
      console.log("Error: ", error);
    }
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

  // ==========================================================
  // TEST FUNCTIONS ONLY
  // ==========================================================
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
    const biconomySmartAccount = await BiconomySmartAccount(magic.rpcProvider, false);
    const accountAddress = await biconomySmartAccount?.getAccountAddress();
    console.log("**** accountAddress: ", accountAddress);
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
  const getVotePower = async () => {
    const result = await checkVotingPower("0x4E1FFEA5a84AdB810f79dAc6b59aAEa21834BfBb");

    console.log("**** checkVotingPower: ");
    console.log(result!.toString());
  };
  const getProposalState = async (proposalId: string) => {
    console.log("proposalId", proposalId);
    const result = await checkProposalState(proposalId);

    console.log("**** checkProposalState: ");
    console.log(result);

    const checkVotes = await checkProposalVotes(proposalId);
    console.log("**** checkVotes: ");
    console.log(checkVotes);
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

                        {/* Test section */}
                        <div className="card-actions justify-end my-md">
                          <button className="btn btn-accent" onClick={getMagicUserInfo}>
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
                          <button className="btn btn-accent" onClick={getAllProposalData}>
                            getAllProposalData <ArrowSmallRightIcon className="w-3 h-3 mt-0.5" />
                          </button>
                          <button className="btn btn-accent" onClick={getVotePower}>
                            getVotePower <ArrowSmallRightIcon className="w-3 h-3 mt-0.5" />
                          </button>
                          <button className="btn btn-accent" onClick={() => getProposalState(item.proposalId)}>
                            getProposalState <ArrowSmallRightIcon className="w-3 h-3 mt-0.5" />
                          </button>
                        </div>
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
