# Ashbound: Base Survivors

Mobile-first pixel RPG survivor roguelite для Base App / web. Игрок отбивается
от бесконечных волн врагов, прокачивается, а после смерти может заминтить
NFT-бейдж за свой run прямо в сети Base.

Стек: **Next.js 14 · TypeScript · TailwindCSS · Phaser 3 · wagmi · viem · Solidity (ERC-721)**.

---

## Быстрый старт

```bash
npm install
npm run dev
```

Открой `http://localhost:3000`. Игра запускается с placeholder-графикой
(текстуры генерируются кодом в `BootScene`) — внешние ассеты не нужны.

Скопируй `.env.example` → `.env.local` и заполни переменные (без них игра
работает, но минт бейджа будет недоступен).

---

## Команды

| Команда | Что делает |
|---|---|
| `npm run dev` | Дев-сервер на :3000 |
| `npm run build` | Продакшен-сборка |
| `npm run start` | Запуск собранного приложения |
| `npm run lint` | Проверка ESLint |
| `npm run smoketest` | Браузерный смоук-тест (нужен Playwright, см. ниже) |
| `npm run contracts:compile` | Компиляция контракта (нужен Hardhat) |
| `npm run contracts:deploy` | Деплой на Base Sepolia |

---

## Деплой

### Фронтенд — Vercel

```bash
npm install -g vercel
vercel
```

Задай переменные окружения в настройках проекта Vercel (см. `.env.example`).

### Контракт — Base Sepolia

Hardhat-зависимости ставятся отдельно (один раз):

```bash
npm install -D hardhat @nomicfoundation/hardhat-toolbox @openzeppelin/contracts dotenv
```

Затем:

```bash
npm run contracts:compile
npm run contracts:deploy
```

Скрипт выведет адрес контракта — впиши его в `.env.local`:

```
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
```

Для деплоя в `.env` нужен `DEPLOYER_PRIVATE_KEY` с тестовым ETH на Base Sepolia
(faucet: bridge.base.org / coinbase faucet).

---

## Структура проекта

```
/contracts
  AshboundRunBadge.sol      ERC-721 бейдж, метаданные генерируются on-chain
/scripts
  deploy.ts                 Hardhat-скрипт деплоя
/src
  /app
    layout.tsx              Root layout + viewport + Providers
    page.tsx                Переключение Main Menu <-> игра
    globals.css
  /components
    MainMenu.tsx            Главный экран
    GameContainer.tsx       Монтирует Phaser, накладывает React-UI
    HUD.tsx                 HP / XP / таймер / счёт
    Joystick.tsx            Виртуальный джойстик (mobile)
    UpgradeModal.tsx        Выбор апгрейда при level up
    GameOverModal.tsx       Экран смерти + минт бейджа
    WalletConnect.tsx       Подключение кошелька
    Providers.tsx           WagmiProvider + React Query
  /game
    phaserGame.ts           Создание Phaser-инстанса
    BootScene.ts            Генерация placeholder-текстур
    GameScene.ts            Весь геймплей
    Player.ts / Enemy.ts / Projectile.ts / XPOrb.ts
    config.ts               Все игровые константы
    upgrades.ts             Пул апгрейдов
    types.ts                Общие типы
    EventBus.ts             Связь Phaser <-> React
  /web3
    chains.ts               Конфиг сети Base
    wagmiConfig.ts          wagmi: сети + коннекторы
    contract.ts             ABI контракта
    mintRunBadge.ts         Хук минта бейджа
    localProgress.ts        Прогресс в localStorage
```

### Связь Phaser ↔ React

Phaser-сцена и React общаются через единый `EventBus` (`src/game/EventBus.ts`) —
без Redux и state-машин. Сцена эмитит `HUD_UPDATE` / `LEVEL_UP` / `GAME_OVER`,
React эмитит `MOVE_INPUT` / `UPGRADE_PICKED` / `RESTART`.

---

## Геймплей

Управление: виртуальный джойстик слева (mobile) или WASD / стрелки (desktop).
Атака автоматическая — болт летит в ближайшего врага. XP с убитых врагов
притягивается к игроку; на level up игра встаёт на паузу и предлагает 3 апгрейда.
Сложность растёт каждые 30 секунд. Все игровые числа — в `src/game/config.ts`.

---

## Тесты

`smoketest.cjs` прогоняет меню → старт → рендер canvas → геймплей в эмуляции
iPhone. Нужен Playwright с браузером:

```bash
npx playwright install chromium
npm run smoketest
```

---

## Известные ограничения и Roadmap

**Сейчас (MVP):**
- Placeholder-графика (цветные фигуры) — генерируется в `BootScene`
- Один тип оружия (Firebolt), одна арена
- Минт NFT на Base Sepolia (testnet)

**Дальше:**
- Заменить placeholder-текстуры на настоящий pixel-art (`/public/assets`)
- Доп. оружие: Sword Aura, Orbit Rune, Chain Lightning (ТЗ §25)
- Босс на 5-й минуте
- OnchainKit для более гладкого wallet-UX в Base App
- Деплой контракта на Base Mainnet
- Опциональный Supabase-лидерборд
- Звук и музыка
- Полировка: эффекты, частицы, экран загрузки

**Технический долг:**
- `next.config.mjs` гасит warnings опциональных RN-зависимостей wagmi —
  при апдейте wagmi проверить, актуально ли ещё
```
