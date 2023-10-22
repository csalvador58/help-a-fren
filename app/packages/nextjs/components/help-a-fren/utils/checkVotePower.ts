import { HAF_NFT_VOTING_ADDRESS } from "../../../../hardhat/utils/constants";
import hafVoteTokenAbi from "../abi/hafVoteTokenAbi.json";
import { BigNumberish, ethers } from "ethers";

export const checkVotingPower = async (address: string): Promise<string> => {
  // create provider from alchemy
  const alchemyProvider = new ethers.providers.AlchemyProvider(
    "maticmum",
    process.env.NEXT_PUBLIC_ALCHEMY_KEY || "2olqx6rQSWK3TThRmPvylRkNPbD0dDNj",
  );

  // Check current block number
  console.log("Current Block number: ", await alchemyProvider.getBlockNumber());

  const HelpAFrenVoteTokenContract = new ethers.Contract(HAF_NFT_VOTING_ADDRESS, hafVoteTokenAbi, alchemyProvider);
  const checkVotingPower = await HelpAFrenVoteTokenContract.getVotes(address);

  return checkVotingPower.toString();
};
