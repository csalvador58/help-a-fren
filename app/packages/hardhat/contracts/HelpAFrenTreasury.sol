// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract HelpAFrenTreasury is Ownable {
	uint256 public totalBalance;
	bool public isLocked;
    address private _owner;

	event Deposit(address indexed sender, uint256 amount, uint256 balance);
	event Withdrawn(address indexed payee, uint256 amount, uint256 balance);

	constructor(address timelockAddress) payable Ownable(timelockAddress) {
		_owner = timelockAddress;
		totalBalance += msg.value;
		isLocked = false;
	}

    function getTotalBalance() public view returns (uint256) {
        return totalBalance;
    }

	// allow owner to lock the treasury to halt new deposits
	function lockTreasury() public onlyOwner {
		isLocked = true;
	}
	// allow owner to lock the treasury to resume new deposits
	function unlockTreasury() public onlyOwner {
		isLocked = false;
	}

	function deposit() public payable {
		require(!isLocked, "Treasury is locked. No longer accepting deposits");
		totalBalance += msg.value;
		emit Deposit(msg.sender, msg.value, totalBalance);
	}

	function withdraw(address payable payee, uint256 amount) public onlyOwner {
		require(totalBalance >= amount, "Insufficient balance.");
		totalBalance -= amount;
		payee.transfer(amount);
		emit Withdrawn(payee, amount, totalBalance);
	}
}
