// import { IBundler, Bundler } from '@biconomy/bundler';
// import { Magic } from "magic-sdk";

// import { ChainId } from '@biconomy/core-types';
// import { DEFAULT_ENTRYPOINT_ADDRESS } from '@biconomy/account';
// import { IPaymaster, BiconomyPaymaster } from '@biconomy/paymaster';

// export const BUNDLER: IBundler = new Bundler({
//   bundlerUrl: 'https://bundler.biconomy.io/api/v2/80001/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44',
//   chainId: ChainId.POLYGON_MUMBAI,
//   entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
// });

// export const PAYMASTER: IPaymaster = new BiconomyPaymaster({
//   paymasterUrl: `https://paymaster.biconomy.io/api/v1/80001/${BICONOMY_PAYMASTER_KEY}`,
// });

// export const MAGIC = () => {
//   if (typeof window !== "undefined") {
//     return new Magic(process.env.NEXT_PUBLIC_MAGIC_API_KEY!, {
//       network: {
//         // rpcUrl: 'https://rpc-mumbai.maticvigil.com/',
//         rpcUrl: `https://polygon-mumbai.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY!}}`,
//         chainId: 80001, // or preferred chain
//       },
//     });
//   } else {
//     return null;
//   }
// };

export const TEST_WALLET = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
export const TREASURY_WALLET = "0x522989F0585c4Bc2eb02d27EF8Eb62Ea0ae0C4b1";
