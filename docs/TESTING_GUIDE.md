# Regulatory Testing Guide
## Step-by-Step Instructions for Regulators

**Last Updated:** December 2024  
**Estimated Time:** 1-2 hours for complete testing

---

## Pre-Testing Setup

### Required Access
- Super Admin account credentials
- Access to platform: `https://[your-domain]/s/sandbox-testing`
- Browser: Chrome, Firefox, or Edge (latest version)

### What You'll Verify
1. ✅ Multi-selection betting (1-100 selections)
2. ✅ Max winning limit enforcement (server-side)
3. ✅ Settlement engine functionality
4. ✅ Ledger double-entry accounting
5. ✅ Audit logging for all actions
6. ✅ Report generation

---

## Test 1: Basic Bet Placement (10 minutes)

### Objective
Verify system can accept and process single bets correctly.

### Steps

**1.1 Login as Super Admin**
```
URL: /auth/staff-login
Email: [provided by admin]
Password: [provided by admin]
```

**1.2 Create Demo Event**
```
Navigate to: /s/sandbox-testing
Click: "Create Demo Event" button

Fill form:
- Home Team: Manchester United
- Away Team: Liverpool
- Start Time: [Tomorrow at 3:00 PM]
- Home Odds: 2.5
- Draw Odds: 3.5
- Away Odds: 3.0

Click: "Create Event"
```

**1.3 Create Test Player**
```
Navigate to: /s/players
Click: "Add Player"

Fill form:
- Name: Test Player 1
- Email: testplayer1@test.com
- Password: TestPass123!
- Initial Balance: $10,000

Click: "Create Player"
```

**1.4 Place Bet as Player**
```
Logout from admin
Login as: testplayer1@test.com

Navigate to: Sports Betting page
Find: Manchester United vs Liverpool
Click: "Home" (2.5 odds)
Enter Stake: $100
Expected Potential Win: $250

Click: "Place Bet"
```

### Verification Points
- ✅ Bet placed successfully
- ✅ Bet ticket number generated (e.g., BET-ABC123)
- ✅ Wallet deducted $100 (new balance: $9,900)
- ✅ Bet appears in "My Bets" with status "Pending"

### Evidence to Capture
- Screenshot of bet slip
- Screenshot of transaction history
- Bet ticket number

---

## Test 2: Multi-Selection Bet (15 minutes)

### Objective
Verify system supports multiple selections on single betslip.

### Steps

**2.1 Create Multiple Events**
```
Login as Super Admin
Navigate to: /s/sandbox-testing

Create 5 events:
Event 1: Barcelona vs Real Madrid (2.2 / 3.0 / 3.5)
Event 2: Bayern vs Dortmund (1.9 / 3.5 / 4.0)
Event 3: PSG vs Marseille (1.7 / 3.8 / 5.0)
Event 4: Chelsea vs Arsenal (2.0 / 3.3 / 3.7)
Event 5: Juventus vs Inter (2.3 / 3.1 / 3.4)
```

**2.2 Create Multi-Selection Bet**
```
Login as test player
Add all 5 events to betslip:
- Event 1: Home (2.2)
- Event 2: Home (1.9)
- Event 3: Home (1.7)
- Event 4: Home (2.0)
- Event 5: Home (2.3)

System should calculate:
Total Odds: 2.2 × 1.9 × 1.7 × 2.0 × 2.3 = 32.68

Enter Stake: $500
Expected Potential Win: $16,340

Click: "Place Bet"
```

### Verification Points
- ✅ System accepts 5 selections
- ✅ Total odds calculated correctly (32.68)
- ✅ Potential win calculated correctly ($16,340)
- ✅ Bet placed successfully
- ✅ Wallet deducted $500

### Evidence to Capture
- Screenshot of betslip with all 5 selections
- Screenshot showing total odds calculation
- Bet ticket number

---

## Test 3: Max Winning Limit Enforcement (20 minutes)

### Objective
**CRITICAL TEST:** Verify max winning limit is enforced server-side.

