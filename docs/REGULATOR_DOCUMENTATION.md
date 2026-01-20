# Regulator Documentation

## Platform Overview

This document provides comprehensive documentation of the Goal Betting platform's backend systems, designed to demonstrate full regulatory compliance without requiring external game/sports API connections.

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Sandbox Sports Engine](#sandbox-sports-engine)
3. [Sandbox Casino Engine](#sandbox-casino-engine)
4. [Wallet & Ledger System](#wallet--ledger-system)
5. [Settlement Engine](#settlement-engine)
6. [GGR & Commission Reports](#ggr--commission-reports)
7. [Audit Trail](#audit-trail)
8. [Testing Guide](#testing-guide)
9. [API Reference](#api-reference)

---

## 1. System Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                        │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API Layer                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Sports    │  │   Casino    │  │   Wallet    │              │
│  │    APIs     │  │    APIs     │  │    APIs     │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Business Logic Layer                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ Sandbox Sports  │  │ Sandbox Casino  │  │   Settlement    │  │
│  │     Engine      │  │     Engine      │  │     Engine      │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                              │                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Ledger Engine                             ││
│  │           (Double-Entry Bookkeeping)                         ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Data Layer                                 │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐    │
│  │   Bets    │  │  Casino   │  │  Ledger   │  │   Audit   │    │
│  │           │  │  Rounds   │  │  Entries  │  │   Logs    │    │
│  └───────────┘  └───────────┘  └───────────┘  └───────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Key Principles

1. **No Direct Balance Edits**: All balance changes go through the ledger
2. **Immutable Audit Trail**: Every action is logged
3. **Double-Entry Bookkeeping**: Every transaction has debit and credit
4. **Server-Side Enforcement**: All limits enforced on server, not UI

---

## 2. Sandbox Sports Engine

**Location**: `lib/sandbox/sports-engine.js`

### Capabilities

- Create demo events (matches)
- Manage markets and odds
- Accept single and multi-selection bets
- **Enforce MAX WINNING LIMIT (server-side)**
- Validate bet slips before placement

### Multi-Selection Slip with Max-Win Enforcement

The system enforces a maximum winning limit, not stake limit:

```javascript
// Example: Max Winning = 500,000

// Scenario 1: ALLOWED
// Stake: 1,000 | Odds: 50.0 | Potential Win: 50,000 ✓

// Scenario 2: BLOCKED
// Stake: 10,000 | Odds: 100.0 | Potential Win: 1,000,000 ✗
// Error: "Potential winning 1,000,000 exceeds maximum allowed 500,000"
// Suggested max stake: 5,000
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/sandbox/sports/events` | GET | List available events |
| `/api/sandbox/sports/events` | POST | Create demo event |
| `/api/sandbox/sports/bets` | GET | Get user's bets |
| `/api/sandbox/sports/bets` | POST | Place bet |
| `/api/sandbox/sports/validate` | POST | Validate bet slip |
| `/api/sandbox/sports/settle` | POST | Settle events |

### Testing Multi-Selection Max-Win

```bash
# 1. Create test event
curl -X POST /api/sandbox/sports/events \
  -H "Authorization: Bearer <admin_token>" \
  -d '{
    "sportId": "<sport_id>",
    "leagueId": "<league_id>",
    "homeTeam": { "name": "Team A" },
    "awayTeam": { "name": "Team B" },
    "startTime": "2025-12-20T15:00:00Z",
    "odds": { "home": 2.0, "draw": 3.5, "away": 3.0 }
  }'

# 2. Validate bet (check max-win enforcement)
curl -X POST /api/sandbox/sports/validate \
  -H "Authorization: Bearer <player_token>" \
  -d '{
    "selections": [
      { "eventId": "<event_id>", "odds": 2.0, "selectionName": "Home" },
      { "eventId": "<event_id_2>", "odds": 3.0, "selectionName": "Away" }
    ],
    "stake": 100000
  }'
# Response will show if max-win is exceeded

# 3. Place bet
curl -X POST /api/sandbox/sports/bets \
  -H "Authorization: Bearer <player_token>" \
  -d '{
    "selections": [...],
    "stake": 1000,
    "betType": "multiple"
  }'
```

---

## 3. Sandbox Casino Engine

**Location**: `lib/sandbox/casino-engine.js`

### Games Implemented

| Game | House Edge | RTP |
|------|------------|-----|
| Dice | 1% | 99% |
| Crash | 1% | 99% |
| Mines | 1% | 99% |

### Provably Fair System

Every casino round uses cryptographic verification:

```javascript
// Before game starts:
serverSeedHash = SHA256(serverSeed)  // Shown to player

// After game:
random = HMAC-SHA256(serverSeed, clientSeed:nonce)
result = gameLogic(random)
serverSeed = revealed  // Player can verify
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/sandbox/casino/play` | POST | Play casino games |
| `/api/sandbox/casino/verify` | GET | Verify game fairness |
| `/api/sandbox/casino/stats` | GET | RTP statistics |

### Testing Provably Fair

```bash
# 1. Play a game
curl -X POST /api/sandbox/casino/play \
  -H "Authorization: Bearer <token>" \
  -d '{
    "action": "quick_play",
    "gameType": "dice",
    "stake": 10,
    "actionParams": { "target": 50, "type": "over" }
  }'

# Response includes provablyFair data

# 2. Verify the round
curl /api/sandbox/casino/verify?round=<round_number>
# Returns verification details and how to verify manually
```

---

## 4. Wallet & Ledger System

**Location**: `lib/ledger-engine.js`

### Double-Entry Bookkeeping

Every transaction creates balanced entries:

```
BET PLACEMENT:
  Debit:  Player Wallet  -100
  Credit: Bet Stakes     +100

BET WINNING:
  Debit:  Bet Payouts    -250
  Credit: Player Wallet  +250
```

### Transaction Types

- `DEPOSIT` / `WITHDRAWAL`
- `BET_PLACEMENT` / `BET_WINNING` / `BET_LOSS`
- `BONUS_CREDIT` / `BONUS_WAGERING`
- `AGENT_COMMISSION` / `AGENT_SETTLEMENT`
- `MANUAL_CREDIT` / `MANUAL_DEBIT`

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/super/ledger` | GET | View ledger entries |
| `/api/super/ledger` | POST | Manual adjustments |
| `/api/super/ledger/reports` | GET | Financial reports |
| `/api/super/ledger/statements` | GET | Account statements |

---

## 5. Settlement Engine

**Location**: `lib/sandbox/settlement-engine.js`

### Settlement Process

1. **Admin sets event result**
2. **System finds all affected bets**
3. **Each selection is evaluated**
4. **Bet outcome determined**
5. **Payouts processed via ledger**
6. **Audit log created**

### Settlement Modes

- **Automatic**: System settles based on event results
- **Manual**: Admin can override bet outcomes

### API Endpoints

```bash
# Settle an event
curl -X POST /api/sandbox/sports/settle \
  -H "Authorization: Bearer <admin_token>" \
  -d '{
    "action": "settle_event",
    "eventId": "<event_id>",
    "result": { "homeScore": 2, "awayScore": 1 }
  }'

# Manual bet settlement
curl -X POST /api/sandbox/sports/settle \
  -d '{
    "action": "manual_settle_bet",
    "betId": "<bet_id>",
    "outcome": "won",
    "reason": "Admin override for testing"
  }'
```

---

## 6. GGR & Commission Reports

**Location**: `app/api/sandbox/reports/ggr/route.js`

### GGR Calculation

```
Sports GGR = Total Staked - Total Payouts
Casino GGR = Total Staked - Total Payouts
Total GGR = Sports GGR + Casino GGR
Net GGR = Total GGR - Commissions
```

### Report Endpoint

```bash
curl /api/sandbox/reports/ggr?startDate=2025-12-01&endDate=2025-12-31 \
  -H "Authorization: Bearer <admin_token>"
```

### Sample Response

```json
{
  "report": {
    "period": { "startDate": "2025-12-01", "endDate": "2025-12-31" },
    "sportsBetting": {
      "totalBets": 1250,
      "totalStaked": 125000,
      "totalPayout": 112500,
      "ggr": 12500
    },
    "casino": {
      "totalRounds": 5000,
      "totalStaked": 50000,
      "totalPayout": 48000,
      "ggr": 2000,
      "byGame": {
        "dice": { "rounds": 2000, "staked": 20000, "payout": 19200, "ggr": 800, "rtp": "96.00%" },
        "crash": { "rounds": 2000, "staked": 20000, "payout": 19200, "ggr": 800, "rtp": "96.00%" },
        "mines": { "rounds": 1000, "staked": 10000, "payout": 9600, "ggr": 400, "rtp": "96.00%" }
      }
    },
    "summary": {
      "totalGGR": 14500,
      "totalCommissions": 1450,
      "netGGR": 13050
    }
  }
}
```

---

## 7. Audit Trail

**Location**: `lib/audit-logger.js`, `lib/models/AuditLog.js`

### Logged Actions

| Action | Description |
|--------|-------------|
| `bet_placed` | Player placed a bet |
| `bet_won` | Bet settled as win |
| `bet_lost` | Bet settled as loss |
| `bet_manual_settlement` | Admin manually settled bet |
| `sandbox_event_created` | Demo event created |
| `sandbox_odds_updated` | Event odds changed |
| `event_settled` | Event result set |
| `casino_round_completed` | Casino game finished |

### Audit Log Structure

```json
{
  "action": "bet_placed",
  "performedBy": "user_id",
  "targetType": "bet",
  "targetId": "bet_id",
  "details": {
    "ticketNumber": "BET-...",
    "stake": 100,
    "totalOdds": 6.0,
    "potentialWin": 600,
    "maxWinningValidation": {
      "maxWinningEnforced": false,
      "originalPotentialWin": 600
    }
  },
  "timestamp": "2025-12-16T10:00:00Z"
}
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/super/audit-logs` | GET | View audit logs |
| `/api/super/audit-logs/export` | GET | Export audit logs |

---

## 8. Testing Guide

### Prerequisites

1. Admin account with `super_admin` or `tenant_admin` role
2. Test player account with wallet balance
3. API testing tool (Postman, curl, etc.)

### Sports Betting Test Sequence

```
1. Admin creates demo event with odds
   POST /api/sandbox/sports/events

2. Player deposits balance (if needed)
   POST /api/wallet/deposit

3. Player validates multi-selection slip
   POST /api/sandbox/sports/validate
   → Verify max-win enforcement response

4. Player places bet
   POST /api/sandbox/sports/bets
   → Verify bet created with correct calculations

5. Admin settles event result
   POST /api/sandbox/sports/settle

6. Verify settlement:
   - Check bet status updated
   - Check wallet balance changed
   - Check ledger entries created
   - Check GGR report updated
```

### Casino Test Sequence

```
1. Player plays casino round
   POST /api/sandbox/casino/play

2. Verify RTP tracking
   GET /api/sandbox/casino/stats

3. Verify provably fair
   GET /api/sandbox/casino/verify?round=<round_number>

4. Check ledger entries
   GET /api/super/ledger
```

### Verification Checklist

- [ ] Bet slips match ledger entries
- [ ] Wallet balances match ledger totals
- [ ] GGR report matches settlement totals
- [ ] All actions appear in audit logs
- [ ] Max winning limit enforced server-side
- [ ] Provably fair verification works

---

## 9. API Reference

### Authentication

All API requests require Bearer token:

```
Authorization: Bearer <jwt_token>
```

### Base URL

```
Production: https://your-domain.com
Development: http://localhost:3000
```

### Error Response Format

```json
{
  "success": false,
  "error": "Error message",
  "details": ["Additional details if any"]
}
```

### Success Response Format

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

---

## Important Notes for Regulators

1. **External APIs Not Required**: This system functions completely without external sports/casino providers. When providers are integrated later, they will ONLY replace odds/RNG sources - not the wallet, settlement, limits, or reporting systems.

2. **Server-Side Enforcement**: All betting limits, including max winning, are enforced server-side. UI validation is supplementary only.

3. **Immutable Ledger**: The double-entry ledger cannot be edited directly. All changes require creating new entries.

4. **Full Audit Trail**: Every action by every user is logged with timestamp and details.

5. **Provably Fair Casino**: Players can independently verify all casino game results using the cryptographic verification system.

---

## Contact

For technical questions about this documentation or the platform, contact the development team.
