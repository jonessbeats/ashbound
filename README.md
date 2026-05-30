# Ashbound: Base Survivors

> Mobile-first pixel RPG survivor roguelite, fully onchain on **Base**.

Survive endless waves, clear locations, level up your loadout, and mint NFT badges for your runs — all onchain. Built as a Base App-ready web game with wallet-native progression.

**Live:** [ashbound.xyz](https://ashbound.xyz) · **Chain:** Base Mainnet (8453)

---

## Features

- **Survivor roguelite gameplay** — auto-attacking weapons, wave-based survival, escalating difficulty
- **6-weapon system** — sword, axe, dagger, spear, bow, staff, each with unique behavior (melee arcs, homing projectiles, piercing). Up to 4 simultaneous weapon slots
- **5 handcrafted locations** with distinct enemies, bosses, and difficulty curves
- **13 enemy types** + boss fights with multi-phase fire attacks
- **Onchain NFT badges** — mint an ERC-721 badge per cleared location (Base mainnet)
- **Daily onchain check-in** — free, streak-tracking GM mechanic
- **Builder Code attribution** — all transactions carry onchain attribution
- **Mobile-first** — touch joystick, responsive canvas, designed for phones

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14 (App Router) · TypeScript |
| Game engine | Phaser 3 |
| Styling | TailwindCSS |
| Web3 | wagmi · viem · ox |
| Contracts | Solidity (ERC-721) · Hardhat |
| Chain | Base (mainnet + Sepolia) |
| Deploy | Vercel |

---

## Smart Contracts

| Contract | Purpose | Standard |
|---|---|---|
| `AshboundRunBadge.sol` | Per-location NFT badges, minted on clear | ERC-721 |
| `AshboundCheckIn.sol` | Free daily onchain check-in with streak tracking | Custom |

Both deployed and verified on Base Mainnet.

---

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. The game boots with code-generated placeholder textures — no external assets required to run.

Copy `.env.example` → `.env.local` and fill in the variables (the game runs without them, but minting requires the contract addresses).

```env
NEXT_PUBLIC_CHAIN_ID=8453
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_CHECKIN_ADDRESS=0x...
```

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Dev server on :3000 |
| `npm run build` | Production build |
| `npm run contracts:compile` | Compile Solidity contracts |
| `npm run contracts:deploy` | Deploy badge contract to Base Sepolia |
| `npm run contracts:deploy:mainnet` | Deploy badge contract to Base Mainnet |

---

## Architecture

```
src/
├── app/              Next.js routes + layout
├── components/       React UI (HUD, menus, modals, wallet)
├── game/             Phaser game logic
│   ├── GameScene.ts      Main gameplay loop
│   ├── BootScene.ts      Asset loading + animations
│   ├── Enemy.ts          Enemy entity + AI
│   ├── Boss.ts           Boss entity + phases
│   ├── locations.ts      Location/wave configuration
│   ├── upgrades.ts       Level-up system
│   └── weapons/          Weapon system (manager, types, projectiles)
└── web3/             wagmi config, contract ABIs, hooks
```

The game communicates with React through a lightweight `EventBus` — Phaser emits gameplay events (HUD updates, level-ups, game over), React renders the UI layer on top of the canvas.

---

## License

All rights reserved. Game code is source-available for review; assets are licensed separately (see asset credits in-repo).
