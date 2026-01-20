# URL Access Guide - Goal Bett on Vercel

## Current Domain
- **Production:** https://goal-bett.vercel.app
- **Development:** http://localhost:3000

## Role-Based Access URLs

### Super Admin (Global System Control)
- **URL:** `https://goal-bett.vercel.app/s`
- **Login:** `https://goal-bett.vercel.app/s/login`
- **Dashboard:** `https://goal-bett.vercel.app/s/dashboard`
- **Access Level:** System-wide administration
- **Permissions:** Manage all tenants, system settings, global payments

**Demo Credentials:**
- Email: `superadmin@demo.com`
- Password: `demo123`

### Tenant Admin (Brand Management)
- **URL:** `https://goal-bett.vercel.app/t`
- **Login:** `https://goal-bett.vercel.app/t/login`
- **Dashboard:** `https://goal-bett.vercel.app/t/dashboard`
- **Access Level:** Single tenant administration
- **Permissions:** Manage brand, agents, payment methods, risk settings

**Demo Credentials:**
- Email: `tenant@demo.com`
- Password: `demo123`

### Agent (Sub-Agent Management)
- **URL:** `https://goal-bett.vercel.app/a`
- **Login:** `https://goal-bett.vercel.app/a/login`
- **Dashboard:** `https://goal-bett.vercel.app/a/dashboard`
- **Access Level:** Agent operations
- **Permissions:** Create sub-agents, manage credits, view commissions

**Demo Credentials:**
- Email: `agent@demo.com`
- Password: `demo123`

### Sub-Agent (Under Agent Management)
- **URL:** `https://goal-bett.vercel.app/a/subagents`
- **Dashboard:** `https://goal-bett.vercel.app/a/subagents`
- **Access Level:** Sub-agent operations
- **Permissions:** Place bets for customers, manage own wallet

### Player (Registered Users)
- **URL:** `https://goal-bett.vercel.app/p`
- **Login:** `https://goal-bett.vercel.app/p/login`
- **Dashboard:** `https://goal-bett.vercel.app/p/dashboard`
- **Access Level:** Player betting platform
- **Permissions:** Place bets, manage wallet, view history

**Demo Credentials:**
- Email: `player@demo.com`
- Password: `demo123`

### Guest (Public - No Login Required)
- **URL:** `https://goal-bett.vercel.app`
- **Dashboard:** `https://goal-bett.vercel.app`
- **Access Level:** Public betting
- **Permissions:** View odds, place bets without account (generates temp BetID)

## Payment Methods by Tenant Admin

Each Tenant Admin can toggle payment methods active/inactive:

### Available Payment Methods
1. **Bank Transfer** - Direct bank deposits
2. **M-Pesa** - Mobile money (enabled by default)
3. **Orange Money** - Orange mobile money (enabled by default)
4. **Card Payment** - Debit/Credit cards
5. **Airtime Payment** - Mobile airtime deposits (can be enabled)
6. **Cryptocurrency** - BTC, ETH, USDT, USDC (can be enabled)

### Configuring Payment Methods
1. Go to: `https://goal-bett.vercel.app/t/dashboard`
2. Navigate to Tenants/Configuration
3. Select payment method toggle on/off
4. Add API credentials
5. Save configuration

## Custom Domain Setup (Future)

When custom domains are configured, the URL structure will be:
- Super Admin: `https://super.goalbet.com`
- Tenant Admin: `https://brand.goalbet.com/admin`
- Agent: `https://brand.goalbet.com/agent`
- Sub-Agent: `https://brand.goalbet.com/subagent`
- Player: `https://brand.goalbet.com`
- Guest: `https://brand.goalbet.com` (can place bets without login)

## Environment Variables

```env
NEXT_PUBLIC_API_BASE_URL=https://api.goal-bett.vercel.app/v1
NEXT_PUBLIC_BASE_URL=https://goal-bett.vercel.app
NEXT_PUBLIC_ENV=production
```

## Development

For local development:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/v1
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_ENV=development
```

## Notes

- All role-based paths are relative and work seamlessly with the Vercel domain
- Sessions are managed via JWT tokens stored in localStorage
- Custom domain support will be added in future updates
- Payment method availability is controlled per tenant by Tenant Admins
