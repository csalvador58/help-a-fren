import { RPCError, RPCErrorCode } from "magic-sdk";
import { Magic } from "magic-sdk";

export const MagicLogin = async (option: boolean) => {
  try {
    if (typeof window !== "undefined") {
      const MAGIC = new Magic(process.env.NEXT_PUBLIC_MAGIC_API_KEY || "pk_live_41151D8CF6250197", {
        network: {
          rpcUrl: `https://polygon-mumbai.g.alchemy.com/v2/${
            process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || "2olqx6rQSWK3TThRmPvylRkNPbD0dDNj"
          }}`,
          chainId: 80001, // or preferred chain
        },
      });

      if (!option) {
        await MAGIC.user.logout();
        console.log("Magic logged out");
        return null;
      } else {
        if (await MAGIC.user.isLoggedIn()) {
          return MAGIC;
        } else {
          await MAGIC.wallet.connectWithUI();
          return MAGIC;
        }
      }
    } else {
      console.log("Magic not available");
      return null;
    }
  } catch (err) {
    if (err instanceof RPCError) {
      switch (err.code) {
        case RPCErrorCode.MagicLinkFailedVerification:
          console.log("Magic link failed");
          break;
        case RPCErrorCode.MagicLinkExpired:
          console.log("Magic link timeout");
          break;
        case RPCErrorCode.InternalError:
          console.log("Magic link cancelled");
          break;
        case RPCErrorCode.InvalidRequest:
          console.log("Magic link invalid email");
          break;
        case RPCErrorCode.MagicLinkRateLimited:
          console.log("Magic link rate limited");
          break;
      }
    }
  }
};
