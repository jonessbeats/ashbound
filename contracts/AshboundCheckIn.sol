// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// ─────────────────────────────────────────────────────────────────
// AshboundCheckIn — бесплатный ежедневный on-chain чек-ин.
// ─────────────────────────────────────────────────────────────────
//
// Дизайн-решения:
//
//   1) Один чек-ин на адрес в UTC-сутки. День считается как
//      block.timestamp / 1 days. Повторный чек-ин в те же сутки revert'ится.
//
//   2) Streak (серия): если игрок чекинился вчера — streak++.
//      Если пропустил день (или больше) — streak сбрасывается в 1.
//
//   3) Хранится: последний день чек-ина, текущий streak, лучший streak,
//      общее число чек-инов. Всё per-address.
//
//   4) Бесплатно: функция не payable, платится только газ (на Base — копейки).
//      Никаких ограничений owner'а на сам чек-ин: контракт нельзя
//      поставить на паузу, чтобы пользователи всегда могли отметиться.
//
//   5) Никаких токенов/наград в контракте — это чистый трекер активности.
//      Награды (если будут) можно начислять off-chain по данным из событий.
//
// ─────────────────────────────────────────────────────────────────

contract AshboundCheckIn {
    struct Record {
        uint64 lastDay;     // номер последнего дня чек-ина (timestamp / 1 days)
        uint32 streak;      // текущая серия подряд
        uint32 bestStreak;  // лучшая серия за всё время
        uint32 total;       // всего чек-инов
    }

    mapping(address => Record) private records;

    // Глобальный счётчик — сколько всего чек-инов сделано (для статистики).
    uint256 public totalCheckIns;

    event CheckIn(
        address indexed user,
        uint64 indexed day,
        uint32 streak,
        uint32 total
    );

    // Текущий UTC-день.
    function currentDay() public view returns (uint64) {
        return uint64(block.timestamp / 1 days);
    }

    // Отметиться за сегодня. Revert если уже отмечался сегодня.
    function checkIn() external {
        uint64 today = uint64(block.timestamp / 1 days);
        Record storage r = records[msg.sender];

        require(r.lastDay < today, "Already checked in today");

        // Streak: вчера = today-1. Если последний чек-ин был вчера — серия растёт.
        if (r.lastDay == today - 1) {
            r.streak += 1;
        } else {
            r.streak = 1; // пропустил день (или первый чек-ин) — серия с нуля
        }

        if (r.streak > r.bestStreak) {
            r.bestStreak = r.streak;
        }

        r.lastDay = today;
        r.total += 1;
        totalCheckIns += 1;

        emit CheckIn(msg.sender, today, r.streak, r.total);
    }

    // Может ли адрес чекиниться прямо сейчас (ещё не отмечался сегодня).
    function canCheckIn(address user) external view returns (bool) {
        return records[user].lastDay < uint64(block.timestamp / 1 days);
    }

    // Полные данные игрока.
    function getRecord(address user)
        external
        view
        returns (
            uint64 lastDay,
            uint32 streak,
            uint32 bestStreak,
            uint32 total
        )
    {
        Record storage r = records[user];

        // Если серия прервана (последний чек-ин раньше чем вчера) —
        // показываем что текущий streak фактически 0 (хотя в storage старое
        // значение; оно перезапишется при следующем checkIn).
        uint64 today = uint64(block.timestamp / 1 days);
        uint32 liveStreak = r.streak;
        if (r.lastDay < today - 1 && r.lastDay != 0) {
            liveStreak = 0;
        }

        return (r.lastDay, liveStreak, r.bestStreak, r.total);
    }
}
