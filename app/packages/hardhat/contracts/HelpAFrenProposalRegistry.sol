// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract HelpAFrenProposalRegistry is AccessControl {
	struct Proposal {
		uint256 id;
		string uri;
		address proposer;
	}

	constructor(address defaultAdmin) {
		_grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
	}

	Proposal[] public proposals;

	function addProposal(
		uint256 _id,
		string memory _uri,
		address _proposer
	) public onlyRole(DEFAULT_ADMIN_ROLE) {
		Proposal memory newProposal = Proposal(_id, _uri, _proposer);
		proposals.push(newProposal);
	}

	function getAllProposals() public view returns (Proposal[] memory) {
		return proposals;
	}

	 function getProposal(
        uint256 index
    ) public view returns (Proposal memory) {
        require(index < proposals.length, "Index out of range");
        return (proposals[index]);
    }

    function removeProposal(uint256 index) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(index < proposals.length, "Index out of range");
        proposals[index] = proposals[proposals.length - 1];
        proposals.pop();
    }
}