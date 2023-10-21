import { HAF_PROPOSAL_REGISTRY_ADDRESS } from "../../../../hardhat/utils/constants";
import hafProposalRegistryAbi from "../../../components/help-a-fren/abi/hafProposalRegistryAbi.json";
import { ethers } from "ethers";

export const getAllProposals = async () => {
  // create provider from alchemy
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
  return getProposalsTx;
};
