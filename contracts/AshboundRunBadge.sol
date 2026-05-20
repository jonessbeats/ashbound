// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// ─────────────────────────────────────────────────────────────────
// AshboundRunBadge — ERC-721 бейдж за пройденный run (ТЗ §36–38).
// Каждый NFT = доказательство, что игрок выжил в волнах Ashbound.
// Контракт намеренно простой: OpenZeppelin, events, owner-protection.
// ─────────────────────────────────────────────────────────────────

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

contract AshboundRunBadge is ERC721, Ownable {
    using Strings for uint256;

    // ── Данные одного run, привязанные к tokenId (ТЗ §32) ──
    struct RunData {
        uint256 score;
        uint256 survivalTime; // секунды
        uint256 level;
        uint256 kills;
        uint256 mintedAt; // block.timestamp минта
    }

    // tokenId => данные run.
    mapping(uint256 => RunData) public runs;

    // Счётчик выданных токенов. Также служит следующим tokenId.
    uint256 public totalMinted;

    // Событие минта — фронтенд слушает его после транзакции (ТЗ §38).
    event RunBadgeMinted(
        address indexed player,
        uint256 indexed tokenId,
        uint256 score,
        uint256 survivalTime,
        uint256 level,
        uint256 kills
    );

    // constructor: задаём имя/символ коллекции и владельца контракта.
    constructor() ERC721("Ashbound Run Badge", "ASHRUN") Ownable(msg.sender) {}

    // ── Главная функция: минт бейджа за конкретный run (ТЗ §37) ──
    // Любой игрок может заминтить бейдж за свой собственный адрес.
    function mintRunBadge(
        address player,
        uint256 score,
        uint256 survivalTime,
        uint256 level,
        uint256 kills
    ) external returns (uint256 tokenId) {
        // Защита: нельзя минтить на чужой адрес и на нулевой адрес.
        require(player == msg.sender, "Can only mint to self");
        require(player != address(0), "Zero address");

        tokenId = totalMinted; // tokenId идут по порядку с 0
        totalMinted += 1;

        // Сохраняем данные run onchain.
        runs[tokenId] = RunData({
            score: score,
            survivalTime: survivalTime,
            level: level,
            kills: kills,
            mintedAt: block.timestamp
        });

        _safeMint(player, tokenId);

        emit RunBadgeMinted(player, tokenId, score, survivalTime, level, kills);
    }

    // ── tokenURI: метаданные NFT генерируются onchain (ТЗ §33–34) ──
    // Возвращаем data:application/json в base64 — без IPFS и бэкенда.
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId); // revert, если токена нет

        RunData memory r = runs[tokenId];

        // JSON-метаданные с атрибутами run.
        string memory json = string(
            abi.encodePacked(
                '{"name":"Ashbound Run #', tokenId.toString(), '",',
                '"description":"Proof that this player survived the Ashbound waves on Base.",',
                '"attributes":[',
                    '{"trait_type":"Score","value":', r.score.toString(), '},',
                    '{"trait_type":"Survival Time","value":', r.survivalTime.toString(), '},',
                    '{"trait_type":"Level","value":', r.level.toString(), '},',
                    '{"trait_type":"Kills","value":', r.kills.toString(), '},',
                    '{"trait_type":"Minted At","value":', r.mintedAt.toString(), '}',
                ']}'
            )
        );

        return string(
            abi.encodePacked(
                "data:application/json;base64,",
                Base64.encode(bytes(json))
            )
        );
    }

    // ── View-хелпер: вернуть данные run одним вызовом ──
    function getRun(uint256 tokenId) external view returns (RunData memory) {
        _requireOwned(tokenId);
        return runs[tokenId];
    }
}
