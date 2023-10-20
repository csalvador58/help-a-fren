import { HardhatRuntimeEnvironment, HardhatUserConfig } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import {
  HelpAFrenGov,
  HelpAFrenProposalRegistry,
  HelpAFrenTimelock,
  HelpAFrenTreasury,
  HelpAFrenVoteToken,
} from "../typechain-types";
import { ethers } from "hardhat";
import hardhatConfig from "../hardhat.config";
import * as dotenv from "dotenv";
dotenv.config();

// Connect Polygon Mumbai Testnet
const PROVIDER = new ethers.providers.AlchemyProvider("maticmum", "2olqx6rQSWK3TThRmPvylRkNPbD0dDNj");
const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";
const HARDHAT_CONFIG: HardhatUserConfig = hardhatConfig;

// Read hardhat config file

const deployContracts: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  // -------------------------------------------------------------------------------------------------------------------------
  // ------------------------------------------------Create Accounts----------------------------------------------------------
  // -------------------------------------------------------------------------------------------------------------------------

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
  console.log("\n");

  // -------------------------------------------------------------------------------------------------------------------------
  // ------------------------------------------------Deploy Contracts---------------------------------------------------------
  // -------------------------------------------------------------------------------------------------------------------------

  // Deploying contracts compiled with Hardhat config settings:
  console.log("Deploying contracts compiled with Hardhat config settings:");
  console.log(`
  solidity: {
    version: ${HARDHAT_CONFIG.solidity.version},
    settings: {
      optimizer: {
        enabled: ${HARDHAT_CONFIG.solidity.settings.optimizer.enabled},
        runs: ${HARDHAT_CONFIG.solidity.settings.optimizer.runs},
      },
      evmVersion: ${HARDHAT_CONFIG.solidity.settings.evmVersion},
    },
  }
  `);
  // Deploy Proposal Registry
  console.log("Deploying ProposalRegistry...");
  const hafProposalRegistryCF = await ethers.getContractFactory("HelpAFrenProposalRegistry", deployer);
  const HafProposalRegistryContract = (await hafProposalRegistryCF.deploy(
    deployer.address,
  )) as HelpAFrenProposalRegistry;
  await HafProposalRegistryContract.deployTransaction.wait();
  console.log("ProposalRegistry deployed to:", HafProposalRegistryContract.address);

  // Deploy NFT Voting contract
  console.log("Deploying NFT Voting contract...");
  const hafVoteTokenCF = await ethers.getContractFactory("HelpAFrenVoteToken", deployer);
  const HafVoteTokenContract = (await hafVoteTokenCF.deploy(deployer.address, deployer.address)) as HelpAFrenVoteToken;
  await HafVoteTokenContract.deployTransaction.wait();
  console.log("NFT Voting contract deployed to:", HafVoteTokenContract.address);

  // Deploy Timelock contract
  console.log("Deploying Timelock contract...");
  const hafTimelockCF = await ethers.getContractFactory("HelpAFrenTimelock", deployer);
  const HafTimelockContract = (await hafTimelockCF.deploy(
    0,
    [proposer.address],
    [deployer.address],
    deployer.address,
  )) as HelpAFrenTimelock;
  await HafTimelockContract.deployTransaction.wait();
  console.log("Timelock contract deployed to:", HafTimelockContract.address);

  // Deploy Governor contract
  console.log("Deploying Governor contract...");
  const hafGovCF = await ethers.getContractFactory("HelpAFrenGov", deployer);
  const HafGovContract = (await hafGovCF.deploy(
    HafVoteTokenContract.address,
    HafTimelockContract.address,
  )) as HelpAFrenGov;
  await HafGovContract.deployTransaction.wait();
  console.log("Governor contract deployed to:", HafGovContract.address);

  // Deploy Treasury contract
  console.log("Deploying Treasury contract...");
  const hafTreasuryCF = await ethers.getContractFactory("HelpAFrenTreasury", deployer);
  const HafTreasuryContract = (await hafTreasuryCF.deploy(HafTimelockContract.address)) as HelpAFrenTreasury;
  await HafTreasuryContract.deployTransaction.wait();
  console.log("Treasury contract deployed to:", HafTreasuryContract.address);
  console.log("\n");

  // -------------------------------------------------------------------------------------------------------------------------
  // ------------------------------------------------Setup Contract Roles-----------------------------------------------------
  // -------------------------------------------------------------------------------------------------------------------------

  // Grant roles to Timelock contract
  console.log("Granting roles to Timelock contract...");
  const proposerRole = await HafTimelockContract.PROPOSER_ROLE();
  const executorRole = await HafTimelockContract.EXECUTOR_ROLE();
  const adminRole = await HafTimelockContract.DEFAULT_ADMIN_ROLE();

  const setProposerRoleTx = await HafTimelockContract.connect(deployer).grantRole(proposerRole, HafGovContract.address);
  await setProposerRoleTx.wait();
  console.log(`Proposer role granted to Governor contract address: ${HafGovContract.address}`);
  const setExecutorRoleTx = await HafTimelockContract.connect(deployer).grantRole(executorRole, ADDRESS_ZERO);
  await setExecutorRoleTx.wait();
  console.log(`Executor role granted to address zero: ${ADDRESS_ZERO}`);
  const revokeAdminRoleTx = await HafTimelockContract.connect(deployer).revokeRole(adminRole, deployer.address);
  await revokeAdminRoleTx.wait();
  console.log(`Admin role revoked from deployer address: ${deployer.address}`);
  console.log("Roles granted to Timelock contract successfully");
  console.log("\n");

  // Grant minter roles to known voter addresses
  console.log("Granting minter roles to known voter addresses...");
  await HafVoteTokenContract.connect(deployer).grantRole(await HafVoteTokenContract.MINTER_ROLE(), voter1.address);
  console.log(`Minter role granted to voter 1 address: ${voter1.address}`);
  await HafVoteTokenContract.connect(deployer).grantRole(await HafVoteTokenContract.MINTER_ROLE(), voter2.address);
  console.log(`Minter role granted to voter 2 address: ${voter2.address}`);
  await HafVoteTokenContract.connect(deployer).grantRole(await HafVoteTokenContract.MINTER_ROLE(), voter3.address);
  console.log(`Minter role granted to voter 3 address: ${voter3.address}`);
};