### Steps

**3.1 Create High-Odds Multi-Selection**
```
Login as test player
Add 5 high-odds selections:
- Event 1: Away (3.5)
- Event 2: Draw (3.5)
- Event 3: Away (5.0)
- Event 4: Away (3.7)
- Event 5: Away (3.4)

Total Odds: 3.5 × 3.5 × 5.0 × 3.7 × 3.4 = 751.25
```

**3.2 Attempt to Exceed Limit**
```
Enter Stake: $1,000
Calculated Potential Win: $751,250
Max Winning Limit: $500,000

Click: "Place Bet"

EXPECTED RESULT: Bet REJECTED
```

### Verification Points
- ✅ Bet rejected with clear error message
- ✅ Error shows: "Potential winning $751,250 exceeds maximum $500,000"
- ✅ Error shows: "Maximum stake at these odds: $665.56"
- ✅ Wallet NOT deducted
- ✅ No bet created in database

**3.3 Place at Maximum Allowed Stake**
```
Use suggested stake: $665
Potential Win: $499,581 (under $500k limit)

Click: "Place Bet"

EXPECTED RESULT: Bet ACCEPTED
```

### Verification Points
- ✅ Bet accepted
- ✅ Wallet deducted $665
- ✅ Bet ticket generated
- ✅ Potential win shown as $499,581

**3.4 Verify Server-Side Enforcement**
```
Open Browser DevTools (F12)
Go to Network tab
Try to bypass frontend validation by:
- Modifying stake in request payload
- Sending direct API call

EXPECTED RESULT: Server returns 400 error
Error message: "Bet validation failed"
```

### Verification Points
- ✅ Server validates independently of client
- ✅ Cannot bypass limit via API manipulation
- ✅ All attempts logged in audit trail

### Evidence to Capture
- Screenshot of rejection message
- Screenshot of successful bet at max stake
- Screenshot of server response in DevTools
- Export of audit logs showing both attempts

---

## Test 4: Settlement Process (15 minutes)

### Objective
Verify settlement engine processes results correctly.

### Steps

**4.1 Settle Single Event**
```
Login as Super Admin
Navigate to: /s/sandbox-testing
Section: "Settle Event"

Select Event: Manchester United vs Liverpool
Enter Result:
- Home Score: 2
- Away Score: 1

Click: "Settle Event"
```

### Verification Points
- ✅ Event status changed to "Finished"
- ✅ All bets for event processed
- ✅ Winning bets show status "Won"
- ✅ Losing bets show status "Lost"
- ✅ Settlement report generated showing:
  - Bets processed
  - Total staked
  - Total paid out
  - GGR

**4.2 Verify Player Payout**
```
Login as test player
Check wallet balance
Check bet history

For winning bet from Test 1:
- Original stake: $100
- Odds: 2.5
- Expected payout: $250
```

### Verification Points
- ✅ Wallet credited with winnings
- ✅ Bet status shows "Won"
- ✅ Payout amount correct
- ✅ Transaction appears in history

**4.3 Manual Settlement**
```
Login as Super Admin
Navigate to: /s/bets
Find a pending bet
Click: "Actions" → "Settle Manually"

Select Outcome: Won
Enter Reason: "Manual settlement test"
Click: "Settle Bet"
```

### Verification Points
- ✅ Bet status updated
- ✅ Payout processed
- ✅ Reason recorded in audit log

### Evidence to Capture
- Screenshot of settlement report
- Screenshot of wallet transaction
- Screenshot of bet status changes

---

## Test 5: Ledger Verification (15 minutes)

### Objective
Verify double-entry ledger is balanced and complete.

### Steps

**5.1 Review Ledger Entries**
```
Login as Super Admin
Navigate to: /s/ledger/statements

Select: Test Player 1's wallet
Date Range: Today

Review all entries
```

