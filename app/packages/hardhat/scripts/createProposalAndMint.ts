import { HardhatRuntimeEnvironment, HardhatUserConfig } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import {
  HelpAFrenGov,
  HelpAFrenGov__factory,
  HelpAFrenProposalRegistry,
  HelpAFrenProposalRegistry__factory,
  HelpAFrenTimelock,
  HelpAFrenTreasury,
  HelpAFrenTreasury__factory,
  HelpAFrenVoteToken,
  HelpAFrenVoteToken__factory,
} from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { BigNumber, BigNumberish, Wallet } from "ethers";
import hardhatConfig from "../hardhat.config";
import * as dotenv from "dotenv";
import {
  FUND_RECIPIENT_ADDRESS,
  HAF_GOVERNOR_ADDRESS,
  HAF_NFT_VOTING_ADDRESS,
  HAF_PROPOSAL_REGISTRY_ADDRESS,
  HAF_TREASURY_ADDRESS,
} from "../utils/constants";
dotenv.config();

// Connect Polygon Mumbai Testnet
const PROVIDER = new ethers.providers.AlchemyProvider("maticmum", "2olqx6rQSWK3TThRmPvylRkNPbD0dDNj");
const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";
const URI = "https://ipfs.io/ipfs/QmUNJL8zZKgbKXnmpx7tLTR6x8TKDddRcjCTBBh9Uek6DH";

