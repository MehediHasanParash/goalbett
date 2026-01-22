# Frontend Testing Guide - Financial Enforcement System

## Quick Access URLs

- **Financial Testing Page**: `/s/financial-testing` - Main testing dashboard
- **Jurisdiction Rules**: `/s/jurisdiction-rules` - Create/edit country rules
- **Wallet Ledger**: `/s/wallet-ledger` - View all transactions
- **Audit Logs**: `/s/audit-logs` - View who changed what

---

## How to Test Each Feature

### 1. Backend Tax/Charity Enforcement

**Navigate to**: `/s/jurisdiction-rules`

**Steps**:
1. Click "New Rule" button
2. Select Country: Ethiopia (ET)
3. Currency will auto-fill to ETB
4. Set Status: Active
5. Go to "Player Taxes" tab
6. Click "Add Player Tax"
7. Configure:
   - Type: Win Tax
   - Percentage: 15
   - Threshold: 1000 (only apply if win >= 1000 ETB)
   - Calculation Base: Gross Win
   - Destination Account: Tax Payable
8. Click "Add Player Tax" again
9. Configure:
   - Type: Charity
   - Percentage: 10
   - Threshold: 500
   - Destination Account: Charity Payable
10. Fill in Change Reason: "Initial tax setup for Ethiopia"
11. Click "Create Rule"

**Verify**: Rule appears in the list with badge showing "2 taxes"

---

### 2. Ledger / Audit Trail

**Navigate to**: `/s/financial-testing` -> "Ledger Viewer" tab

**Steps**:
1. Click "Fetch" button
2. View the transaction list
3. Each entry shows:
   - Type (bet_won, deposit, etc.)
   - Amount
   - Before Balance
   - After Balance
   - Timestamp
   - Description

**Alternative**: Go directly to `/s/wallet-ledger`

**Verify**: Every financial movement has a ledger entry with before/after balance

---

### 3. One Currency Per Tenant

**Navigate to**: `/s/financial-testing` -> "Quick Tests" tab

**Steps**:
1. Click "Run Currency Test"
2. The system will try to place a bet with invalid currency
3. Should show "PASSED" if API correctly rejects

**Verify**: Test shows green "PASSED" badge

---

### 4. Threshold-Based Country Rules

**Navigate to**: `/s/jurisdiction-rules`

**Steps**:
1. Create rule with Win Tax threshold = 1000 ETB (as above)
2. Test two scenarios:

**Test Case A (Below Threshold)**:
- Place bet: stake 100, potential payout 700
- Gross win = 600 (below 1000)
- Win Tax should NOT apply
- Net payout = 600 (no deduction)

**Test Case B (Above Threshold)**:
- Place bet: stake 100, potential payout 1600
- Gross win = 1500 (above 1000)
- Win Tax SHOULD apply: 15% of 1500 = 225
- Net payout = 1275

**Verify**: Use Receipt tab in `/s/financial-testing` to see breakdown

---

### 5. Rule Versioning

**Navigate to**: `/s/jurisdiction-rules`

**Steps**:
1. Create rule v1 with 10% Win Tax
2. Note the version number (v1)
3. Place a bet (Bet A) - remember the bet ID
4. Go back to rules, click Edit on your rule
5. Change Win Tax to 15%
6. Provide change reason: "Increased tax rate"
7. Save - this creates v2, archives v1
8. Place new bet (Bet B) - remember this bet ID
9. Settle both bets

**Verify**:
- Bet A (placed under v1) should use 10% tax
- Bet B (placed under v2) should use 15% tax
- Check receipts to confirm different tax amounts

---

### 6. Provider Templates & Locking

**Navigate to**: `/s/jurisdiction-rules`

**Steps**:
1. Open a rule for editing
2. Go to "Features" tab
3. Enable "Provider Locked" toggle
4. Save the rule
5. Log in as Tenant Admin
6. Try to modify the locked rule

**Verify**: Tenant Admin cannot modify locked fields

---

### 7. Destination System Accounts

**Navigate to**: `/s/financial-testing` -> "System Accounts" tab

**Steps**:
1. Click "Load System Accounts"
2. View the accounts:
   - Tax Payable
   - Charity Payable
   - VAT Payable
   - Operator Revenue
3. Settle a bet with deductions
4. Refresh the accounts list

**Verify**: Account balances increased by deducted amounts

---

### 8. Player Transparency Receipt

**Navigate to**: `/s/financial-testing` -> "Player Receipt" tab

**Steps**:
1. Get a bet ID from a settled bet
2. Enter the bet ID in the input field
3. Click "Get Receipt"
4. View the detailed breakdown:
   - Stake amount
   - Payout amount
   - Gross Win
   - Each deduction (name, percentage, amount)
   - Total Deductions
   - Net Amount Credited