### Verification Points
For each transaction, verify TWO entries exist:
- ✅ Bet placement: Debit (Player) + Credit (Revenue)
- ✅ Bet winning: Debit (Revenue) + Credit (Player)
- ✅ Balance before/after recorded
- ✅ Running balance correct

**5.2 Verify Ledger Balance**
```
Navigate to: /s/ledger/reports
Section: "Ledger Balance Check"

Click: "Run Balance Check"

System calculates:
- Total debits from all entries
- Total credits from all entries
```

### Verification Points
- ✅ Total debits = Total credits (MUST be equal)
- ✅ No orphaned entries
- ✅ All entries have references (bet ID, transaction ID)
- ✅ Timestamps are sequential

**5.3 Export Ledger**
```
Click: "Export Ledger" → CSV

Open exported file
Verify contains:
- Entry number
- Date & time
- Account names
- Debit/credit amounts
- Balances
- References
- Descriptions
```

### Evidence to Capture
- Screenshot of ledger balance report
- Exported CSV file
- Screenshot showing debits = credits

---

## Test 6: Audit Trail (10 minutes)

### Objective
Verify all actions are logged and auditable.

### Steps

**6.1 Review Audit Logs**
```
Login as Super Admin
Navigate to: /s/audit-logs

Filter by:
- Date: Today
- User: Test Player 1
- Action: All

Review logs
```

### Verification Points
Verify logs exist for ALL actions:
- ✅ User login
- ✅ Bet placement (successful)
- ✅ Bet placement (rejected - exceeded limit)
- ✅ Bet placement (successful at max stake)
- ✅ Wallet deduction
- ✅ Bet settlement
- ✅ Wallet credit
- ✅ Event result setting
- ✅ Admin actions

**6.2 Review Log Details**
```
Click on any log entry
Verify contains:
- Timestamp (precise to second)
- Actor (who did it)
- Action (what was done)
- Resource (what was affected)
- Details (full data)
- IP address
- User agent
- Outcome (success/failure)
```

### Verification Points
- ✅ All required fields present
- ✅ Timestamps accurate
- ✅ Details include bet amount, odds, etc.
- ✅ Failed attempts logged (exceeded limit)
- ✅ Logs immutable (cannot be edited)

**6.3 Export Audit Logs**
```
Click: "Export Audit Logs" → CSV
Date Range: Today

Open exported file
```

### Verification Points
- ✅ Export contains all logs
- ✅ Format suitable for regulatory review
- ✅ Can be imported to Excel/analysis tools

### Evidence to Capture
- Screenshot of audit log list
- Screenshot of detailed log entry
- Exported CSV file

---

## Test 7: Reports Generation (10 minutes)

### Objective
Verify system can generate required regulatory reports.

### Steps

**7.1 GGR Report**
```
Login as Super Admin
Navigate to: /s/sandbox-testing
Section: "Generate Reports"

Report Type: GGR (Gross Gaming Revenue)
Date Range: Today
Click: "Generate"
```

### Verification Points
Report should show:
- ✅ Total bets placed
- ✅ Total amount staked
- ✅ Total amount paid out
- ✅ GGR = Staked - Paid Out
- ✅ Margin percentage
- ✅ Breakdown by sport/game type

**7.2 Bet History Report**
```
Report Type: Bet History
Filters:
- Player: Test Player 1
- Date: Today
- Status: All

Click: "Generate"
```

### Verification Points
- ✅ All bets listed
- ✅ Details include: ticket number, selections, odds, stake, status
- ✅ Can filter by status (pending/won/lost)
- ✅ Export to CSV available

**7.3 Settlement Report**
```
Report Type: Settlement Report
Date Range: Today
Click: "Generate"
```

### Verification Points
- ✅ Events settled listed
- ✅ Bets processed per event
- ✅ Payouts per event
- ✅ GGR per event

### Evidence to Capture
- Screenshot of each report
- Exported report files (CSV)

---

## Test 8: Edge Cases (15 minutes)

### Objective
Test system behavior in unusual scenarios.

### Steps

**8.1 Test: Zero Selections**
```
Try to place bet with no selections
EXPECTED: Error "No selections provided"
```

