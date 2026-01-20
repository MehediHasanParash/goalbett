# Financial Rules & Tax System Implementation

## Overview

This document describes the comprehensive financial rules and tax enforcement system that has been implemented. This system ensures that **ALL tax, charity, and financial deductions are enforced in the backend**, not just shown in the UI.

---

## What Has Been Implemented

### 1. Backend Enforcement (CRITICAL)

**Status: ✅ COMPLETE**

All win tax, betting tax, charity, and other deductions are now:
- Calculated automatically during bet settlement
- Enforced server-side in the settlement engine
- Recorded in immutable ledger entries
- Never bypassed by UI or manual operations

**Files Modified:**
- `lib/sandbox/settlement-engine.js` - Now applies jurisdiction rules automatically
- `lib/ledger-engine.js` - Enhanced with tax deduction recording

---

### 2. Ledger / Audit Trail for Every Money Move

**Status: ✅ COMPLETE**

Every single transaction now creates ledger entries with:
- Unique entry number (e.g., LE-20260120-000001)
- User, tenant, currency, amount
- Transaction type (WIN_TAX_DEDUCTION, CHARITY_DEDUCTION, etc.)
- Before/after balance snapshots
- Timestamp and fiscal period tracking
- Tax details including jurisdiction rule version

**New/Enhanced Files:**
- `lib/models/LedgerEntry.js` - Enhanced with tax tracking fields
- `lib/ledger-engine.js` - New methods for tax deductions

**Key Features:**
- Every deduction creates a separate, traceable ledger entry
- Immutable audit trail (reversals create new entries)
- Tied to jurisdiction rule version for compliance

---

### 3. One Currency Per Tenant + Strict Validation

**Status: ✅ COMPLETE**

Currency consistency is now enforced:
- Each tenant has a single base currency
- All bets, wallets, and transactions use tenant currency
- Jurisdiction rules specify their currency
- Backend validates currency matches before processing

**Implementation:**
- Tenant model already has `default_currency` field
- Settlement engine uses tenant currency
- Ledger entries record currency for every transaction

---

### 4. Country Rules with Threshold + Multi-Deductions

**Status: ✅ COMPLETE**

The system now supports complex rules like Ethiopia's requirements:
- **Thresholds**: Apply tax only if win >= X amount
- **Multiple deductions**: Apply charity + tax + other in order
- **Calculation bases**: Gross win, net profit, stake, payout, GGR, turnover
- **Application order**: Deductions applied in sequence (1, 2, 3...)

**Example (Ethiopia-style rule):**
```javascript
{
  countryCode: "ET",
  playerDeductions: [
    {
      name: "charity",
      percentage: 15,
      threshold: 1000,
      calculationBase: "gross_win",
      applicationOrder: 1
    },
    {
      name: "win_tax",
      percentage: 20,
      threshold: 1000,
      calculationBase: "gross_win",
      applicationOrder: 2
    }
  ]
}
```

**New Files:**
- `lib/models/JurisdictionRule.js` - Complete jurisdiction rule model

---

### 5. Rule Versioning (Don't Break Past Bets)

**Status: ✅ COMPLETE**

Changes to rules create new versions automatically:
- Each rule has a version number (v1, v2, v3...)
- Bets store the rule version they were placed under
- Old bets remain tied to their original rule version
- Effective dates tracked (effectiveFrom, effectiveTo)

**Key Method:**
```javascript
JurisdictionRule.createNewVersion(ruleId, updates, userId, reason)
```

When you update a rule:
1. Current rule is archived with effectiveTo date
2. New version created with incremented version number
3. Previous version linked for audit trail
4. Change reason recorded

---

### 6. Provider Templates → Tenant Inheritance/Lock

**Status: ✅ COMPLETE**

Rules can be created at provider level and inherited by tenants:
- Rules have `providerLocked` flag
- `lockedFields` array specifies which fields tenants can't change
- Super admin creates master templates
- Tenants inherit and can optionally override (if not locked)

**Fields:**
```javascript
{
  providerLocked: true,
  lockedFields: ["playerDeductions", "operatorDeductions"]
}
```

---

### 7. Destination Wallets/Accounts (Where Tax/Charity Goes)

**Status: ✅ COMPLETE**

System accounts track where deductions go:
- Tax Payable account
- Charity Payable account
- VAT Payable account
- Excise Duty Payable account
- Operator Revenue account

**New Files:**
- `lib/models/SystemAccount.js` - System accounts for deductions

**Features:**
- Running balance tracking
- Settlement tracking (when paid out to government/charity)
- Destination banking info for payouts
- Automatic credit when deductions applied

