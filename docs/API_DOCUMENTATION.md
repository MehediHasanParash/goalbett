# API Documentation (OpenAPI/Swagger Style)

## Sandbox Sports Betting APIs

---

### Create Demo Event

**POST** `/api/sandbox/sports/events`

Creates a new demo sports event for testing.

**Headers:**
- `Authorization: Bearer <token>` (Required, Admin role)

**Request Body:**
```json
{
  "sportId": "string (ObjectId)",
  "leagueId": "string (ObjectId)",
  "homeTeam": {
    "name": "string",
    "logo": "string (optional)"
  },
  "awayTeam": {
    "name": "string",
    "logo": "string (optional)"
  },
  "startTime": "string (ISO 8601)",
  "odds": {
    "home": "number",
    "draw": "number",
    "away": "number"
  },
  "markets": {
    "overUnder": {
      "line": "number",
      "over": "number",
      "under": "number"
    },
    "bothTeamsScore": {
      "yes": "number",
      "no": "number"
    }
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Demo event created successfully",
  "data": {
    "_id": "string",
    "name": "Team A vs Team B",
    "status": "scheduled",
    "odds": { ... }
  }
}
```

---

### Get Events

**GET** `/api/sandbox/sports/events`

Returns list of available betting events.

**Query Parameters:**
- `sportId` (optional): Filter by sport
- `leagueId` (optional): Filter by league
- `status` (optional): scheduled, live, all
- `limit` (optional): Number of results (default: 50)

**Response (200):**
```json
{
  "success": true,
  "data": [...events],
  "count": 25
}
```

---

### Validate Bet Slip

**POST** `/api/sandbox/sports/validate`

Validates a bet slip BEFORE placement, including max-win enforcement.

**Headers:**
- `Authorization: Bearer <token>` (Required)

**Request Body:**
```json
{
  "selections": [
    {
      "eventId": "string",
      "marketName": "Match Winner",
      "selectionName": "Home",
      "odds": 2.0
    }
  ],
  "stake": 1000
}
```

**Response (200):**
```json
{
  "success": true,
  "validation": {
    "selectionsValid": true,
    "selectionErrors": [],
    "betValid": true,
    "betErrors": [],
    "enforcement": {
      "maxWinningEnforced": false,
      "originalPotentialWin": 2000,
      "limitedPotentialWin": null,
      "maxAllowedStake": null
    }
  },
  "summary": {
    "selectionsCount": 1,
    "totalOdds": 2.0,
    "stake": 1000,
    "potentialWin": 2000,
    "maxWinningLimit": 500000,
    "exceedsMaxWinning": false
  },
  "limits": {
    "minStake": 1,
    "maxStake": 100000,
    "maxWinning": 500000,
    "maxSelectionsPerSlip": 100
  }
}
```

**Response (400 - Max Win Exceeded):**
```json
{
  "success": true,
  "validation": {
    "betValid": false,
    "betErrors": [
      "Potential winning 600000 exceeds maximum allowed 500000. Maximum stake at these odds: 833.33"
    ],
    "enforcement": {
      "maxWinningEnforced": true,
      "originalPotentialWin": 600000,
      "limitedPotentialWin": 500000,
      "maxAllowedStake": 833.33
    }
  }
}
```

---

### Place Bet

**POST** `/api/sandbox/sports/bets`

Places a bet after validation.

**Headers:**
- `Authorization: Bearer <token>` (Required)

**Request Body:**
```json
{
  "selections": [
    {
      "eventId": "string",
      "marketName": "Match Winner",
      "selectionName": "Home",
      "odds": 2.0
    },
    {
      "eventId": "string2",
      "marketName": "Match Winner",
      "selectionName": "Away",
      "odds": 3.0
    }
  ],
  "stake": 100,
  "betType": "multiple"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Bet placed successfully",
  "data": {
    "_id": "string",
    "ticketNumber": "BET-ABC123-XYZ789",
    "type": "multiple",
    "stake": 100,
    "totalOdds": 6.0,
    "potentialWin": 600,
    "selections": [...],
    "status": "pending",
    "newBalance": 900
  },
  "validation": {
    "maxWinningLimit": 500000,
    "maxWinningEnforced": false
  }
}
```

---

### Settle Event

**POST** `/api/sandbox/sports/settle`

Admin endpoint to settle event results.

**Headers:**
- `Authorization: Bearer <token>` (Required, Admin role)

**Request Body:**
```json
{
  "action": "settle_event",
  "eventId": "string",
  "result": {
    "homeScore": 2,
    "awayScore": 1
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Event settled successfully",
  "data": {
    "eventId": "string",
    "eventName": "Team A vs Team B",
    "result": {
      "homeTeam": "Team A",
      "homeScore": 2,
      "awayTeam": "Team B",
      "awayScore": 1
    },
    "betsProcessed": 15,
    "totalStaked": 5000,
    "totalPaidOut": 4200,
    "ggr": 800
  }
}
```