**8.2 Test: Insufficient Balance**
```
Try to place $100,000 bet (player only has ~$10k)
EXPECTED: Error "Insufficient balance"
```

**8.3 Test: Betting on Finished Event**
```
Admin settles an event
Player tries to bet on that event
EXPECTED: Error "Betting closed for this event"
```

**8.4 Test: Duplicate Selection**
```
Try to add same event twice to betslip
EXPECTED: Error "Duplicate selection"
```

**8.5 Test: Minimum Stake**
```
Try to place $0.50 bet (min is $1)
EXPECTED: Error "Minimum stake is $1"
```

### Verification Points
- ✅ All edge cases handled gracefully
- ✅ Clear error messages
- ✅ No system crashes
- ✅ All errors logged in audit trail

---

## Test 9: Load Testing (Optional, 20 minutes)

### Objective
Verify system can handle multiple simultaneous bets.

### Steps

**9.1 Create Multiple Players**
```
Create 10 test players
Top up each with $1,000
```

**9.2 Place Simultaneous Bets**
```
Using multiple browser windows:
- Login as different players
- Place bets on same events
- All at the same time
```

### Verification Points
- ✅ All bets processed correctly
- ✅ No race conditions
- ✅ Ledger remains balanced
- ✅ Audit logs complete

---

## Test 10: Final Verification (10 minutes)

### Objective
Comprehensive final check of all systems.

### Checklist

**Database Integrity**
- [ ] All bets have corresponding ledger entries
- [ ] All wallets balance correctly
- [ ] No orphaned records
- [ ] All foreign key relationships valid

**Compliance Requirements**
- [ ] Max winning limit enforced (Test 3)
- [ ] Multi-selection support (1-100) works (Test 2)
- [ ] Settlement engine functional (Test 4)
- [ ] Ledger is balanced (Test 5)
- [ ] Audit trail complete (Test 6)
- [ ] Reports generate correctly (Test 7)
- [ ] Edge cases handled (Test 8)

**Documentation**
- [ ] All evidence captured (screenshots, exports)
- [ ] Test results documented
- [ ] Any issues noted with details

---

## Evidence Package for Regulators

### Required Documentation

1. **Screenshots** (saved in dated folder)
   - Bet placement (accepted)
   - Bet rejection (exceeded limit)
   - Settlement reports
   - Ledger balance verification
   - Audit log entries
   - Generated reports

2. **Exported Files**
   - Ledger statement (CSV)
   - Audit logs (CSV)
   - GGR report (CSV)
   - Bet history (CSV)

3. **Test Summary Report**
```
Date: [YYYY-MM-DD]
Tester: [Name]
Duration: [X hours]

Tests Completed: 10/10
Tests Passed: 10/10
Tests Failed: 0/10

Critical Requirements:
✅ Max Winning Enforcement: PASS
✅ Multi-Selection Support: PASS
✅ Settlement Engine: PASS
✅ Ledger Integrity: PASS
✅ Audit Trail: PASS

Issues Found: None

Conclusion: System fully compliant with regulatory requirements.
```

4. **Video Recording** (Optional)
   - Screen recording of key tests
   - Especially Test 3 (max winning enforcement)

---

## Post-Testing

### Access to Production Data

Regulators can be provided with:
1. Read-only database access
2. API access with audit key
3. Dashboard access for real-time monitoring

### Ongoing Compliance

System provides:
- Daily backup of all data
- Monthly compliance reports
- Real-time alerts for anomalies
- 24/7 access to audit logs

---

## Support During Testing

**Technical Contact:**
- Email: tech@goalbet.com
- Phone: [Provided separately]
- Available: 24/7

**Compliance Contact:**
- Email: compliance@goalbet.com
- Phone: [Provided separately]
- Available: Business hours

---

**END OF TESTING GUIDE**

All tests designed to demonstrate full regulatory compliance.
Expected completion time: 1-2 hours for comprehensive testing.