export default deployContracts;

/*
Deployer's address: 0xD277E6b5AaB37fC7723e3449BAFF844BE39db79C
Proposer's address: 0x6Ac3339Ae3C446ef370ac81e7fAb0DB27488Dc0E
Voter 1's address: 0xbA18b4E0235233E766cc4aA00bCF9D920ec5E167
Voter 2's address: 0x3A74615f0ccDe99EA804c67374c7C314C595291f
Voter 3's address: 0x16A3cB06C35EF3D7973188a6159D98E1822F0f1F


Deploying contracts compiled with Hardhat config settings:

  solidity: {
    version: 0.8.20,
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: paris,
    },
  }
  
Deploying ProposalRegistry...
ProposalRegistry deployed to: 0xEBEe03A45178F23E7E171f580ba15AB8cBdAD087
Deploying NFT Voting contract...
NFT Voting contract deployed to: 0x8B453FFA294F91e4bd1858eDD3cF860A483fF3e4
Deploying Timelock contract...
Timelock contract deployed to: 0x3A9b665684cb31925131FC783b501c7e45b9B04c
Deploying Governor contract...
Governor contract deployed to: 0x169732B7AB77575e073C56Ec5493110e2b817108
Deploying Treasury contract...
Treasury contract deployed to: 0x522989F0585c4Bc2eb02d27EF8Eb62Ea0ae0C4b1


Granting roles to Timelock contract...
Proposer role granted to Governor contract address: 0x169732B7AB77575e073C56Ec5493110e2b817108
Executor role granted to address zero: 0x0000000000000000000000000000000000000000
Admin role revoked from deployer address: 0xD277E6b5AaB37fC7723e3449BAFF844BE39db79C
Roles granted to Timelock contract successfully


Granting minter roles to known voter addresses...
Minter role granted to voter 1 address: 0xbA18b4E0235233E766cc4aA00bCF9D920ec5E167
Minter role granted to voter 2 address: 0x3A74615f0ccDe99EA804c67374c7C314C595291f
Minter role granted to voter 3 address: 0x16A3cB06C35EF3D7973188a6159D98E1822F0f1F
*/