**Verify**: Receipt shows clear breakdown that player can understand

---

### 9. Admin Audit Log

**Navigate to**: `/s/audit-logs`

**Steps**:
1. Make a change to jurisdiction rules (create or edit)
2. Go to Audit Logs page
3. Find your recent change
4. View details:
   - Who made the change
   - When
   - What changed (old value -> new value)
   - Reason provided

**Verify**: All changes are logged with complete details

---

### 10. Staging Environment

**Status**: Architecture Ready

**To Setup Staging**:
1. Create separate MongoDB database for staging
2. Set environment variables:
   ```
   NODE_ENV=staging
   MONGODB_URI=<staging-db-url>
   ```
3. Deploy to staging URL (e.g., staging.yourdomain.com)
4. Configure payment gateways in sandbox mode

**Alternative**: Use Vercel/Render preview deployments per Git branch

---

## Complete Testing Workflow

### Step 1: Setup (5 minutes)

1. Login as Super Admin at `/s/login`
2. Go to `/s/jurisdiction-rules`
3. Create Ethiopia rule with:
   - 15% Win Tax (threshold 1000 ETB)
   - 10% Charity (threshold 500 ETB)
   - Status: Active

### Step 2: Verify Rule Creation

1. Rule appears in list
2. Shows "2 taxes" badge
3. Status is "active"
4. Version is 1

### Step 3: Test Financial Enforcement

1. Go to `/s/financial-testing`
2. Run "Currency Test" (Quick Tests tab)
3. Should show PASSED

### Step 4: Test Ledger

1. Go to Ledger Viewer tab
2. Click Fetch
3. View transactions with before/after balances

### Step 5: Test System Accounts

1. Go to System Accounts tab
2. Click Load System Accounts
3. See Tax Payable, Charity Payable accounts

### Step 6: Test Receipt

1. Go to Player Receipt tab
2. Enter a settled bet ID
3. Click Get Receipt
4. See detailed breakdown

### Step 7: Test Audit Logs

1. Go to `/s/audit-logs`
2. Find your rule creation entry
3. Verify who, what, when is logged

### Step 8: Mark Tests

1. Go to Test Checklist tab in `/s/financial-testing`
2. Mark each test as Passed or Failed
3. Review summary at top

---

## Troubleshooting

### Rule Not Saving

**Problem**: Only basic info saves, not taxes/limits

**Solution**:
1. Make sure to select a Type for each deduction
2. Fill in required fields (marked with *)
3. Check browser console for errors
4. Ensure you're logged in as Super Admin

### Currency Test Fails

**Problem**: Currency validation test shows FAILED

**Solution**:
1. Check if `/api/betting/place` endpoint exists
2. Verify tenant has default_currency set
3. Check server logs for validation errors

### Ledger Empty

**Problem**: No ledger entries shown

**Solution**:
1. Place a bet or make a deposit first
2. Transactions must occur before ledger has entries
3. Check if LedgerEntry model is properly imported

### System Accounts Empty

**Problem**: No system accounts found

**Solution**:
1. Accounts are auto-created on first settlement
2. Settle a bet with deductions to create them
3. Or create manually via API

### Receipt Not Loading

**Problem**: Can't get receipt for bet

**Solution**:
1. Verify bet ID is correct
2. Bet must be settled (not pending)
3. Check if bet has settlementMetadata

---

## API Endpoints for Testing

### Ledger
```
GET /api/financial/ledger
  ?type=bet_won
  &limit=20
```

### System Accounts
```
GET /api/financial/system-accounts
```

### Player Receipt
```
GET /api/financial/player-receipt?betId=<BET_ID>
```

### Jurisdiction Rules
```
GET /api/super/jurisdiction-rules
POST /api/super/jurisdiction-rules (create)
PUT /api/super/jurisdiction-rules (update)
```

---

## Success Criteria

All 10 features are working if:

1. **Backend Enforcement**: Deductions calculated in backend, not UI
2. **Ledger**: Every transaction logged with before/after balance
3. **Currency Validation**: API rejects mismatched currencies
4. **Thresholds**: Deductions only apply when threshold met
5. **Versioning**: Old bets use old rule versions
6. **Provider Lock**: Tenants cannot modify locked fields
7. **System Accounts**: Deductions go to correct accounts
8. **Player Receipt**: Clear breakdown shown to player
9. **Audit Log**: All changes logged with who/what/when
10. **Staging Ready**: Architecture supports separate environments

---

## Support

For issues:
1. Check browser console for errors
2. Check server logs for API errors
3. Verify database connection
4. Review model schemas for validation errors

Documentation: `FINANCIAL_ENFORCEMENT_SYSTEM.md`
