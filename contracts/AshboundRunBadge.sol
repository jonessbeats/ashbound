// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

/// @title AshboundRunBadge
/// @notice Soulbound (non-transferable) ERC-721 badge awarded for clearing a
///         location in Ashbound. One badge per address per location. Metadata
///         is generated fully on-chain; badge images are hosted externally and
///         the base URI is fixed at deploy time.
contract AshboundRunBadge is ERC721, Ownable, Pausable {
    using Strings for uint256;

    string private _imageBaseURI;
    string[] private _locationNames;

    struct BadgeData {
        uint8 locationId;
        uint256 mintedAt;
        uint256 edition;
    }

    mapping(uint256 => BadgeData) public badges;
    mapping(address => mapping(uint8 => bool)) public hasMinted;
    mapping(uint8 => uint256) public mintedPerLocation;
    uint256 public totalMinted;

    event RunBadgeMinted(
        address indexed player,
        uint256 indexed tokenId,
        uint8 indexed locationId,
        uint256 edition,
        uint256 mintedAt
    );

    error InvalidLocation();
    error AlreadyMintedForLocation();
    error NotMintingToSelf();
    error SoulboundNonTransferable();

    constructor(
        string memory imageBaseURI_,
        string[] memory locationNames_
    ) ERC721("Ashbound Run Badge", "ASHRUN") Ownable(msg.sender) {
        require(locationNames_.length > 0, "no locations");
        require(locationNames_.length <= 255, "too many locations");
        _imageBaseURI = imageBaseURI_;
        _locationNames = locationNames_;
    }

    /// @notice Mint a badge for a cleared location. One per address per location.
    function mintRunBadge(uint8 locationId)
        external
        whenNotPaused
        returns (uint256 tokenId)
    {
        if (locationId >= _locationNames.length) revert InvalidLocation();
        if (hasMinted[msg.sender][locationId]) revert AlreadyMintedForLocation();

        hasMinted[msg.sender][locationId] = true;
        mintedPerLocation[locationId] += 1;
        uint256 edition = mintedPerLocation[locationId];

        tokenId = totalMinted;
        totalMinted += 1;

        badges[tokenId] = BadgeData({
            locationId: locationId,
            mintedAt: block.timestamp,
            edition: edition
        });

        _safeMint(msg.sender, tokenId);

        emit RunBadgeMinted(msg.sender, tokenId, locationId, edition, block.timestamp);
    }

    /// @dev Soulbound enforcement. Allows mint (from == 0) and burn (to == 0),
    ///      blocks every transfer in between.
    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) {
            revert SoulboundNonTransferable();
        }
        return super._update(to, tokenId, auth);
    }

    function approve(address, uint256) public pure override {
        revert SoulboundNonTransferable();
    }

    function setApprovalForAll(address, bool) public pure override {
        revert SoulboundNonTransferable();
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /// @notice Emergency burn. Since badges are soulbound, this is the only way
    ///         to remove a token issued in error. Resets the mint flag so the
    ///         player can re-mint correctly.
    function burn(uint256 tokenId) external onlyOwner {
        address player = _ownerOf(tokenId);
        require(player != address(0), "no token");
        uint8 loc = badges[tokenId].locationId;

        delete badges[tokenId];
        hasMinted[player][loc] = false;

        _burn(tokenId);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);

        BadgeData memory b = badges[tokenId];
        string memory locName = _locationNames[b.locationId];

        bytes memory json = abi.encodePacked(
            '{"name":"Ashbound: ', locName, ' #', b.edition.toString(), '",',
            '"description":"Soulbound proof that this player cleared ', locName,
            ' in Ashbound. Non-transferable. Mint only by completing all waves of the location.",',
            '"image":"', _imageBaseURI, uint256(b.locationId).toString(), '.png",',
            '"external_url":"https://ashbound.xyz",',
            '"attributes":[',
                '{"trait_type":"Location","value":"', locName, '"},',
                '{"trait_type":"Edition","value":', b.edition.toString(), '},',
                '{"display_type":"date","trait_type":"Minted At","value":', b.mintedAt.toString(), '},',
                '{"trait_type":"Soulbound","value":"true"}',
            ']}'
        );

        return string(
            abi.encodePacked(
                "data:application/json;base64,",
                Base64.encode(json)
            )
        );
    }

    function locationName(uint8 locationId) external view returns (string memory) {
        if (locationId >= _locationNames.length) revert InvalidLocation();
        return _locationNames[locationId];
    }

    function totalLocations() external view returns (uint256) {
        return _locationNames.length;
    }
}
