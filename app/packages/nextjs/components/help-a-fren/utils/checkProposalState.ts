import { HAF_GOVERNOR_ADDRESS } from "../../../../hardhat/utils/constants";
import hafGovAbi from "../abi/hafGovAbi.json";
import { BigNumberish, ethers } from "ethers";

export const checkProposalState = async (proposalID: string): Promise<string> => {
  // create provider from alchemy
  const alchemyProvider = new ethers.providers.AlchemyProvider(
    "maticmum",
    process.env.NEXT_PUBLIC_ALCHEMY_KEY || "2olqx6rQSWK3TThRmPvylRkNPbD0dDNj",
  );

  // Check current block number
  console.log("Current Block number: ", await alchemyProvider.getBlockNumber());

  // Proposal States
  //   0 - Pending,
  //   1 - Active,
  //   2 - Canceled,
  //   3 - Defeated,
  //   4 - Succeeded,
  //   5 - Queued,
  //   6 - Expired,
  //   7 - Executed

  const HelpAFrenGovernorContract = new ethers.Contract(HAF_GOVERNOR_ADDRESS, hafGovAbi, alchemyProvider);
  const proposalState = await HelpAFrenGovernorContract.state(proposalID);

  return proposalState.toString();
};
