# Multi-Tenant Subdomain Architecture Implementation Guide

## Overview
Your Goal-Bett platform will transition from path-based routing to subdomain-based routing:

**Before (Current):**
- Super Admin: goal-bett.vercel.app/s/...
- Tenant Admin: goal-bett.vercel.app/t/{tenant}/admin
- Public Sites: goal-bett.vercel.app/p/...
- Agent Portal: goal-bett.vercel.app/a/...

**After (New Architecture):**
- Super Admin: super.goal-bett.vercel.app
- Tenant Admin: {tenant}.goal-bett.vercel.app/admin
- Public Sites: {tenant}.goal-bett.vercel.app
- Agent Portal: {tenant}.goal-bett.vercel.app/agent
- Dev Fallback: goal-bett.vercel.app/t/{tenant}/... (still works)

---

## Step 1: Vercel Domain Configuration (5 minutes)

### 1.1 Add Wildcard Domain in Vercel
1. Go to **Vercel Dashboard** → Your Project
2. Navigate to **Settings** → **Domains**
3. Add domain: `*.goal-bett.vercel.app`
4. Select "Wildcard domain"
5. Vercel will automatically validate

### 1.2 Configure DNS (if using custom domain)
If using your own domain (e.g., goal-bett.com):

1. **Go to your DNS provider** (Cloudflare, GoDaddy, etc.)
2. **Add A record:**
   - Name: `*` (wildcard)
   - Value: `76.76.19.21` (Vercel's IP)
   - TTL: 3600

3. **Add CNAME record:**
   - Name: `@` (root)
   - Value: `cname.vercel-dns.com`

---

## Step 2: Code Implementation

### 2.1 Add Middleware for Subdomain Routing
Create file: `middleware.js` or `middleware.ts`

This handles:
- Extracting subdomain from request
- Routing to correct app section
- Maintaining backwards compatibility with path-based fallback

### 2.2 Update Next.js Config
Enable subdomain parsing and rewrites in next.config.mjs

### 2.3 Update Layout Components
Ensure each context (Super Admin, Tenant Admin, Public, Agent) loads correct branding

### 2.4 Environment Variables
Add new variables for subdomain logic

---

## Step 3: Testing & Deployment

### 3.1 Local Development
- Test with `localhost:3000` (main app)
- Use `/t/{tenant}` paths for backwards compatibility

### 3.2 Staging
- Deploy to Vercel preview
- Test subdomains via Vercel preview URL

### 3.3 Production Cutover
- Deploy middleware changes
- Update DNS records
- Keep legacy routes as fallback

---

## Route Mapping

| Access Point | Old Path | New Subdomain | Type |
|---|---|---|---|
| Super Admin | `/s/...` | `super.goal-bett.vercel.app` | Subdomain |
| Tenant Admin | `/t/{tenant}/admin` | `{tenant}.goal-bett.vercel.app/admin` | Subdomain + Path |
| Public Betting | `/p/...` | `{tenant}.goal-bett.vercel.app` | Subdomain |
| Agent Portal | `/a/...` | `{tenant}.goal-bett.vercel.app/agent` | Subdomain + Path |
| Fallback | `/t/{tenant}/...` | Same | Path (backwards compat) |

---

## Architecture Benefits

1. **Clean Branding**: Each tenant gets their own domain
2. **Scalability**: Add new tenants without code changes
3. **Security**: Tenant data isolated by subdomain
4. **SEO**: Each tenant has independent domain authority
5. **Simplicity**: Path-based fallback prevents breaking changes

---

## Current Status
Waiting for code implementation in Steps 2-4 above.
```

Now let me create the middleware:
