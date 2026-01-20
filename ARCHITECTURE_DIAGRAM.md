# Visual Architecture Guide

## Current State (Before)

```
goal-bett.vercel.app/
├── /s/                          → Super Admin
├── /p/                          → Public User
├── /a/                          → Agent
└── /t/{tenant}/                 → Tenant (admin, agent, public)
```

All routes on single domain. Hard to brand, scales poorly.

---

## New State (After)

```
┌─────────────────────────────────────────────────────────────┐
│              Main Load Balancer (Middleware)                │
│        Reads subdomain, routes to correct app               │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┼───────────┬────────────┐
                │           │           │            │
                ▼           ▼           ▼            ▼
            ┌────────┐  ┌────────┐ ┌────────┐  ┌─────────┐
            │ super. │  │ acme.  │ │ betly. │  │ goal-   │
            │ goal-  │  │ goal-  │ │ goal-  │  │ bett.   │
            │ bett.  │  │ bett.  │ │ bett.  │  │ vercel. │
            │ vercel │  │ vercel │ │ vercel │  │ app     │
            │ .app   │  │ .app   │ │ .app   │  │ (root)  │
            └────────┘  └────────┘ └────────┘  └─────────┘
                │           │ │ │              │
                │           │ │ └──────────────┼── /t/{tenant}
                │           │ │                │   (backwards compat)
                ▼           │ │                │
            ┌────────────┐   │ │                │
            │  /s/...    │   │ │                ▼
            │ Super Admin│   │ │            ┌────────────┐
            │ Dashboard  │   │ │            │ Legacy     │
            │ Settings   │   │ │            │ Route      │
            │ Game Ctrl  │   │ │            │ Fallback   │
            │ Tenants    │   │ │            └────────────┘
            └────────────┘   │ │
                              │ │
                ┌─────────────┘ │
                │               │
                ▼               ▼
            ┌────────────┐  ┌────────────┐
            │ /admin     │  │ /          │
            │ Tenant     │  │ Public     │
            │ Admin      │  │ Betting    │
            │ Dashboard  │  │ Site       │
            │ Controls   │  │ Sports     │
            └────────────┘  │ Casino     │
                            │ Slots      │
                            └────────────┘
```

Clean separation, independent branding, scales infinitely.

---

## Request Flow Example

### Request: super.goal-bett.vercel.app/dashboard

```
1. Browser Request
   ↓
2. Middleware detects subdomain = 'super'
   ↓
3. Routes to /s/dashboard
   ↓
4. Super Admin Dashboard rendered
   ↓
5. TenantProvider sets context = 'super-admin'
   ↓
6. Components load Super Admin branding & navigation
```

### Request: acme.goal-bett.vercel.app/admin

```
1. Browser Request
   ↓
2. Middleware detects subdomain = 'acme'
   ↓
3. Checks pathname = /admin
   ↓
4. Routes to /t/acme/admin
   ↓
5. Tenant Admin Dashboard rendered
   ↓
6. TenantProvider sets context = 'tenant-admin'
   ↓
7. Components load ACME branding & controls
```

### Request: acme.goal-bett.vercel.app/sports

```
1. Browser Request
   ↓
2. Middleware detects subdomain = 'acme'
   ↓
3. Checks pathname = /sports (no /admin, no /agent)
   ↓
4. Routes to /p/sports
   ↓
5. Public Betting Site rendered
   ↓
6. TenantProvider sets context = 'public'
   ↓
7. Components load public betting interface with ACME branding
```

---

## Context Types & Roles

### 1. Super Admin
- **Subdomain:** super.goal-bett.vercel.app
- **Route:** /s/*
- **Access:** Global settings, all tenants, game library
- **Features:** Tenant CRUD, system settings, audit logs

### 2. Tenant Admin
- **Subdomain:** {tenant}.goal-bett.vercel.app
- **Route:** /admin
- **Access:** Their tenant only
- **Features:** Player management, agent management, branding

### 3. Public User
- **Subdomain:** {tenant}.goal-bett.vercel.app
- **Route:** / (root)
- **Access:** Betting interface, casino, results
- **Features:** Place bets, view odds, manage wallet

### 4. Agent
- **Subdomain:** {tenant}.goal-bett.vercel.app
- **Route:** /agent
- **Access:** Their assigned shop, players
- **Features:** Register players, manage bets, cash operations

---

## Scaling Sequence

### Day 1: Launch
- super.goal-bett.vercel.app ✓
- goal-bett.vercel.app (backwards compat) ✓

### Week 1: First Tenants
- acme.goal-bett.vercel.app ✓
- betly.goal-bett.vercel.app ✓

### Month 1: Growth
- 10+ tenant subdomains ✓
- No new deployments needed

### Year 1: Scale
- 100+ tenants ✓
- Pure database-driven multitenancy
```

---

## Database Integration (Future Phase)

When ready, tenants can be loaded from database:

```javascript
// middleware.js
const subdomain = extractSubdomain(hostname);
const tenant = await db.tenants.findOne({ slug: subdomain });
// Validate license, set branding, etc.
```

This enables:
- License key validation
- Custom branding per tenant
- Feature flags per tenant
- Usage tracking per tenant
- Dynamic theme loading
