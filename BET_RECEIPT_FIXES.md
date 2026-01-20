# Bet Receipt Modal Fixes

## Issue
The bet receipt modal was displaying:
- **Gross Winnings: $NaN** - showing as invalid number
- **No deductions section** - even though the UI suggested there should be
- **Incomplete jurisdiction info** - showing "Jurisdiction: | Rule Version: v"

## Root Cause
When a bet is settled in a jurisdiction without configured tax rules:
- The `taxDetails` object is not created by the settlement engine
- The receipt modal tried to access `bet.taxDetails.grossWin` which was undefined
- This caused `NaN` to display instead of the actual gross winnings

## Solution Implemented

### 1. **Fallback Calculations** (`components/betting/bet-receipt-modal.jsx`)

Added smart calculation functions that work whether or not `taxDetails` exists:

```javascript
// Calculate gross winnings with fallback
const calculateGrossWin = () => {
  if (bet.status !== "won") return 0

  // Try taxDetails first
  if (bet.taxDetails && typeof bet.taxDetails.grossWin === 'number' && !isNaN(bet.taxDetails.grossWin)) {
    return bet.taxDetails.grossWin
  }

  // Fallback: calculate from payout - stake
  const payout = bet.payout || bet.potentialWin || bet.actualWin || 0
  const stake = bet.stake || 0
  return payout - stake
}
```

### 2. **Safe Net Amount Calculation**

```javascript
const calculateNetAmount = () => {
  if (bet.status !== "won") return 0

  const grossWin = calculateGrossWin()
  const stake = bet.stake || 0

  // If we have taxDetails with deductions
  if (bet.taxDetails && bet.taxDetails.netWin !== undefined && !isNaN(bet.taxDetails.netWin)) {
    return stake + bet.taxDetails.netWin
  }

  // If we have totalDeductions
  if (bet.taxDetails && bet.taxDetails.totalDeductions !== undefined && !isNaN(bet.taxDetails.totalDeductions)) {
    return stake + (grossWin - bet.taxDetails.totalDeductions)
  }

  // Fallback: no deductions, return full amount
  return stake + grossWin
}
```

### 3. **Safe Currency Formatting**

```javascript
const formatCurrency = (amount, currency = "USD") => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(0)
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}
```

### 4. **Conditional Display Logic**

```javascript
const hasValidDeductions = bet.taxDetails &&
  bet.taxDetails.deductions &&
  Array.isArray(bet.taxDetails.deductions) &&
  bet.taxDetails.deductions.length > 0
```

### 5. **User-Friendly Messages**

**When No Deductions Applied:**
```
ℹ️ No deductions were applied to this bet. Full winnings credited.
```

**In Settlement Info:**
```
No deductions were applied to this bet. Full winnings were credited to your account.
```

## What Users Now See

### Case 1: Bet with Tax Deductions (e.g., Ethiopia with 15% charity + 20% tax)
```
Stake Amount: $100.00
Total Odds: 15.50
Potential Payout: $1,550.00

✅ WON

Gross Winnings: $1,450.00

DEDUCTIONS APPLIED
🟡 Charity (15%): -$217.50
   15% of gross_win ($1,450.00)

🟡 Win Tax (20%): -$290.00
   20% of gross_win ($1,450.00)

Total Deductions: -$507.50

Net Amount Credited: $1,042.50

Jurisdiction: ET | Rule Version: v1
```

### Case 2: Bet without Tax Deductions (No jurisdiction rules configured)
```
Stake Amount: $10.00
Total Odds: 3.50
Potential Payout: $35.00

✅ WON

Gross Winnings: $25.00

ℹ️ No deductions were applied to this bet. Full winnings credited.

Net Amount Credited: $35.00

Settlement Info:
Settled: Jan 20, 2026, 6:56:29 AM
Settlement Type: Manual
No deductions were applied to this bet. Full winnings were credited to your account.
```

## Key Improvements

✅ **No more NaN errors** - All calculations have safe fallbacks
✅ **Accurate gross winnings** - Calculated from bet data even without taxDetails
✅ **Accurate net amount** - Always shows the correct credited amount
✅ **Clear messaging** - Users understand when deductions are or aren't applied
✅ **Conditional sections** - Only shows deductions section when deductions exist
✅ **Safe jurisdiction display** - Only shows when data is available

## Technical Details

### When taxDetails is Populated
The settlement engine creates `taxDetails` when:
1. Bet status is "won"
2. Payout > 0
3. An active jurisdiction rule exists for the tenant's country
4. The jurisdiction rule has player deductions configured

### When taxDetails is NOT Populated
- No jurisdiction rule configured for the country
- Country defaults to "US" with no rules
- Bet was settled before jurisdiction rules were implemented
- Manual settlement without tax application

### Backward Compatibility
The fix maintains full backward compatibility with:
- Bets settled before jurisdiction rules existed
- Bets in countries without configured tax rules
- Future bets with new tax configurations

## Testing Checklist

- [x] View receipt for bet with tax deductions - shows breakdown
- [x] View receipt for bet without tax deductions - shows message
- [x] View receipt for old bet (before taxDetails) - calculates correctly
- [x] Gross winnings display correctly in all cases
- [x] Net amount displays correctly in all cases
- [x] Currency formatting handles null/undefined/NaN values
- [x] Jurisdiction info only shows when available
- [x] Settlement message adapts to deduction status

## Related Files

- `/components/betting/bet-receipt-modal.jsx` - Fixed receipt display
- `/lib/sandbox/settlement-engine.js` - Tax calculation logic (unchanged)
- `/lib/models/JurisdictionRule.js` - Tax rule definitions (unchanged)
- `/lib/models/Bet.js` - Bet schema with taxDetails (unchanged)

## Notes for Jurisdiction Setup

To enable tax deductions for a country:
1. Navigate to Super Admin > Jurisdiction Rules
2. Create a new rule for the country code
3. Configure player deductions (charity, tax, etc.)
4. Set thresholds and calculation bases
5. Activate the rule

Future bets in that jurisdiction will automatically have deductions applied and properly displayed in receipts.
