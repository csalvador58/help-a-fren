// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Votes.sol";

contract HelpAFrenVoteToken is ERC721, ERC721Enumerable, ERC721URIStorage, ERC721Burnable, AccessControl, EIP712, ERC721Votes {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    uint256 private _nextTokenId;

    // map the address to the token id
    mapping(address => uint256) public tokenIds;

    constructor(address defaultAdmin, address minter)
        ERC721("HelpAFrenToken", "HAF")
        EIP712("HelpAFrenToken", "1")
    {
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(MINTER_ROLE, minter);
    }

    function safeMint(address to, string memory uri) public onlyRole(MINTER_ROLE) {
        // require to address to not already have a token
        require(balanceOf(to) == 0, "Address already has a voting token");

        // Mint token is address does not have a token
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }


    // Allow Admin or Minter to burn token
    function burn(uint256 tokenId) public override {
        require(ownerOf(tokenId) == msg.sender || hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Caller is not owner nor admin");
        super.burn(tokenId);
    }

    // Do not allow transfer of tokens
    function transferFrom(address from, address to, uint256 tokenId) public override(ERC721, IERC721) {
        // Make token soulbound only allowing to mint and burn token
        require(from == address(0) || to == address(0), "Transferring token is not allowed");
        _update(to, tokenId, msg.sender);
    }

    // The following functions are overrides required by Solidity.

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable, ERC721Votes)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable, ERC721Votes)
    {
        super._increaseBalance(account, value);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}