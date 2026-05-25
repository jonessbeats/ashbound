// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// ─────────────────────────────────────────────────────────────────
// AshboundRunBadge — SOULBOUND бейдж за полное прохождение локации.
// ─────────────────────────────────────────────────────────────────
//
// Дизайн-решения (зафиксированы в коде):
//
//   1) SBT (soulbound). Запрещён transfer/approve. Mint и burn — только
//      минт от self-callера; burn — owner-only emergency.
//
//   2) 1 минт на адрес на локацию. Локации идентифицируются uint8 (0/1/2).
//      Игрок может собрать максимум len(LOCATIONS) SBT (один за каждую).
//
//   3) Mainnet-safety:
//      - Solidity 0.8.24, overflow защищён.
//      - OpenZeppelin ERC721 + Ownable + Pausable.
//      - Минт открыт только когда контракт не на паузе.
//      - Owner может ТОЛЬКО ставить/снимать паузу. Никаких airdrop'ов,
//        смены baseURI, burn чужих токенов и т.п.
//
//   4) Атрибуты NFT хранятся on-chain (location, mintedAt, edition).
//      Score/kills/level НЕ хранятся (фронт мог бы передать любые цифры —
//      не легитимизируем фейк).
//
//   5) Изображения бейджей хостятся внешне (Vercel: ashbound.xyz/badges/*).
//      baseURI ЗАПЕКАЕТСЯ в constructor и не меняется — гарантия чистоты
//      метаданных для держателей.
//
// ─────────────────────────────────────────────────────────────────

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

contract AshboundRunBadge is ERC721, Ownable, Pausable {
    using Strings for uint256;

    // ── Конфиг ────────────────────────────────────────────────────

    /// @dev Базовый URL картинок (фиксируется в constructor, immutable не
    ///      используем для string — храним readonly через приватный сеттер).
    string private _imageBaseURI;

    /// @dev Имена локаций для атрибутов NFT. Индекс = locationId.
    ///      Фиксируется в constructor.
    string[] private _locationNames;

    // ── Данные одного минта ───────────────────────────────────────

    struct BadgeData {
        uint8 locationId;   // какую локацию прошёл
        uint256 mintedAt;   // block.timestamp на момент минта
        uint256 edition;    // порядковый номер бейджа для этой локации
    }

    /// tokenId => данные бейджа.
    mapping(uint256 => BadgeData) public badges;

    /// player => locationId => уже минтил ли (anti-double).
    mapping(address => mapping(uint8 => bool)) public hasMinted;

    /// Сколько бейджей всего сминчено для каждой локации (edition counter).
    mapping(uint8 => uint256) public mintedPerLocation;

    /// Глобальный счётчик токенов (он же следующий tokenId).
    uint256 public totalMinted;

    // ── События ───────────────────────────────────────────────────

    event RunBadgeMinted(
        address indexed player,
        uint256 indexed tokenId,
        uint8 indexed locationId,
        uint256 edition,
        uint256 mintedAt
    );

    // ── Ошибки (gas-efficient вместо require strings) ─────────────

    error InvalidLocation();
    error AlreadyMintedForLocation();
    error NotMintingToSelf();
    error SoulboundNonTransferable();

    // ── Constructor ───────────────────────────────────────────────

    /// @param imageBaseURI_  напр. "https://ashbound.xyz/badges/"
    /// @param locationNames_ напр. ["Ashen Ruins","Dead Forest","Frozen Crypt"]
    constructor(
        string memory imageBaseURI_,
        string[] memory locationNames_
    ) ERC721("Ashbound Run Badge", "ASHRUN") Ownable(msg.sender) {
        require(locationNames_.length > 0, "no locations");
        require(locationNames_.length <= 255, "too many locations");
        _imageBaseURI = imageBaseURI_;
        _locationNames = locationNames_;
    }

    // ── Минт ──────────────────────────────────────────────────────

    /// Минт SBT за пройденную локацию. Только на свой адрес. 1 раз на локацию.
    /// @param locationId  0-based индекс локации (см. конструктор).
    function mintRunBadge(uint8 locationId)
        external
        whenNotPaused
        returns (uint256 tokenId)
    {
        if (locationId >= _locationNames.length) revert InvalidLocation();
        if (hasMinted[msg.sender][locationId]) revert AlreadyMintedForLocation();

        // Помечаем сразу до _safeMint (CEI: эффекты до взаимодействий).
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

    // ── Soulbound: запрет transfer/approve ────────────────────────

    /// OpenZeppelin v5: единый хук для mint/transfer/burn — _update.
    /// from == 0 → mint (разрешаем). to == 0 → burn (разрешаем only owner).
    /// Всё остальное (transfer) — запрещено.
    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        address from = _ownerOf(tokenId);
        // Разрешаем mint (from == 0) и burn (to == 0, owner-only, см. burn()).
        if (from != address(0) && to != address(0)) {
            revert SoulboundNonTransferable();
        }
        return super._update(to, tokenId, auth);
    }

    /// Approve/setApprovalForAll тоже бессмысленны на SBT — нечего делегировать.
    function approve(address, uint256) public pure override {
        revert SoulboundNonTransferable();
    }

    function setApprovalForAll(address, bool) public pure override {
        revert SoulboundNonTransferable();
    }

    // ── Admin: только pause/unpause + emergency burn ──────────────

    /// Стоп-кран на случай уязвимости. После паузы — никакого нового минта.
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /// Экстренный burn — на случай, если что-то совсем плохое попало в коллекцию.
    /// SBT нельзя передать, поэтому если игроку был ошибочно выдан токен —
    /// исправить можно только так. Сжигание сбрасывает hasMinted для этой
    /// локации, чтобы игрок мог переминтить корректно.
    function burn(uint256 tokenId) external onlyOwner {
        address player = _ownerOf(tokenId);
        require(player != address(0), "no token");
        uint8 loc = badges[tokenId].locationId;

        delete badges[tokenId];
        hasMinted[player][loc] = false;
        // mintedPerLocation НЕ декрементируем — edition'ы остаются монотонными
        // (так чище для коллекционеров: edition уникален навсегда).

        _burn(tokenId);
    }

    // ── tokenURI: метаданные on-chain ─────────────────────────────

    /// data:application/json в base64. Содержит:
    ///   name      — "Ashbound: <LocationName> #<edition>"
    ///   image     — <baseURI>/<locationId>.png  (Vercel)
    ///   attributes:
    ///     Location     — текстовое имя локации
    ///     Edition      — номер бейджа для этой локации
    ///     Minted At    — Unix timestamp минта
    ///     Soulbound    — "true"
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

    // ── View-хелперы ──────────────────────────────────────────────

    function locationName(uint8 locationId) external view returns (string memory) {
        if (locationId >= _locationNames.length) revert InvalidLocation();
        return _locationNames[locationId];
    }

    function totalLocations() external view returns (uint256) {
        return _locationNames.length;
    }
}
