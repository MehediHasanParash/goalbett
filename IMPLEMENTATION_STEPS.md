# Step-by-Step Implementation Guide

## Phase 1: Local Development Setup (Today)

### Step 1: Copy Middleware File
- Copy the middleware.js code to your project root
- Run `npm run dev` to test locally
- Test with: http://localhost:3000/t/testbrand/...

### Step 2: Add Utilities
- Create `/lib/subdomain-utils.js` with the provided code
- This is used by middleware and components

### Step 3: Add Tenant Provider
- Create `/components/providers/tenant-provider.jsx`
- Wrap your layout components with this provider

### Step 4: Test Backwards Compatibility
- Your current paths still work: /s/..., /p/..., /a/..., /t/...
- Middleware transparently handles routing

---

## Phase 2: Vercel Configuration (10 minutes)

### Step 5: Configure Wildcard Domain
1. Log in to Vercel Dashboard
2. Go to Your Project → Settings → Domains
3. Click "Add Domain"
4. Enter: `*.goal-bett.vercel.app`
5. Verify it shows "Wildcard domain configured"

### Step 6: Update DNS (Only if using custom domain)
If you own goal-bett.com:

1. Go to your DNS provider
2. Add wildcard A record: `*.goal-bett.com` → `76.76.19.21`
3. Add CNAME for root: `goal-bett.com` → `cname.vercel-dns.com`
4. Wait 24-48 hours for DNS propagation

---

## Phase 3: Testing Subdomains (In Vercel)

### Step 7: Deploy to Vercel
```bash
git add .
git commit -m "Add subdomain routing"
git push
```

### Step 8: Test Subdomains
Once deployed, Vercel auto-creates preview URLs:

- **Super Admin:** `super.goal-bett-7j2k3kl.vercel.app`
- **Tenant:** `acme.goal-bett-7j2k3kl.vercel.app`
- **Agent:** `acme.goal-bett-7j2k3kl.vercel.app/agent`

### Step 9: Verify Routing
- Visit: `super.goal-bett-7j2k3kl.vercel.app` → Should show /s/dashboard
- Visit: `acme.goal-bett-7j2k3kl.vercel.app` → Should show /p/dashboard
- Visit: `acme.goal-bett-7j2k3kl.vercel.app/admin` → Should show /t/acme/admin
- Visit: `acme.goal-bett-7j2k3kl.vercel.app/agent` → Should show /a/dashboard

---

## Phase 4: Production Deployment

### Step 10: Verify in Production
Once DNS propagates:
- `super.goal-bett.vercel.app` works ✓
- `mytenantname.goal-bett.vercel.app` works ✓
- Backwards compatibility: `goal-bett.vercel.app/s/...` still works ✓

### Step 11: Update Environment Variables
Add to Vercel:
```
NEXT_PUBLIC_VERCEL_URL=goal-bett.vercel.app
NEXT_PUBLIC_SUPER_ADMIN_URL=https://super.goal-bett.vercel.app
NEXT_PUBLIC_APP_DOMAIN=goal-bett.vercel.app
```

### Step 12: Monitor & Rollback
- Monitor traffic for first 24 hours
- If issues: deployment automatically rolls back via Vercel
- Legacy paths still work as fallback

---

## Files Changed Summary

| File | Action | Purpose |
|---|---|---|
| middleware.js | CREATE | Extract subdomain, route to correct app |
| lib/subdomain-utils.js | CREATE | Utility functions for subdomain detection |
| components/providers/tenant-provider.jsx | CREATE | Context for tenant info throughout app |
| app/s/layout.jsx | CREATE | Super Admin layout with context |
| app/t/[tenant]/layout.jsx | CREATE | Tenant fallback layout (backwards compat) |
| next.config.mjs | EDIT | Add header forwarding for subdomain |

---

## Troubleshooting

### Issue: Subdomain not resolving
**Solution:** Verify in Vercel Domains tab that wildcard is configured

### Issue: Getting 404 on subdomain
**Solution:** Check middleware.js is in project root (not in /app or /lib)

### Issue: User redirects to wrong tenant
**Solution:** Check TenantProvider context is being read correctly

### Issue: Environment variables not accessible
**Solution:** Ensure NEXT_PUBLIC_ prefix for client-side vars

---

## Scaling to Multiple Tenants

Once setup is complete, adding new tenants is simple:

1. Create tenant in database with name: "acme"
2. No code changes needed
3. Automatically works at: `acme.goal-bett.vercel.app`
4. Admin accessible at: `acme.goal-bett.vercel.app/admin`
5. Agents accessible at: `acme.goal-bett.vercel.app/agent`

---

## Timeline

- Phase 1 (Local): 15 minutes
- Phase 2 (Vercel): 10 minutes
- Phase 3 (Testing): 30 minutes
- Phase 4 (Production): 5 minutes

**Total: ~1 hour for complete implementation**