async function main() {
  // -------------------------------------------------------------------------------------------------------------------------
  // ------------------------------------------------Setup User Accounts------------------------------------------------------
  // -------------------------------------------------------------------------------------------------------------------------

  console.log("\nSetting up user accounts...");
  console.log("Current block number: ", await PROVIDER.getBlockNumber());
  // Create deployer
  const deployer_pk = process.env.DEPLOYER_PRIVATE_KEY;
  if (!deployer_pk || deployer_pk.length <= 0) throw new Error("No deployer private key found in .env file");
  const deployerWallet = new ethers.Wallet(deployer_pk, ethers.provider);
  console.log("\n");
  console.log(`Deployer's address: ${deployerWallet.address}`);
  const deployer = deployerWallet.connect(PROVIDER);

  // Create proposer
  const proposer_pk = process.env.PROPOSER_PRIVATE_KEY;
  if (!proposer_pk || proposer_pk.length <= 0) throw new Error("No proposer private key found in .env file");
  const proposerWallet = new ethers.Wallet(proposer_pk, ethers.provider);
  console.log(`Proposer's address: ${proposerWallet.address}`);
  const proposer = proposerWallet.connect(PROVIDER);

  // Create Voter 1
  const voter1_pk = process.env.VOTER_1_PRIVATE_KEY;
  if (!voter1_pk || voter1_pk.length <= 0) throw new Error("No voter 1 private key found in .env file");
  const voter1Wallet = new ethers.Wallet(voter1_pk, ethers.provider);
  console.log(`Voter 1's address: ${voter1Wallet.address}`);
  const voter1 = voter1Wallet.connect(PROVIDER);

  // Create Voter 2
  const voter2_pk = process.env.VOTER_2_PRIVATE_KEY;
  if (!voter2_pk || voter2_pk.length <= 0) throw new Error("No voter 2 private key found in .env file");
  const voter2Wallet = new ethers.Wallet(voter2_pk, ethers.provider);
  console.log(`Voter 2's address: ${voter2Wallet.address}`);
  const voter2 = voter2Wallet.connect(PROVIDER);

  // Create Voter 3
  const voter3_pk = process.env.VOTER_3_PRIVATE_KEY;
  if (!voter3_pk || voter3_pk.length <= 0) throw new Error("No voter 3 private key found in .env file");
  const voter3Wallet = new ethers.Wallet(voter3_pk, ethers.provider);
  console.log(`Voter 3's address: ${voter3Wallet.address}`);
  const voter3 = voter3Wallet.connect(PROVIDER);

  // Fund Recipient
  console.log(`Fund Recipient's address: ${FUND_RECIPIENT_ADDRESS}`);

  // -------------------------------------------------------------------------------------------------------------------------
  // ------------------------------------------------Setup Contracts----------------------------------------------------------
  // -------------------------------------------------------------------------------------------------------------------------
  console.log("\nSetting up contracts...");
  console.log("Current block number: ", await PROVIDER.getBlockNumber());
  // Setup instance of Governor contract
  const HafGovCF = (await ethers.getContractFactory("HelpAFrenGov", deployer)) as HelpAFrenGov__factory;
  const HafGovContract = (await HafGovCF.attach(HAF_GOVERNOR_ADDRESS)) as HelpAFrenGov;
  console.log("Connecting to Governor contract at: ", HafGovContract.address);

  // Setup instance of Treasury contract
  const HafTreasuryCF = (await ethers.getContractFactory("HelpAFrenTreasury", deployer)) as HelpAFrenTreasury__factory;
  const HafTreasuryContract = (await HafTreasuryCF.attach(HAF_TREASURY_ADDRESS)) as HelpAFrenTreasury;
  console.log("Connecting to Treasury contract at: ", HafTreasuryContract.address);

  // Setup instance of Proposal Registry contract
  const HafProposalRegistryCF = (await ethers.getContractFactory(
    "HelpAFrenProposalRegistry",
    deployer,
  )) as HelpAFrenProposalRegistry__factory;
  const HafProposalRegistryContract = (await HafProposalRegistryCF.attach(
    HAF_PROPOSAL_REGISTRY_ADDRESS,
  )) as HelpAFrenProposalRegistry;
  console.log("Connecting to Proposal Registry contract at: ", HafProposalRegistryContract.address);

  // Setup instance of Vote Token contract
  const hafVoteTokenCF = (await ethers.getContractFactory(
    "HelpAFrenVoteToken",
    deployer,
  )) as HelpAFrenVoteToken__factory;
  const HafVoteTokenContract = (await hafVoteTokenCF.attach(HAF_NFT_VOTING_ADDRESS)) as HelpAFrenVoteToken;
  console.log("Connecting to Vote Token contract at: ", HafVoteTokenContract.address);

  // -------------------------------------------------------------------------------------------------------------------------
  // ------------------------------------------------INTERACT WITH CONTRACTS--------------------------------------------------
  // -------------------------------------------------------------------------------------------------------------------------
  // Create a proposal
  console.log("\nCreating a proposal...");
  console.log("Current block number: ", await PROVIDER.getBlockNumber());
  const proposalDescription = "Test Proposal 6";
  const grantAmount = ethers.utils.parseEther("0.001");
  const uri = URI;

  const proposalId = await submitProposal(
    deployer,
    proposer,
    HafTreasuryContract,
    HafGovContract,
    HafProposalRegistryContract,
    proposalDescription,
    uri,
    FUND_RECIPIENT_ADDRESS,
    grantAmount,
  );
  console.log("Proposal generated with ID: ", proposalId);

  console.log("\nWaiting for proposal to be in Active state (~ 30 seconds)...");
  console.log("Current block number: ", await PROVIDER.getBlockNumber());
  while (true) {
    const proposalState = await HafGovContract.connect(deployer).state(proposalId);
    if (proposalState === 1) {
      console.log("Proposal is now in Active state");
      break;
    }
    console.log("Proposal state updated every 10 seconds: ", proposalState);
    await new Promise(resolve => setTimeout(resolve, 10000));
  }

  console.log("\nMinting tokens...");
  console.log("Current block number: ", await PROVIDER.getBlockNumber());
  // Generate token id for each voter
  const tokenHash_1 = ethers.utils.id(voter1.address + proposalId);
  const tokenId_1 = ethers.BigNumber.from(tokenHash_1).toString().slice(-7);
  console.log("Token ID 1: ", tokenId_1);

  const tokenHash_2 = ethers.utils.id(voter2.address + proposalId);
  const tokenId_2 = ethers.BigNumber.from(tokenHash_2).toString().slice(-7);
  console.log("Token ID 2: ", tokenId_2);

  const tokenHash_3 = ethers.utils.id(voter3.address + proposalId);
  const tokenId_3 = ethers.BigNumber.from(tokenHash_3).toString().slice(-7);
  console.log("Token ID 3: ", tokenId_3);

  // Mint tokens for each voter
  await mintVoteTokenAndDelegate(deployer, voter1, HafVoteTokenContract, uri, tokenId_1);
  await mintVoteTokenAndDelegate(deployer, voter2, HafVoteTokenContract, uri, tokenId_2);
  await mintVoteTokenAndDelegate(deployer, voter3, HafVoteTokenContract, uri, tokenId_3);

  // Check voting power for each user
  const voter1VotingPower = await HafVoteTokenContract.connect(deployer).getVotes(voter1.address);
  const voter2VotingPower = await HafVoteTokenContract.connect(deployer).getVotes(voter2.address);
  const voter3VotingPower = await HafVoteTokenContract.connect(deployer).getVotes(voter3.address);
  console.log(`
  Minting complete and tokens delegated to each voter:
  Voter 1 voting power: ${voter1VotingPower.toString()}
  Voter 2 voting power: ${voter2VotingPower.toString()}
  Voter 3 voting power: ${voter3VotingPower.toString()}
  `);

  // Check block number
  console.log("Current block number: ", await PROVIDER.getBlockNumber());
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

async function submitProposal(
  deployer: Wallet,
  authorizer: Wallet,
  _HafTreasuryContract: HelpAFrenTreasury,
  _HafGovContract: HelpAFrenGov,
  _HafProposalRegistryContract: HelpAFrenProposalRegistry,
  proposalDesc: string,
  uri: string,
  fundRecipient: string,
  grantAmount: BigNumber,
): Promise<string> {
  const transferCallData = _HafTreasuryContract.interface.encodeFunctionData("withdraw", [fundRecipient, grantAmount]);

  const submitProposalTx = await _HafGovContract
    .connect(authorizer)
    .propose([_HafTreasuryContract.address], [0], [transferCallData], proposalDesc, { gasLimit: 1000000 });
  const submitProposalTxReceipt = await submitProposalTx.wait();
  const proposalId = (submitProposalTxReceipt.events?.[0].args?.proposalId).toString();

  // Store in registry
  await storeProposalInRegistry(deployer, _HafProposalRegistryContract, proposalId, uri, fundRecipient);

  return proposalId;
}

async function storeProposalInRegistry(
  authorizer: Wallet,
  _HafProposalRegistryContract: HelpAFrenProposalRegistry,
  proposalId: string,
  uri: string,
  address: string,
): Promise<void> {
  const storeProposalTx = await _HafProposalRegistryContract.connect(authorizer).addProposal(proposalId, uri, address);
  await storeProposalTx.wait();
}

async function mintVoteTokenAndDelegate(
  authorizer: Wallet,
  recipient: Wallet,
  voteToken: HelpAFrenVoteToken,
  uri: string,
  tokenId: BigNumberish,
): Promise<string[]> {
  // Mint token
  const mintTx = await voteToken.connect(authorizer).safeMint(recipient.address, uri, tokenId, { gasLimit: 1000000 });
  await mintTx.wait();
  console.log(`\nToken# ${tokenId} minted for ${recipient.address} \n  - Transaction hash: ${mintTx.hash}`);

  // Delegate token
  const delegateTx = await voteToken.connect(recipient).delegate(recipient.address, { gasLimit: 1000000 });
  await delegateTx.wait();
  console.log(`Token# ${tokenId} delegated to ${recipient.address} \n  - Transaction hash: ${delegateTx.hash}`);

  // Get token ids by address
  const tokensInHex = await voteToken.tokensByOwner(recipient.address);
  const tokensOwned = await tokensInHex.map(token => {
    return token.toString();
  });

  // View toke on Opensea Testnet
  console.log(
    `View Token# ${tokenId} on Opensea Testnet: https://testnets.opensea.io/assets/mumbai/${HAF_NFT_VOTING_ADDRESS}/${tokenId}`,
  );
  console.log("Current block number: ", await PROVIDER.getBlockNumber());

  return tokensOwned;
}
