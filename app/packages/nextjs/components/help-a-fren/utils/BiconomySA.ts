import { BiconomySmartAccountV2, DEFAULT_ENTRYPOINT_ADDRESS } from "@biconomy/account";
import { Bundler, IBundler } from "@biconomy/bundler";
import { ChainId } from "@biconomy/core-types";
import { DEFAULT_ECDSA_OWNERSHIP_MODULE, ECDSAOwnershipValidationModule } from "@biconomy/modules";
import { BiconomyPaymaster, IPaymaster } from "@biconomy/paymaster";
import { ExternalProvider, JsonRpcProvider, Web3Provider } from "@ethersproject/providers";
import * as dotenv from "dotenv";
import { ethers } from "ethers";

dotenv.config();

export const BUNDLER: IBundler = new Bundler({
  bundlerUrl: "https://bundler.biconomy.io/api/v2/80001/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44",
  chainId: ChainId.POLYGON_MUMBAI,
  entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
});

export const PAYMASTER: IPaymaster = new BiconomyPaymaster({
  paymasterUrl: `https://paymaster.biconomy.io/api/v1/80001/${
    process.env.NEXT_PUBLIC_BICONOMY_API_KEY || "ykCaN2C9D.2d07f6c4-a00f-481b-b2a3-038c525035d9"
  }`,
});

export const BiconomySmartAccount = async (rpcProvider: any, isDeployer: boolean) => {
  try {
    // Setup biconomy smart account
    let web3Provider: any;
    if (!isDeployer) {
      web3Provider = new ethers.providers.Web3Provider(rpcProvider);
    } else {
      const alchemyProvider = new ethers.providers.AlchemyProvider(
        "maticmum",
        process.env.NEXT_PUBLIC_ALCHEMY_KEY || "2olqx6rQSWK3TThRmPvylRkNPbD0dDNj",
      );
      web3Provider = new ethers.Wallet(process.env.NEXT_PUBLIC_DEPLOYER_PK!, alchemyProvider);
    }
    const ownershipModule = await ECDSAOwnershipValidationModule.create({
      signer: !isDeployer ? web3Provider.getSigner() : web3Provider,
      moduleAddress: DEFAULT_ECDSA_OWNERSHIP_MODULE,
    });
    const biconomySmartAccount = await BiconomySmartAccountV2.create({
      chainId: ChainId.POLYGON_MUMBAI,
      bundler: BUNDLER,
      paymaster: PAYMASTER,
      entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
      defaultValidationModule: ownershipModule,
      activeValidationModule: ownershipModule,
    });

    return biconomySmartAccount;
  } catch (err) {
    console.log(err);
    return null;
  }
};
