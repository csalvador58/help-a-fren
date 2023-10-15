import { RPCError, RPCErrorCode } from "magic-sdk";
import { Magic } from "magic-sdk";

export const MagicLogin = async () => {
  try {
    if (typeof window !== "undefined") {
      const MAGIC = new Magic(process.env.NEXT_PUBLIC_MAGIC_API_KEY!, {
        network: {
          rpcUrl: `https://polygon-mumbai.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY!}}`,
          chainId: 80001, // or preferred chain
        },
      });

      const email = ""; // Set to empty string to force Magic to show UI
      if (!!email && !!MAGIC) {
        // console.log('Logging in Magic with email: ', email);
        const response = await MAGIC.auth.loginWithEmailOTP({ email: email });
        // console.log("response: ", response);
        return { response, MAGIC };
      } else {
        const response = await MAGIC.wallet.connectWithUI();
        // console.log("response: ", response);
        return { response, MAGIC };
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
