// import { HardhatRuntimeEnvironment } from "hardhat/types";
// import { DeployFunction } from "hardhat-deploy/types";

// /**
//  * Deploys a contract named "HelpAFrenTimelock" using the deployer account and
//  * constructor arguments set to the deployer address
//  *
//  * @param hre HardhatRuntimeEnvironment object.
//  */
// const deployHelpAFrenTimelock: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
//   /*
//     On localhost, the deployer account is the one that comes with Hardhat, which is already funded.

//     When deploying to live networks (e.g `yarn deploy --network goerli`), the deployer account
//     should have sufficient balance to pay for the gas fees for contract creation.

//     You can generate a random account with `yarn generate` which will fill DEPLOYER_PRIVATE_KEY
//     with a random private key in the .env file (then used on hardhat.config.ts)
//     You can run the `yarn account` command to check your balance in every network.
//   */

//   const { deployer } = await hre.getNamedAccounts();
//   const { deploy } = hre.deployments;

//   const [account1, account2, account3] = await hre.getUnnamedAccounts();

//   const deployedHelpAFrenTimelock = await deploy("HelpAFrenTimelock", {
//     from: deployer,
//     // Contract constructor arguments, (uint256 minDelay,	address[] memory proposers,	address[] memory executors,	address admin)
//     args: [0, [account1, account2, account3], [deployer], "0x0000000000000000000000000000000000000000"],
//     log: true,
//     // autoMine: can be passed to the deploy function to make the deployment process faster on local networks by
//     // automatically mining the contract deployment transaction. There is no effect on live networks.
//     autoMine: true,
//   });

//   const helpAFrenTimelockDeployedAddress = deployedHelpAFrenTimelock.address;
//   console.log("helpAFrenTimelockDeployedAddress: ", helpAFrenTimelockDeployedAddress);

//   // Get the deployed contract
//   // const HelpAFrenTimelock = await hre.ethers.getContract("HelpAFrenTimelock", deployer);
// };

// export default deployHelpAFrenTimelock;

// // Tags are useful if you have multiple deploy files and only want to run one of them.
// // e.g. yarn deploy --tags HelpAFrenTimelock
// deployHelpAFrenTimelock.tags = ["HelpAFrenTimelock"];