---

## Sandbox Casino APIs

---

### Play Casino Game

**POST** `/api/sandbox/casino/play`

Play casino games (dice, crash, mines).

**Headers:**
- `Authorization: Bearer <token>` (Required)

**Request Body (Quick Play):**
```json
{
  "action": "quick_play",
  "gameType": "dice",
  "stake": 10,
  "clientSeed": "optional_player_seed",
  "actionParams": {
    "target": 50,
    "type": "over"
  }
}
```

**Game-Specific Parameters:**

Dice:
```json
{
  "actionParams": {
    "target": 50,        // 1-99
    "type": "over"       // "over" or "under"
  }
}
```

Crash:
```json
{
  "gameParams": {
    "autoCashout": 2.0   // Optional auto-cashout multiplier
  }
}
```

Mines:
```json
{
  "gameParams": {
    "minesCount": 5      // 1-24
  },
  "actionParams": {
    "tilesRevealed": [0, 5, 12]  // Tile indices to reveal
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "roundId": "string",
    "roundNumber": "CR-ABC123-XYZ789",
    "gameType": "dice",
    "stake": 10,
    "result": {
      "roll": 67,
      "target": 50,
      "type": "over",
      "won": true,
      "multiplier": 1.98
    },
    "payout": 19.8,
    "newBalance": 109.8,
    "provablyFair": {
      "serverSeed": "abc123...",
      "serverSeedHash": "def456...",
      "clientSeed": "player_seed",
      "nonce": 42,
      "verificationUrl": "/api/casino/verify?round=CR-ABC123-XYZ789"
    }
  }
}
```

---

### Verify Game Round

**GET** `/api/sandbox/casino/verify?round={roundNumber}`

Verify provably fair game result.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "roundNumber": "CR-ABC123-XYZ789",
    "gameType": "dice",
    "stake": 10,
    "outcome": {
      "result": { "roll": 67, "won": true },
      "multiplier": 1.98,
      "payout": 19.8
    },
    "verification": {
      "valid": true,
      "serverSeedValid": true,
      "random": 0.67
    },
    "howToVerify": {
      "step1": "Take the server seed, client seed, and nonce",
      "step2": "Calculate: HMAC-SHA256(serverSeed, clientSeed:nonce)",
      "step3": "Convert first 8 hex characters to integer",
      "step4": "Divide by 0xFFFFFFFF to get random number (0-1)",
      "step5": "Apply game-specific logic to get result",
      "serverSeed": "abc123...",
      "clientSeed": "player_seed",
      "nonce": 42
    }
  }
}
```

---

### Casino RTP Statistics

**GET** `/api/sandbox/casino/stats`

Get RTP and game statistics.

**Query Parameters:**
- `gameType` (optional): dice, crash, mines
- `startDate` (optional): ISO 8601
- `endDate` (optional): ISO 8601

**Response (200):**
```json
{
  "success": true,
  "data": {
    "dice": {
      "totalRounds": 2500,
      "totalStaked": 25000,
      "totalPayout": 24000,
      "actualRtp": 96.00,
      "ggr": 1000,
      "avgMultiplier": 1.92
    },
    "crash": { ... },
    "mines": { ... }
  }
}
```

---

## GGR Report API

**GET** `/api/sandbox/reports/ggr`

Generate comprehensive GGR report.

**Query Parameters:**
- `startDate`: Start of period (ISO 8601)
- `endDate`: End of period (ISO 8601)

**Response (200):**
```json
{
  "success": true,
  "report": {
    "period": {
      "startDate": "2025-12-01T00:00:00Z",
      "endDate": "2025-12-31T23:59:59Z"
    },
    "sportsBetting": {
      "totalBets": 1250,
      "totalStaked": 125000,
      "totalPayout": 112500,
      "ggr": 12500,
      "breakdown": {
        "won": 450,
        "lost": 780,
        "void": 20
      }
    },
    "casino": {
      "totalRounds": 5000,
      "totalStaked": 50000,
      "totalPayout": 48000,
      "ggr": 2000,
      "byGame": {
        "dice": {
          "rounds": 2000,
          "staked": 20000,
          "payout": 19200,
          "ggr": 800,
          "rtp": "96.00%"
        }
      }
    },
    "commissions": {
      "AGENT_COMMISSION": {
        "amount": 1000,
        "count": 50
      }
    },
    "summary": {
      "totalGGR": 14500,
      "totalCommissions": 1000,
      "netGGR": 13500,
      "currency": "USD"
    }
  }
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 500 | Internal Server Error |

## Rate Limits

- Standard endpoints: 100 requests/minute
- Betting endpoints: 30 requests/minute
- Admin endpoints: 60 requests/minute
```

Now let me move on to the next tasks:
