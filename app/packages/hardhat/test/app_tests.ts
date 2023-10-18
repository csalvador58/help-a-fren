import { expect } from "chai";
import { ethers } from "hardhat";
import {
  HelpAFrenGov,
  HelpAFrenProposalRegistry,
  HelpAFrenTimelock,
  HelpAFrenTreasury,
  HelpAFrenVoteToken,
} from "../typechain-types";
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

    // Deploy Proposal Registry contract
    const hafProposalRegistryCF = await ethers.getContractFactory("HelpAFrenProposalRegistry");
    const HafProposalRegistryContract = (await hafProposalRegistryCF.deploy(
      deployer.address,
    )) as HelpAFrenProposalRegistry;
    await HafProposalRegistryContract.deployed();

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

    // Send 5000 Ether to Treasury contract
    console.log(
      "Treasury balance before deposit: ",
      ethers.utils.formatEther(await ethers.provider.getBalance(HafTreasuryContract.address)),
    );
    const depositTx = await HafTreasuryContract.connect(deployer).deposit({ value: ethers.utils.parseEther("5000") });
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
      HafProposalRegistryContract,
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
    tokenId: BigNumberish,
  ): Promise<string[]> {
    // Mint token
    const mintTx = await voteToken.connect(authorizer).safeMint(recipient.address, uri, tokenId);
    await mintTx.wait();

    // Delegate token
    const delegateTx = await voteToken.connect(recipient).delegate(recipient.address);
    await delegateTx.wait();

    // Get token ids by address
    const tokensInHex = await voteToken.tokensByOwner(recipient.address);
    const tokensOwned = await tokensInHex.map(token => {
      return token.toString();
    });

    return tokensOwned;
  }

  async function getVoteTokenBalance(address: string, voteToken: HelpAFrenVoteToken): Promise<BigNumber> {
    return await voteToken.balanceOf(address);
  }

  async function getVotingPower(address: string, voteToken: HelpAFrenVoteToken): Promise<BigNumber> {
    return await voteToken.getVotes(address);
  }

  async function submitProposal(
    deployer: SignerWithAddress,
    authorizer: SignerWithAddress,
    _HafTreasuryContract: HelpAFrenTreasury,
    _HafGovContract: HelpAFrenGov,
    _HafProposalRegistryContract: HelpAFrenProposalRegistry,
    proposalDesc: string,
    uri: string,
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
    const proposalId = (submitProposalTxReceipt.events?.[0].args?.proposalId).toString();

    // Store in registry
    await storeProposalInRegistry(deployer, _HafProposalRegistryContract, proposalId, uri, fundRecipient);

    return proposalId;
  }

  async function storeProposalInRegistry(
    authorizer: SignerWithAddress,
    _HafProposalRegistryContract: HelpAFrenProposalRegistry,
    proposalId: string,
    uri: string,
    address: string,
  ): Promise<void> {
    const storeProposalTx = await _HafProposalRegistryContract
      .connect(authorizer)
      .addProposal(proposalId, uri, address);
    await storeProposalTx.wait();
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

  it("should allow a proposer to submit a proposal and details stored in proposal registry contract", async function () {
    const { deployer, proposer, fundRecipient, HafProposalRegistryContract, HafTreasuryContract, HafGovContract } =
      await loadFixture(setupAndDeployContracts);

    // Setup proposal

    const proposalDescription = "Test Proposal";
    const grantAmount = ethers.utils.parseEther("100");
    const uri = "ipfs://testURI";

    const proposalId = await submitProposal(
      deployer,
      proposer,
      HafTreasuryContract,
      HafGovContract,
      HafProposalRegistryContract,
      proposalDescription,
      uri,
      fundRecipient.address,
      grantAmount,
    );

    expect(proposalId).to.not.be.undefined;

    // Retrieve proposal description hash and compare with manually calculated hash
    // const [targets, values, calldatas, descriptionHash] = await HafGovContract.proposalDetails(proposalId);
    const [, , , descriptionHash] = await HafGovContract.proposalDetails(proposalId);
    const descriptionBytes = ethers.utils.toUtf8Bytes(proposalDescription);
    const hash = ethers.utils.keccak256(descriptionBytes);
    expect(descriptionHash).to.equal(hash);

    // Verify proposal stored in registry
    const proposal = await HafProposalRegistryContract.connect(deployer).getProposal(0);
    expect(proposal).to.not.be.undefined;

    // Verify only 1 proposal stored in registry
    const proposals = await HafProposalRegistryContract.connect(deployer).getAllProposals();
    expect(proposals.length).to.equal(1);

    // Remove proposal from registry
    const removeProposalTx = await HafProposalRegistryContract.connect(deployer).removeProposal(0);
    await removeProposalTx.wait();
    expect((await HafProposalRegistryContract.connect(deployer).getAllProposals()).length).to.be.equal(0);
  });

  it("should allow request for a multiple Voting tokens (one for each proposal) and delegate voting power to self", async function () {
    console.log("\nTest: should allow request for a Voting token and delegated to self\n");

    const {
      deployer,
      proposer,
      fundRecipient,
      voter1,
      HafProposalRegistryContract,
      HafTreasuryContract,
      HafGovContract,
      HafVoteTokenContract,
    } = await loadFixture(setupAndDeployContracts);

    // Setup proposal

    const proposalDescription = "Test Proposal";
    const grantAmount = ethers.utils.parseEther("100");
    const uri = "ipfs://testURI";

    const proposalId = await submitProposal(
      deployer,
      proposer,
      HafTreasuryContract,
      HafGovContract,
      HafProposalRegistryContract,
      proposalDescription,
      uri,
      fundRecipient.address,
      grantAmount,
    );

    // Generate token id
    const tokenHash = ethers.utils.id(voter1.address + proposalId);
    console.log("tokenHash: ", tokenHash);
    // take last 7 digits to create token ID
    const tokenId = ethers.BigNumber.from(tokenHash).toString().slice(-7);

    // Get Voting token and delegate to self
    let tokensHeldByVoter = await mintVoteTokenAndDelegate(
      deployer,
      voter1,
      HafVoteTokenContract,
      "ipfs://testURI",
      tokenId,
    );

    // Check voting power
    const votingPower = await getVotingPower(voter1.address, HafVoteTokenContract);

    console.log("\n");
    console.log("Tokens held by voter: ", tokensHeldByVoter);
    console.log(`votingPower: `, votingPower.toNumber());
    console.log("\n");

    let token = parseInt(tokenId);
    let tokens = tokensHeldByVoter.map(t => parseInt(t));
    expect(tokens).to.include(token);
    expect(votingPower).to.equal(VOTE_TOKEN_MINT);

    // Setup proposal 2 to create another voting token

    const proposalDescription2 = "Test Proposal2";
    const grantAmount2 = ethers.utils.parseEther("100");
    const uri2 = "ipfs://testURI2";

    const proposalId2 = await submitProposal(
      deployer,
      proposer,
      HafTreasuryContract,
      HafGovContract,
      HafProposalRegistryContract,
      proposalDescription2,
      uri2,
      fundRecipient.address,
      grantAmount2,
    );

    // Generate token id
    const tokenHash2 = ethers.utils.id(voter1.address + proposalId2);
    console.log("tokenHash2: ", tokenHash2);
    // take last 7 digits to create token ID
    const tokenId2 = ethers.BigNumber.from(tokenHash2).toString().slice(-7);

    // Get Voting token and delegate to self
    tokensHeldByVoter = await mintVoteTokenAndDelegate(
      deployer,
      voter1,
      HafVoteTokenContract,
      "ipfs://testURI",
      tokenId2,
    );

    // Check voting power
    const votingPower2 = await getVotingPower(voter1.address, HafVoteTokenContract);

    console.log("\n");
    console.log("Tokens held by voter: ", tokensHeldByVoter);
    console.log(`votingPower: `, votingPower2.toNumber());
    console.log("\n");

    token = parseInt(tokenId2);
    tokens = tokensHeldByVoter.map(t => parseInt(t));
    expect(tokens).to.include(token);
    expect(votingPower2).to.equal(VOTE_TOKEN_MINT * 2);
  });

  it("should fail request for multiple Voting tokens on the same proposal from same voter", async function () {
    // console.log("\nshould fail request for multiple Voting tokens on the same proposal\n");

    const {
      deployer,
      proposer,
      fundRecipient,
      voter1,
      HafProposalRegistryContract,
      HafTreasuryContract,
      HafGovContract,
      HafVoteTokenContract,
    } = await loadFixture(setupAndDeployContracts);

    // Setup proposal

    const proposalDescription = "Test Proposal";
    const grantAmount = ethers.utils.parseEther("100");
    const uri = "ipfs://testURI";

    const proposalId = await submitProposal(
      deployer,
      proposer,
      HafTreasuryContract,
      HafGovContract,
      HafProposalRegistryContract,
      proposalDescription,
      uri,
      fundRecipient.address,
      grantAmount,
    );

    // Generate token id
    const tokenHash = ethers.utils.id(voter1.address + proposalId);
    // take last 7 digits to create token ID
    const tokenId = ethers.BigNumber.from(tokenHash).toString().slice(-7);
    // Get Voting token and delegate to self
    const first_mint = await mintVoteTokenAndDelegate(
      deployer,
      voter1,
      HafVoteTokenContract,
      "ipfs://testURI",
      tokenId,
    );

    // expect Attempt to generate another vote token of the same proposal to revert
    await expect(mintVoteTokenAndDelegate(deployer, voter1, HafVoteTokenContract, "ipfs://testURI", tokenId)).to.be
      .reverted;
  });

  it("should allow multiple voters to request for a Voting token on the same proposal Id", async function () {
    console.log("\nshould allow multiple voters to request for a Voting token on the same proposal Id\n");

    const {
      deployer,
      proposer,
      fundRecipient,
      voter1,
      voter2,
      HafProposalRegistryContract,
      HafTreasuryContract,
      HafGovContract,
      HafVoteTokenContract,
    } = await loadFixture(setupAndDeployContracts);

    // Setup proposal

    const proposalDescription = "Test Proposal";
    const grantAmount = ethers.utils.parseEther("100");
    const uri = "ipfs://testURI";

    const proposalId = await submitProposal(
      deployer,
      proposer,
      HafTreasuryContract,
      HafGovContract,
      HafProposalRegistryContract,
      proposalDescription,
      uri,
      fundRecipient.address,
      grantAmount,
    );

    // Generate token id for first voter
    const tokenHash = ethers.utils.id(voter1.address + proposalId);
    // take last 7 digits to create token ID
    const tokenId1 = ethers.BigNumber.from(tokenHash).toString().slice(-7);

    // Get Voting token and delegate to self
    const voter1Tokens = await mintVoteTokenAndDelegate(
      deployer,
      voter1,
      HafVoteTokenContract,
      "ipfs://testURI",
      tokenId1,
    );
    // Check voting power
    const voting1Power = await getVotingPower(voter1.address, HafVoteTokenContract);

    console.log("\n");
    console.log("Tokens held by voter 1: ", voter1Tokens);
    console.log(`votingPower: `, voting1Power.toNumber());
    console.log("\n");

    let token = parseInt(tokenId1);
    let tokens = voter1Tokens.map(t => parseInt(t));
    expect(tokens).to.include(token);

    // Generate token id for second voter
    const tokenHash2 = ethers.utils.id(voter2.address + proposalId);
    // take last 7 digits to create token ID
    const tokenId2 = ethers.BigNumber.from(tokenHash2).toString().slice(-7);

    // Get Voting token and delegate to self
    const voter2Tokens = await mintVoteTokenAndDelegate(
      deployer,
      voter2,
      HafVoteTokenContract,
      "ipfs://testURI",
      tokenId2,
    );

    // Check voting power
    const voting2Power = await getVotingPower(voter2.address, HafVoteTokenContract);

    console.log("\n");
    console.log("Tokens held by voter 2: ", voter2Tokens);
    console.log(`votingPower: `, voting2Power.toNumber());
    console.log("\n");

    token = parseInt(tokenId2);
    tokens = voter2Tokens.map(t => parseInt(t));
    expect(tokens).to.include(token);
  });

  it("should not allow request for a Voting token to an unauthorize voter", async function () {
    const { unauthorizedVoter, HafVoteTokenContract } = await loadFixture(setupAndDeployContracts);
    const uri = "ipfs://testURI";

    // Unauthorized voter should not have any voting token or voting power
    expect(await getVoteTokenBalance(unauthorizedVoter.address, HafVoteTokenContract)).to.equal(0);
    expect(await await getVotingPower(unauthorizedVoter.address, HafVoteTokenContract)).to.equal(0);
    await expect(HafVoteTokenContract.connect(unauthorizedVoter).safeMint(unauthorizedVoter.address, uri, 123456)).to.be
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
      HafProposalRegistryContract,
    } = await loadFixture(setupAndDeployContracts);

    // Setup proposal

    const proposalDescription = "Test Proposal";
    const grantAmount = ethers.utils.parseEther("100");
    const uri = "ipfs://testURI";

    const proposalId = await submitProposal(
      deployer,
      proposer,
      HafTreasuryContract,
      HafGovContract,
      HafProposalRegistryContract,
      proposalDescription,
      uri,
      fundRecipient.address,
      grantAmount,
    );

    // Generate token id for first voter
    let tokenHash = ethers.utils.id(voter1.address + proposalId);
    // take last 7 digits to create token ID
    const tokenId1 = ethers.BigNumber.from(tokenHash).toString().slice(-7);

    // Generate token id for second voter
    tokenHash = ethers.utils.id(voter2.address + proposalId);
    // take last 7 digits to create token ID
    const tokenId2 = ethers.BigNumber.from(tokenHash).toString().slice(-7);

    // Generate token id for third voter
    tokenHash = ethers.utils.id(voter3.address + proposalId);
    // take last 7 digits to create token ID
    const tokenId3 = ethers.BigNumber.from(tokenHash).toString().slice(-7);

    // Voter claim voting token
    await mintVoteTokenAndDelegate(deployer, voter1, HafVoteTokenContract, "ipfs://testURI", tokenId1);
    await getVotingPower(voter1.address, HafVoteTokenContract);

    await mintVoteTokenAndDelegate(deployer, voter2, HafVoteTokenContract, "ipfs://testURI", tokenId2);
    await getVotingPower(voter2.address, HafVoteTokenContract);

    await mintVoteTokenAndDelegate(deployer, voter3, HafVoteTokenContract, "ipfs://testURI", tokenId3);
    await getVotingPower(voter3.address, HafVoteTokenContract);

    // // Check voting power for voter 1
    // const voting1Power = await getVotingPower(voter1.address, HafVoteTokenContract);
    // console.log("\n");
    // console.log(`votingPower1: `, voting1Power.toNumber());

    // // Check voting power for voter 2
    // const voting2Power = await getVotingPower(voter2.address, HafVoteTokenContract);
    // console.log(`votingPower2: `, voting2Power.toNumber());

    // // Check voting power for voter 3
    // const voting3Power = await getVotingPower(voter3.address, HafVoteTokenContract);
    // console.log(`votingPower3: `, voting3Power.toNumber());
    // console.log("\n");

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
      HafProposalRegistryContract,
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
    await mine(15);
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
    await mine(15);

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

    // check block number
    console.log("Current Block number: ", (await ethers.provider.getBlockNumber()).toString());

    // Display proposal deadline
    const proposalDeadlineTx = await HafGovContract.connect(deployer).proposalDeadline(proposalId.toString());
    console.log("Proposal deadline: ", proposalDeadlineTx.toString());

    // Before voting on proposal
    const proposalStateBeforeVoting = await HafGovContract.state(proposalId.toString());
    console.log(`Proposal state before voting period: ${proposalStateBeforeVoting} - Pending`);
    // Proposal state should be "Pending"
    expect(proposalStateBeforeVoting).to.equal(0);

    // Mine blocks to reach voting period
    await mine(15);
    // Proposal state should be "Active"
    const proposalStateDuringVoting = await HafGovContract.state(proposalId.toString());
    console.log(`Proposal state during voting period: ${proposalStateDuringVoting} - Active`);
    expect(proposalStateDuringVoting).to.equal(1);

    // Vote on proposal
    // 0 - Against, 1 - For, 2 - Abstain
    console.log("Voters vote on proposal");
    await vote(voter1, proposalId, HafGovContract, 1); // for
    await vote(voter2, proposalId, HafGovContract, 0); // against
    await vote(voter3, proposalId, HafGovContract, 1); // for

    // check block number
    const currentBlockNumber = await ethers.provider.getBlockNumber();
    console.log("Current Block number: ", currentBlockNumber.toString());

    // Mine blocks to end voting period
    await mine(Number(proposalDeadlineTx) - Number(currentBlockNumber) + 1);
    console.log("Advanced to block number to end voting period: ", (await ethers.provider.getBlockNumber()).toString());
    // Proposal state should be "Succeeded"
    const proposalStateAfterVoting = await HafGovContract.state(proposalId.toString());
    console.log(`Proposal state after voting period ends: ${proposalStateAfterVoting} - Succeeded`);
    expect(proposalStateAfterVoting).to.equal(4);

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
    console.log(`Proposal state after queue: ${proposalStateAfterQueue} - Queued`);
    expect(proposalStateAfterQueue).to.equal(5);

    // Execute proposal
    const executeTx = await executeProject(deployer, HafTreasuryContract, HafGovContract, proposalId.toString());
    console.log("Proposal executed on block number: ", executeTx);

    // Check proposal state
    const proposalStateAfterExecute = await HafGovContract.state(proposalId.toString());
    console.log(`Proposal state after execute: ${proposalStateAfterExecute} - Executed`);
    expect(proposalStateAfterExecute).to.equal(7);

    // Get initial Treasury and Fund Recipient balances
    const finalTreasuryBalance = await ethers.provider.getBalance(HafTreasuryContract.address);
    const finalFundRecipientBalance = await ethers.provider.getBalance(fundRecipient.address);
    console.log("Final Treasury balance: ", ethers.utils.formatEther(finalTreasuryBalance));
    console.log("Final Recipient balance: ", ethers.utils.formatEther(finalFundRecipientBalance));

    expect(finalTreasuryBalance).to.equal(initialTreasuryBalance.sub(grantAmount));
    expect(finalFundRecipientBalance).to.equal(initialFundRecipientBalance.add(grantAmount));
  });
});
