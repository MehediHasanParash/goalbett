# Financial Enforcement System - Quick Start Guide

## Setup (5 minutes)

### 1. Create Jurisdiction Rule

Navigate to: `http://localhost:3000/s/jurisdiction-rules`

```bash
# Login as Super Admin
Email: super@admin.com
Password: [your password]

# Click "New Rule"
# Fill in basic info:
- Country: Ethiopia (ET)
- Currency: ETB
- Status: Active

# Go to "Player Taxes" tab:
- Click "Add Player Tax"
- Type: Win Tax
- Percentage: 15%
- Threshold: 1000 ETB
- Save

# Go to "Operator Taxes" tab:
- Click "Add Operator Tax"
- Type: Gaming Levy
- Percentage: 10%
- Calculation Base: GGR
- Save

# Click "Create Rule"
```

### 2. Create System Accounts

```bash
POST /api/financial/system-accounts
Authorization: Bearer <SUPER_ADMIN_TOKEN>
Content-Type: application/json

{
  "accountName": "Tax Payable - Ethiopia",
  "accountType": "tax_payable",
  "tenantId": "<YOUR_TENANT_ID>",
  "currency": "ETB",
  "description": "Collects all tax deductions"
}
```

Repeat for:
- `charity_payable`
- `vat_payable`
- `operator_revenue`

### 3. Test Bet Settlement

```bash
# Place a bet (automatically validated)
POST /api/betting/place
{
  "tenantId": "...",
  "userId": "...",
  "stake": 100,
  "currency": "ETB",
  "selections": [...]
}

# Settle bet (automatic enforcement)
POST /api/betting/settle
{
  "betId": "...",
  "result": "won",
  "payout": 1500
}

# Get player receipt
GET /api/financial/player-receipt?betId=<BET_ID>

# Expected response:
{
  "receipt": {
    "stake": 100,
    "payout": 1500,
    "grossWin": 1400,
    "deductions": [
      {
        "name": "win_tax",
        "percentage": 15,
        "amount": 210
      }
    ],
    "totalDeductions": 210,
    "netAmount": 1190
  }
}
```

## Key Files

```
lib/services/
├── financial-enforcement-engine.js  ← Core engine
└── bet-settlement-integration.js    ← Integration example

lib/models/
├── JurisdictionRule.js              ← Rules model
├── LedgerEntry.js                   ← Audit trail
└── SystemAccount.js                 ← Destination accounts

app/api/financial/
├── ledger/route.js                  ← Query ledger
├── system-accounts/route.js         ← Manage accounts
└── player-receipt/route.js          ← Get receipts

app/s/jurisdiction-rules/page.jsx    ← Admin UI
```

## Common Use Cases

### Check System Account Balance

```bash
GET /api/financial/system-accounts?tenantId=<ID>&accountType=tax_payable

Response:
{
  "accounts": [
    {
      "accountName": "Tax Payable - Ethiopia",
      "balance": 12450,
      "currency": "ETB",
      "totalSettled": 5000
    }
  ]
}
```

### Query Ledger (Audit Trail)

```bash
GET /api/financial/ledger?tenantId=<ID>&startDate=2024-01-01&limit=100

Response:
{
  "entries": [
    {
      "type": "bet_won",
      "amount": 1190,
      "beforeBalance": 5000,
      "afterBalance": 6190,
      "metadata": {
        "grossWin": 1400,
        "totalDeductions": 210,
        "deductions": [...]
      }
    }
  ],
  "total": 1523
}
```

### Test Currency Validation

```bash
# This will FAIL (currency mismatch)
POST /api/betting/place
{
  "tenantId": "<ETB_TENANT>",
  "currency": "USD"  ← Wrong!
}

# Response:
{
  "error": "Currency mismatch: Bet currency USD does not match tenant currency ETB"
}
```

### Update Rule (Creates New Version)

```bash
PUT /api/super/jurisdiction-rules
{
  "ruleId": "<RULE_ID>",
  "playerDeductions": [
    {
      "name": "win_tax",
      "percentage": 20  ← Changed from 15%
    }
  ],
  "changeReason": "Government increased tax rate"
}

# Old bets still use version 1 (15%)
# New bets use version 2 (20%)
```

## Testing Checklist

- [ ] Create jurisdiction rule with thresholds
- [ ] Create system accounts
- [ ] Place bet with correct currency
- [ ] Try placing bet with wrong currency (should fail)
- [ ] Settle bet and check player receipt
- [ ] Verify system account balances increased
- [ ] Check ledger shows all entries
- [ ] Verify player wallet received NET amount
- [ ] Update rule and verify old bets still use old version
- [ ] Check audit logs show who changed what

## Integration Code

```javascript
import { financialEngine } from "@/lib/services/financial-enforcement-engine"

// During bet settlement
const result = await financialEngine.settleBetWithRules({
  betId: bet._id,
  userId: player._id,
  tenantId: tenant._id,
  stake: 100,
  payout: 1500,
  countryCode: "ET",
  result: "won"
})

// Update player wallet with NET amount
wallet.balance += result.netPayout

// result.breakdown contains:
// - stake: 100
// - payout: 1500
// - grossWin: 1400
// - deductions: [{ name: "win_tax", amount: 210 }]
// - totalDeductions: 210
// - netAmount: 1190
```

## Troubleshooting

**Deductions not applied?**
- Check rule status is "active"
- Check deduction enabled = true
- Check grossWin >= threshold
- Check currency matches

**Currency mismatch error?**
- Verify tenant.default_currency
- Ensure bet currency matches

**System account not found?**
- Create with: `SystemAccount.createDefaultAccounts(tenantId, currency, userId)`

**Need help?**
- See full documentation: `FINANCIAL_ENFORCEMENT_SYSTEM.md`
- Check API routes in `app/api/financial/`
- Review models in `lib/models/`

## Next Steps

1. **Create UI Components**: Display player receipts in bet history
2. **Add Reports**: Daily/weekly financial reports
3. **Setup Alerts**: Notify when system accounts reach thresholds
4. **Export Data**: CSV/PDF exports for compliance
5. **Add Dashboard**: Show real-time tax/charity collection

## Support

For detailed implementation guide, see: `FINANCIAL_ENFORCEMENT_SYSTEM.md`

For questions about specific features, check the relevant section in the main documentation.