---

### 8. Player Transparency Receipt

**Status: ✅ COMPLETE**

Players now see complete breakdown after settlement:
- Stake amount
- Gross winnings (payout - stake)
- Each deduction with name, percentage, amount
- Total deductions
- Net amount credited to wallet
- Jurisdiction and rule version applied

**New Files:**
- `components/betting/bet-receipt-modal.jsx` - Complete receipt with tax breakdown

**Display:**
```
Stake: $100
Potential Win: $500
─────────────────────
Gross Win: $400

DEDUCTIONS APPLIED:
- Charity (15% of gross win): -$60
- Win Tax (20% of gross win): -$80
─────────────────────
Total Deductions: -$140
Net Credited: $360
```

---

### 9. Admin Audit Log (Who Changed What)

**Status: ✅ COMPLETE**

All rule changes are tracked:
- Who created/modified the rule
- When it was changed
- Old value vs new value
- Reason for change
- Exportable for regulators

**Implementation:**
- `changeReason` required for all updates
- `createdBy` and `lastModifiedBy` tracked
- `previousVersionId` links to old version
- Audit logs created via `logAudit()` function

---

### 10. Admin UI for Jurisdiction Rules

**Status: ✅ COMPLETE**

A complete admin interface for managing rules:
- View all existing rules by country
- Create new jurisdiction profiles
- Edit rules (creates new version)
- Clone rules for similar countries
- Configure player deductions
- Configure operator deductions
- Set betting limits
- Version history visible

**New Files:**
- `app/s/jurisdiction-rules/page.jsx` - Complete UI
- `app/api/super/jurisdiction-rules/route.js` - API endpoints

**Access:** `/s/jurisdiction-rules` (Super Admin only)

---

## Database Models Created

### 1. JurisdictionRule
- Country-specific financial rules
- Player deductions (taxes, charity)
- Operator deductions (GGR taxes, levies)
- Betting limits per jurisdiction
- Version control
- Effective dates

### 2. SystemAccount
- Tax payable accounts
- Charity payable accounts
- Operator revenue tracking
- Balance tracking
- Settlement records

### 3. Enhanced LedgerEntry
- Tax detail tracking
- Jurisdiction rule reference
- Deduction breakdown
- Fiscal period tracking

### 4. Enhanced Bet Model
- Tax details object
- Jurisdiction rule reference
- Gross win, net win tracking
- Deduction breakdown

---

## How It Works (End-to-End)

### Bet Placement
1. Player places bet
2. Stake deducted from wallet
3. Ledger entry created: BET_PLACEMENT

### Bet Settlement (Winning Bet)
1. Event finished, settlement triggered
2. System loads tenant's country code
3. Looks up active JurisdictionRule for that country
4. Calculates gross win (payout - stake)
5. **Applies deductions in order:**
   - Checks threshold for each deduction
   - Calculates deduction amount
   - Creates ledger entry for each deduction
   - Credits system account (Tax Payable, etc.)
6. Credits net amount to player wallet
7. Stores complete tax breakdown in bet record
8. Player sees detailed receipt

### Example Flow (Ethiopia, $1500 win):
```
1. Bet placed: $100 stake
2. Event settles: Win!
3. Payout would be: $1500
4. Gross win: $1400

5. Load jurisdiction rule (ET, v2)
6. Check threshold: $1400 >= $1000 ✓

7. Apply deductions:
   a. Charity (15%): $1400 × 0.15 = $210
      - Ledger: Player → Charity Payable ($210)

   b. Win Tax (20%): $1400 × 0.20 = $280
      - Ledger: Player → Tax Payable ($280)

8. Total deductions: $490
9. Net win: $1400 - $490 = $910
10. Credit player: $100 (stake) + $910 = $1010
    - Ledger: Revenue → Player ($1010)

11. Save in bet.taxDetails:
    {
      jurisdictionRuleId: "...",
      ruleVersion: 2,
      countryCode: "ET",
      grossWin: 1400,
      totalDeductions: 490,
      netWin: 910,
      deductions: [...]
    }

12. Player sees receipt with full breakdown
```

---

## Key Features Summary

✅ **Backend Enforcement** - Cannot be bypassed
✅ **Complete Audit Trail** - Every cent tracked
✅ **Currency Consistency** - One per tenant
✅ **Complex Rules** - Thresholds, multiple deductions
✅ **Version Control** - Old bets safe from changes
✅ **Provider/Tenant Hierarchy** - Templates + inheritance
✅ **System Accounts** - Track tax/charity collections
✅ **Player Transparency** - Full receipt breakdown
✅ **Admin Audit** - Who changed what, when, why
✅ **No Hard-Coding** - All rules in database
✅ **Staging-Ready** - Rules can be draft/active/archived

