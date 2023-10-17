import { expect } from "chai";
import { ethers } from "hardhat";
import { HelpAFrenGov, HelpAFrenTimelock, HelpAFrenTreasury, HelpAFrenVoteToken } from "../typechain-types";
import { BigNumber, BigNumberish } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { loadFixture, mine } from "@nomicfoundation/hardhat-network-helpers";

// const VOTE_TOKEN_MINT = ethers.utils.parseEther('1');
const VOTE_TOKEN_MINT = 1;
const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";

// enum ProposalState {
//   Pending,
//   Active,
//   Canceled,
//   Defeated,
//   Succeeded,
//   Queued,
//   Expired,
//   Executed
// }

describe("Help A Fren App", function () {
  // -------------------------------------------------------------------------------------------------------------------------
  // ------------------------------------------------HELPER FUNCTIONS---------------------------------------------------------
  // -------------------------------------------------------------------------------------------------------------------------
  async function setupAndDeployContracts() {
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
      deployer.address,
    )) as HelpAFrenTimelock;
    await HafTimelockContract.deployed();

    // Deploy Governance contract
    const hafGovCF = await ethers.getContractFactory("HelpAFrenGov");
    const HafGovContract = (await hafGovCF.deploy(
      HafVoteTokenContract.address,
      HafTimelockContract.address,
    )) as HelpAFrenGov;
    await HafGovContract.deployed();

    // // Set timelock roles
    // await HafTimelockContract.grantRole(await HafTimelockContract.EXECUTOR_ROLE(), HafGovContract.address);
    // await HafTimelockContract.grantRole(await HafTimelockContract.PROPOSER_ROLE(), HafGovContract.address);

    // Grant roles to Timelock contract
    const proposerRole = await HafTimelockContract.PROPOSER_ROLE();
    const executorRole = await HafTimelockContract.EXECUTOR_ROLE();
    const adminRole = await HafTimelockContract.DEFAULT_ADMIN_ROLE();

    const setProposerRoleTx = await HafTimelockContract.connect(deployer).grantRole(
      proposerRole,
      HafGovContract.address,
    );
    await setProposerRoleTx.wait();
    const setExecutorRoleTx = await HafTimelockContract.connect(deployer).grantRole(executorRole, ADDRESS_ZERO);
    await setExecutorRoleTx.wait();
    const revokeAdminRoleTx = await HafTimelockContract.connect(deployer).revokeRole(adminRole, deployer.address);
    await revokeAdminRoleTx.wait();

    // Deploy Treasury contract
    const hafTreasuryCF = await ethers.getContractFactory("HelpAFrenTreasury");
    const HafTreasuryContract = (await hafTreasuryCF.deploy(HafTimelockContract.address)) as HelpAFrenTreasury;
    await HafTreasuryContract.deployed();

    // Send 1 Ether to Treasury contract
    console.log(
      "Treasury balance before deposit: ",
      ethers.utils.formatEther(await ethers.provider.getBalance(HafTreasuryContract.address)),
    );
    const depositTx = await HafTreasuryContract.connect(deployer).deposit({ value: ethers.utils.parseEther("1") });
    await depositTx.wait();
    console.log(
      "Treasury balance: ",
      ethers.utils.formatEther(await ethers.provider.getBalance(HafTreasuryContract.address)),
    );

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

  async function vote(voter: SignerWithAddress, proposalId: BigNumberish, _HafGovContract: HelpAFrenGov, vote: number) {
    const voteTx = await _HafGovContract.connect(voter).castVote(proposalId, vote);
    await voteTx.wait();
  }

  // Queue project (proposal)
  async function queueProject(
    authorizer: SignerWithAddress,
    _HafTreasuryContract: HelpAFrenTreasury,
    _HafGovContract: HelpAFrenGov,
    proposalId: string,
  ): Promise<number> {
    const submitQueueTx = await _HafGovContract.connect(authorizer).queueProposal(proposalId);
    const submitQueueTxReceipt = await submitQueueTx.wait();
    return submitQueueTxReceipt.blockNumber;
  }

  // // Execute project (proposal)
  async function executeProject(
    authorizer: SignerWithAddress,
    _HafTreasuryContract: HelpAFrenTreasury,
    _HafGovContract: HelpAFrenGov,
    proposalId: string,
  ): Promise<number> {
    const submitExecuteTx = await _HafGovContract.connect(authorizer).executeProposal(proposalId);
    const submitExecuteTxReceipt = await submitExecuteTx.wait();
    return submitExecuteTxReceipt.blockNumber;
  }

  // -------------------------------------------------------------------------------------------------------------------------
  // ---------------------------------------------------TESTS START-----------------------------------------------------------
  // -------------------------------------------------------------------------------------------------------------------------

  it("should allow request for a Voting token and delegated to self", async function () {
    console.log("\n\nTest: should allow request for a Voting token and delegated to self\n");
    const { deployer, voter1, HafVoteTokenContract } = await loadFixture(setupAndDeployContracts);
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
    const { unauthorizedVoter, HafVoteTokenContract } = await loadFixture(setupAndDeployContracts);
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

  it("should not allow anyone to withdraw from Treasury contract", async function () {
    const { deployer, unauthorizedVoter, HafTreasuryContract } = await loadFixture(setupAndDeployContracts);
    await expect(HafTreasuryContract.connect(deployer).withdraw(deployer.address, 1)).to.be.reverted;
    await expect(HafTreasuryContract.connect(unauthorizedVoter).withdraw(unauthorizedVoter.address, 1)).to.be.reverted;
  });

  it("should allow a proposer to submit a proposal", async function () {
    const { proposer, fundRecipient, HafTreasuryContract, HafGovContract } = await loadFixture(setupAndDeployContracts);

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

  async function setupVotersAndProposal() {
    const {
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
    } = await loadFixture(setupAndDeployContracts);

    // Voter claim voting token
    await mintVoteTokenAndDelegate(deployer, voter1, HafVoteTokenContract, "ipfs://testURI");
    await getVotingPower(voter1.address, HafVoteTokenContract);

    await mintVoteTokenAndDelegate(deployer, voter2, HafVoteTokenContract, "ipfs://testURI");
    await getVotingPower(voter2.address, HafVoteTokenContract);

    await mintVoteTokenAndDelegate(deployer, voter3, HafVoteTokenContract, "ipfs://testURI");
    await getVotingPower(voter3.address, HafVoteTokenContract);

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

    return {
      deployer,
      proposer,
      voter1,
      voter2,
      voter3,
      unauthorizedVoter,
      fundRecipient,
      grantAmount,
      HafVoteTokenContract,
      HafTimelockContract,
      HafGovContract,
      HafTreasuryContract,
      proposalId,
    };
  }

  it("should allow voters to vote on a proposal", async function () {
    console.log("\n\nTest: should allow voters to vote on a proposal\n");
    const { deployer, voter1, voter2, voter3, HafGovContract, proposalId } = await loadFixture(setupVotersAndProposal);

    // Display proposal deadline
    const proposalDeadlineTx = await HafGovContract.connect(deployer).proposalDeadline(proposalId.toString());
    console.log("Proposal deadline: ", proposalDeadlineTx.toString());

    // Before voting on proposal
    const proposalStateBeforeVoting = await HafGovContract.state(proposalId.toString());
    console.log("Proposal state before voting: ", proposalStateBeforeVoting);
    expect(proposalStateBeforeVoting).to.equal(0);

    // Mine blocks to reach voting period
    await mine(5);
    // check block number
    console.log("Current Block number: ", (await ethers.provider.getBlockNumber()).toString());

    // Vote on proposal
    // 0 - Against, 1 - For, 2 - Abstain
    await vote(voter1, proposalId, HafGovContract, 1); // for
    await vote(voter2, proposalId, HafGovContract, 0); // against
    await vote(voter3, proposalId, HafGovContract, 1); // for

    // After voting on proposal
    const proposalStateAfterVoting = await HafGovContract.state(proposalId.toString());
    console.log("Proposal state after voting: ", proposalStateAfterVoting);
    expect(proposalStateAfterVoting).to.equal(1);

    // Display proposal votes
    const { againstVotes, forVotes, abstainVotes } = await HafGovContract.proposalVotes(proposalId.toString());
    console.log(`Votes For: ${forVotes.toString()}`);
    console.log(`Votes Against: ${againstVotes.toString()}`);
    console.log(`Votes Abstain: ${abstainVotes.toString()}`);
    expect(forVotes).to.equal(2);
    expect(againstVotes).to.equal(1);
    expect(abstainVotes).to.equal(0);
  });

  it("should not allow unauthorized voter to vote on a proposal", async function () {
    console.log("\n\nTest: should not allow unauthorized voter to vote on a proposal\n");
    const { unauthorizedVoter, HafGovContract, HafVoteTokenContract, proposalId } = await loadFixture(
      setupVotersAndProposal,
    );

    const votingPower = await getVotingPower(unauthorizedVoter.address, HafVoteTokenContract);
    console.log(`Unauthorized voter's voting power: `, votingPower.toNumber());
    expect(votingPower).to.not.equal(VOTE_TOKEN_MINT);

    // Mine blocks to reach voting period
    await mine(5);

    // Vote on proposal
    // 0 - Against, 1 - For, 2 - Abstain
    console.log("After unauthorized voter submitted a vote");
    await vote(unauthorizedVoter, proposalId, HafGovContract, 1);
    // Display proposal votes
    const { againstVotes, forVotes, abstainVotes } = await HafGovContract.proposalVotes(proposalId.toString());
    console.log(`Votes For: ${forVotes.toString()}`);
    console.log(`Votes Against: ${againstVotes.toString()}`);
    console.log(`Votes Abstain: ${abstainVotes.toString()}`);
    expect(forVotes).to.equal(0);
    expect(againstVotes).to.equal(0);
    expect(abstainVotes).to.equal(0);
  });

  it("should have Governor contract release funds on a successful proposal", async function () {
    console.log("\n\nTest: should have Governor contract release funds on a successful proposal\n");
    const {
      deployer,
      voter1,
      voter2,
      voter3,
      grantAmount,
      HafGovContract,
      HafTreasuryContract,
      proposalId,
      fundRecipient,
    } = await loadFixture(setupVotersAndProposal);

    // Mine blocks to reach voting period
    await mine(5);
    // check block number
    console.log("Current Block number: ", (await ethers.provider.getBlockNumber()).toString());

    // Display proposal deadline
    const proposalDeadlineTx = await HafGovContract.connect(deployer).proposalDeadline(proposalId.toString());
    console.log("Proposal deadline: ", proposalDeadlineTx.toString());

    // Before voting on proposal
    const proposalStateBeforeVoting = await HafGovContract.state(proposalId.toString());
    console.log("Proposal state before voting: ", proposalStateBeforeVoting);
    expect(proposalStateBeforeVoting).to.equal(0);

    // Vote on proposal
    // 0 - Against, 1 - For, 2 - Abstain
    console.log("Voters vote on proposal");
    await vote(voter1, proposalId, HafGovContract, 1); // for
    await vote(voter2, proposalId, HafGovContract, 0); // against
    await vote(voter3, proposalId, HafGovContract, 1); // for

    // Mine blocks to end voting period
    await mine(30);
    // check block number
    console.log("Current Block number: ", (await ethers.provider.getBlockNumber()).toString());

    // Get initial Treasury and Fund Recipient balances
    const initialTreasuryBalance = await ethers.provider.getBalance(HafTreasuryContract.address);
    const initialFundRecipientBalance = await ethers.provider.getBalance(fundRecipient.address);
    console.log("Treasury balance: ", ethers.utils.formatEther(initialTreasuryBalance));
    console.log("Fund Recipient balance: ", ethers.utils.formatEther(initialFundRecipientBalance));

    // Display proposal votes
    const { againstVotes, forVotes, abstainVotes } = await HafGovContract.proposalVotes(proposalId.toString());
    console.log("\nVoting results: ");
    console.log(`Votes For: ${forVotes.toString()}`);
    console.log(`Votes Against: ${againstVotes.toString()}`);
    console.log(`Votes Abstain: ${abstainVotes.toString()}`);

    const resultTx = await HafGovContract.connect(deployer).proposalNeedsQueuing(proposalId.toString());
    console.log("Proposal Ready for Queue: ", resultTx);
    expect(resultTx).to.equal(true);

    // Queue proposal
    const queueTx = await queueProject(deployer, HafTreasuryContract, HafGovContract, proposalId.toString());
    console.log("Proposal queued on block number: ", queueTx);

    // Check proposal state
    const proposalStateAfterQueue = await HafGovContract.state(proposalId.toString());
    console.log("Proposal state after queue: ", proposalStateAfterQueue);
    expect(proposalStateAfterQueue).to.equal(5);

    // Execute proposal
    const executeTx = await executeProject(deployer, HafTreasuryContract, HafGovContract, proposalId.toString());
    console.log("Proposal executed on block number: ", executeTx);

    // Check proposal state
    const proposalStateAfterExecute = await HafGovContract.state(proposalId.toString());
    console.log("Proposal state after execute: ", proposalStateAfterExecute);
    expect(proposalStateAfterExecute).to.equal(7);

    // Get initial Treasury and Fund Recipient balances
    const finalTreasuryBalance = await ethers.provider.getBalance(HafTreasuryContract.address);
    const finalFundRecipientBalance = await ethers.provider.getBalance(fundRecipient.address);
    console.log("Final Treasury balance: ", ethers.utils.formatEther(finalTreasuryBalance));
    console.log("Final Recipient balance: ", ethers.utils.formatEther(finalFundRecipientBalance));

    expect(finalTreasuryBalance).to.equal(0);
    expect(finalFundRecipientBalance).to.equal(initialFundRecipientBalance.add(grantAmount));
  });
});
