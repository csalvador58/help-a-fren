import { expect } from "chai";
import { ethers } from "hardhat";
import { HelpAFrenGov, HelpAFrenTimelock, HelpAFrenTreasury, HelpAFrenVoteToken } from "../typechain-types";
import { BigNumber, BigNumberish } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

// const VOTE_TOKEN_MINT = ethers.utils.parseEther('1');
const VOTE_TOKEN_MINT = 1;

describe("Help A Fren App", function () {
  // -------------------------------------------------------------------------------------------------------------------------
  // ------------------------------------------------HELPER FUNCTIONS---------------------------------------------------------
  // -------------------------------------------------------------------------------------------------------------------------
  async function setupAndDeployFixture() {
    // Setup accounts
    const [deployer, proposer, voter1, voter2, voter3, unauthorizedVoter, fundRecipient] = await ethers.getSigners();

    console.log("Deployer: ", deployer.address);
    console.log("Proposer: ", proposer.address);
    console.log("Voter1: ", voter1.address);
    console.log("Voter2: ", voter2.address);
    console.log("Voter3: ", voter3.address);

    // Deploy NFT Voting contract
    const hafVoteTokenCF = await ethers.getContractFactory("HelpAFrenVoteToken");
    const HafVoteTokenContract = (await hafVoteTokenCF.deploy(
      deployer.address,
      deployer.address,
    )) as HelpAFrenVoteToken;
    await HafVoteTokenContract.deployed();

    // Deploy Timelock contract
    const hafTimelockCF = await ethers.getContractFactory("HelpAFrenTimelock");
    const HafTimelockContract = (await hafTimelockCF.deploy(
      0,
      [proposer.address],
      [deployer.address],
      "0x0000000000000000000000000000000000000000",
    )) as HelpAFrenTimelock;
    await HafTimelockContract.deployed();

    // Deploy Governance contract
    const hafGovCF = await ethers.getContractFactory("HelpAFrenGov");
    const HafGovContract = (await hafGovCF.deploy(
      HafVoteTokenContract.address,
      HafTimelockContract.address,
    )) as HelpAFrenGov;
    await HafGovContract.deployed();

    // Deploy Treasury contract
    const hafTreasuryCF = await ethers.getContractFactory("HelpAFrenTreasury");
    const HafTreasuryContract = (await hafTreasuryCF.deploy(HafTimelockContract.address)) as HelpAFrenTreasury;
    await HafTreasuryContract.deployed();

    // Grant Minter role to known voter addresses
    await HafVoteTokenContract.connect(deployer).grantRole(await HafVoteTokenContract.MINTER_ROLE(), voter1.address);
    await HafVoteTokenContract.connect(deployer).grantRole(await HafVoteTokenContract.MINTER_ROLE(), voter2.address);
    await HafVoteTokenContract.connect(deployer).grantRole(await HafVoteTokenContract.MINTER_ROLE(), voter3.address);

    return {
      deployer,
      proposer,
      voter1,
      voter2,
      voter3,
      unauthorizedVoter,
      fundRecipient,
      HafVoteTokenContract,
      HafTimelockContract,
      HafGovContract,
      HafTreasuryContract,
    };
  }

  async function mintVoteTokenAndDelegate(
    authorizer: SignerWithAddress,
    recipient: SignerWithAddress,
    voteToken: HelpAFrenVoteToken,
    uri: string,
  ): Promise<BigNumber> {
    // Mint token
    const mintTx = await voteToken.connect(authorizer).safeMint(recipient.address, uri);
    await mintTx.wait();

    // Delegate token
    const delegateTx = await voteToken.connect(recipient).delegate(recipient.address);
    await delegateTx.wait();

    return await voteToken.balanceOf(recipient.address);
  }

  async function getVoteTokenBalance(address: string, voteToken: HelpAFrenVoteToken): Promise<BigNumber> {
    return await voteToken.balanceOf(address);
  }

  async function getVotingPower(address: string, voteToken: HelpAFrenVoteToken): Promise<BigNumber> {
    return await voteToken.getVotes(address);
  }

  async function submitProposal(
    authorizer: SignerWithAddress,
    _HafTreasuryContract: HelpAFrenTreasury,
    _HafGovContract: HelpAFrenGov,
    proposalDesc: string,
    fundRecipient: string,
    grantAmount: BigNumber,
  ): Promise<string> {
    const transferCallData = _HafTreasuryContract.interface.encodeFunctionData("withdraw", [
      fundRecipient,
      grantAmount,
    ]);

    const submitProposalTx = await _HafGovContract
      .connect(authorizer)
      .propose([_HafTreasuryContract.address], [0], [transferCallData], proposalDesc);
    const submitProposalTxReceipt = await submitProposalTx.wait();
    return (submitProposalTxReceipt.events?.[0].args?.proposalId).toString();
  }

  async function vote(voter: SignerWithAddress, proposalId: BigNumberish, _HafGovContract: HelpAFrenGov) {
    const voteTx = await _HafGovContract.connect(voter).castVote(proposalId, 1);
    await voteTx.wait();
  }

  // -------------------------------------------------------------------------------------------------------------------------
  // ---------------------------------------------------TESTS START-----------------------------------------------------------
  // -------------------------------------------------------------------------------------------------------------------------

  it("should allow request for a Voting token and delegated to self", async function () {
    console.log("\n\nTest: should allow request for a Voting token and delegated to self\n");
    const { deployer, voter1, HafVoteTokenContract } = await loadFixture(setupAndDeployFixture);
    const voteTokenBalance = await mintVoteTokenAndDelegate(deployer, voter1, HafVoteTokenContract, "ipfs://testURI");
    const votingPower = await getVotingPower(voter1.address, HafVoteTokenContract);
    console.log("\n");
    console.log(`voteTokenBalance: `, voteTokenBalance.toNumber());
    console.log(`votingPower: `, votingPower.toNumber());
    console.log(`VOTE_TOKEN_MINT: `, VOTE_TOKEN_MINT);
    console.log("\n");
    expect(voteTokenBalance).to.equal(VOTE_TOKEN_MINT);
    expect(votingPower).to.equal(VOTE_TOKEN_MINT);
  });

  it("should not allow request for a Voting token to an unauthorize voter", async function () {
    const { unauthorizedVoter, HafVoteTokenContract } = await loadFixture(setupAndDeployFixture);
    const uri = "ipfs://testURI";

    // Unauthorized voter should not have any voting token or voting power
    expect(await getVoteTokenBalance(unauthorizedVoter.address, HafVoteTokenContract)).to.equal(0);
    expect(await await getVotingPower(unauthorizedVoter.address, HafVoteTokenContract)).to.equal(0);
    await expect(HafVoteTokenContract.connect(unauthorizedVoter).safeMint(unauthorizedVoter.address, uri)).to.be
      .reverted;

    // Unauthorized voter should not have any voting token or power after request to mint
    expect(await getVoteTokenBalance(unauthorizedVoter.address, HafVoteTokenContract)).to.equal(0);
    expect(await await getVotingPower(unauthorizedVoter.address, HafVoteTokenContract)).to.equal(0);
  });

  it("should allow a proposer to submit a proposal", async function () {
    const { proposer, fundRecipient, HafTreasuryContract, HafGovContract } = await loadFixture(setupAndDeployFixture);

    const proposalDescription = "Test Proposal";
    const grantAmount = ethers.utils.parseEther("1");

    const proposalId = await submitProposal(
      proposer,
      HafTreasuryContract,
      HafGovContract,
      proposalDescription,
      fundRecipient.address,
      grantAmount,
    );

    expect(proposalId).to.not.be.undefined;
  });

  it("should allow a voter to vote on a proposal", async function () {
    console.log("\n\nTest: should allow a voter to vote on a proposal\n");
    const { deployer, proposer, voter1, fundRecipient, HafTreasuryContract, HafGovContract, HafVoteTokenContract } =
      await loadFixture(setupAndDeployFixture);

    // Voter claim voting token
    await mintVoteTokenAndDelegate(deployer, voter1, HafVoteTokenContract, "ipfs://testURI");
    const votingPower = await getVotingPower(voter1.address, HafVoteTokenContract);
    console.log("Voting power: ", votingPower.toNumber());
    expect(await getVoteTokenBalance(voter1.address, HafVoteTokenContract)).to.equal(VOTE_TOKEN_MINT);
    expect(votingPower).to.equal(VOTE_TOKEN_MINT);

    // Create a submitted proposal
    const proposalDescription = "Test Proposal to grant 1 Ether";
    const grantAmount = ethers.utils.parseEther("1");
    const proposalId = await submitProposal(
      proposer,
      HafTreasuryContract,
      HafGovContract,
      proposalDescription,
      fundRecipient.address,
      grantAmount,
    );
    expect(proposalId).to.not.be.undefined;

    // Before voting on proposal
    const proposalStateBeforeVoting = await HafGovContract.state(proposalId.toString());
    console.log("Proposal state before voting: ", proposalStateBeforeVoting);
    expect(proposalStateBeforeVoting).to.equal(0);

    // Vote on proposal
    await vote(voter1, proposalId, HafGovContract);

    // After voting on proposal
    const proposalStateAfterVoting = await HafGovContract.state(proposalId.toString());
    console.log("Proposal state after voting: ", proposalStateAfterVoting);
    expect(proposalStateAfterVoting).to.equal(1);
  });

  //   let yourContract: YourContract;
  //   before(async () => {
  //     const [owner] = await ethers.getSigners();
  //     const yourContractFactory = await ethers.getContractFactory("YourContract");
  //     yourContract = (await yourContractFactory.deploy(owner.address)) as YourContract;
  //     await yourContract.deployed();
  //   });

  //   describe("Deployment", function () {
  //     it("Should have the right message on deploy", async function () {
  //       expect(await yourContract.greeting()).to.equal("Building Unstoppable Apps!!!");
  //     });

  //     it("Should allow setting a new message", async function () {
  //       const newGreeting = "Learn Scaffold-ETH 2! :)";

  //       await yourContract.setGreeting(newGreeting);
  //       expect(await yourContract.greeting()).to.equal(newGreeting);
  //     });
  //   });
});
