// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title AshboundCheckIn
/// @notice Free daily on-chain check-in with streak tracking. One check-in per
///         UTC day per address. Tracks current streak, best streak, and total
///         check-ins. No token, no payable, no owner controls — purely an
///         activity tracker that anyone can always use.
contract AshboundCheckIn {
    struct Record {
        uint64 lastDay;
        uint32 streak;
        uint32 bestStreak;
        uint32 total;
    }

    mapping(address => Record) private records;

    uint256 public totalCheckIns;

    event CheckIn(
        address indexed user,
        uint64 indexed day,
        uint32 streak,
        uint32 total
    );

    /// @notice Current UTC day (timestamp / 1 day).
    function currentDay() public view returns (uint64) {
        return uint64(block.timestamp / 1 days);
    }

    /// @notice Check in for today. Reverts if already checked in this UTC day.
    ///         Streak increments if yesterday was the last check-in, otherwise
    ///         resets to 1.
    function checkIn() external {
        uint64 today = uint64(block.timestamp / 1 days);
        Record storage r = records[msg.sender];

        require(r.lastDay < today, "Already checked in today");

        if (r.lastDay == today - 1) {
            r.streak += 1;
        } else {
            r.streak = 1;
        }

        if (r.streak > r.bestStreak) {
            r.bestStreak = r.streak;
        }

        r.lastDay = today;
        r.total += 1;
        totalCheckIns += 1;

        emit CheckIn(msg.sender, today, r.streak, r.total);
    }

    /// @notice True if the address has not checked in yet today.
    function canCheckIn(address user) external view returns (bool) {
        return records[user].lastDay < uint64(block.timestamp / 1 days);
    }

    /// @notice Full record for a player. The returned streak reads as 0 if the
    ///         streak is broken (last check-in earlier than yesterday); storage
    ///         is corrected on the next checkIn call.
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

        uint64 today = uint64(block.timestamp / 1 days);
        uint32 liveStreak = r.streak;
        if (r.lastDay < today - 1 && r.lastDay != 0) {
            liveStreak = 0;
        }

        return (r.lastDay, liveStreak, r.bestStreak, r.total);
    }
}