---

## Testing the System

### 1. Create a Jurisdiction Rule
```
1. Go to: /s/jurisdiction-rules
2. Click "New Rule"
3. Select country (e.g., Ethiopia)
4. Add player deduction:
   - Type: Charity
   - Percentage: 15%
   - Threshold: 1000
   - Calculation Base: Gross Win
5. Add another:
   - Type: Win Tax
   - Percentage: 20%
   - Threshold: 1000
6. Set status to "Active"
7. Add reason: "Initial Ethiopian rules"
8. Save
```

### 2. Update Tenant Country
```javascript
// Make sure tenant has country set
await Tenant.findByIdAndUpdate(tenantId, {
  'metadata.country': 'ET'
})
```

### 3. Place and Settle Bet
```
1. Place a bet with high potential win (>$1000)
2. Manually settle the bet as WON
3. Check the bet record:
   - bet.taxDetails should show deductions
   - bet.actualWin should be net amount
4. Check ledger entries:
   - Should see BET_WINNING entry
   - Should see CHARITY_DEDUCTION entry
   - Should see WIN_TAX_DEDUCTION entry
5. View bet receipt - shows full breakdown
```

---

## API Endpoints

### GET /api/super/jurisdiction-rules
Get all jurisdiction rules

### POST /api/super/jurisdiction-rules
Create new rule

### PUT /api/super/jurisdiction-rules
Update rule (creates new version)

---

## Important Notes

1. **Never Modify Active Rules Directly**: Always use the API which creates versions

2. **Change Reasons Required**: All updates must include why the change was made

3. **Testing**: Create draft rules first, test, then activate

4. **Migration**: Existing bets won't have tax details, only new bets after rules are active

5. **Manual Settlement**: Manual settlements also apply jurisdiction rules automatically

6. **Multiple Countries**: Create separate rules for each country/jurisdiction

7. **Same Country, Different Profiles**: Use profileName field (e.g., "standard", "VIP", "special")

---

## Next Steps (Optional Enhancements)

While the core system is complete, consider these additions:

1. **Staging Environment**: Separate database for testing new rules
2. **Rule Simulator**: Test rule calculations before activating
3. **Batch Settlement Reports**: Export all deductions for period
4. **Payment to Authorities**: Track when taxes are paid to government
5. **Multi-Currency Support**: FX conversion if needed
6. **Player Limit Integration**: Daily win limits per jurisdiction
7. **Approval Workflow**: Require approval before rule activation
8. **Email Notifications**: Alert compliance team on rule changes
9. **Export Features**: CSV/PDF export of all deductions
10. **Dashboard**: Visual reporting on taxes collected

---

## Compliance Benefits

✅ **Audit Ready**: Complete trail from bet to tax payment
✅ **Regulator Friendly**: Clear documentation of all deductions
✅ **Investor Confidence**: Professional financial controls
✅ **No Manual Errors**: Automatic calculation eliminates mistakes
✅ **Historical Accuracy**: Old bets tied to rule versions
✅ **Transparent**: Players see exactly what was deducted
✅ **Flexible**: Add new countries without developer
✅ **Scalable**: Same system for all jurisdictions
✅ **Provable**: Every deduction has ledger entry
✅ **Reversible**: Can reverse settlements with full trail

---

## Files Created/Modified

### New Models:
- `lib/models/JurisdictionRule.js`
- `lib/models/SystemAccount.js`

### Enhanced Models:
- `lib/models/LedgerEntry.js` (added tax fields)
- `lib/models/Bet.js` (added taxDetails)
- `lib/models/index.js` (exported new models)

### Engine Updates:
- `lib/sandbox/settlement-engine.js` (applies jurisdiction rules)
- `lib/ledger-engine.js` (tax deduction methods)

### UI Components:
- `app/s/jurisdiction-rules/page.jsx` (admin UI)
- `components/betting/bet-receipt-modal.jsx` (player receipt)

### API Routes:
- `app/api/super/jurisdiction-rules/route.js`

### Config:
- `next.config.mjs` (fixed serverActions config)
- `package.json` (updated vaul version)

---

## Support

For questions about this implementation:
1. Review this document
2. Check code comments in key files
3. Test with draft rules first
4. Use change reasons for audit trail

**Remember**: This system is designed to be NO-CODE for new countries. Once set up, anyone can add new jurisdiction rules through the admin UI without touching code.
