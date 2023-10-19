import { HAF_TREASURY_ADDRESS } from "../../../hardhat/utils/constants";
import { Address, Balance } from "~~/components/scaffold-eth";
import { TEST_WALLET } from "~~/utils/constants";

type HafTreasuryProps = {
  nftBalance: string;
  votingPower: string;
};

const HafTreasury = ({nftBalance, votingPower}: HafTreasuryProps) => {
  return (
    <div>
      <div className="card w-96 glass shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Current Account</h2>
          <Address address={TEST_WALLET} />
          <ul>
            <li>NFT Balance: {nftBalance?.toString() || "Loading..."}</li>
            <li>Voting Power: {votingPower?.toString() || "Loading..."}</li>
          </ul>
          <h2 className="card-title">Help a Fren Treasury</h2>
          <Address address={HAF_TREASURY_ADDRESS} />
          <div>
            <div>Treasury Balance: </div>
            <Balance address={HAF_TREASURY_ADDRESS} className="min-h-0 h-auto" />
          </div>
          <div>*Need Deposit Input*</div>
        </div>
      </div>
    </div>
  );
};

export default HafTreasury;
