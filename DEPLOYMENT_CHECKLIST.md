# Deployment Checklist

## Pre-Deployment (Today)

- [ ] Copy middleware.js to project root
- [ ] Create lib/subdomain-utils.js
- [ ] Create components/providers/tenant-provider.jsx
- [ ] Create app/s/layout.jsx
- [ ] Create app/t/[tenant]/layout.jsx
- [ ] Update next.config.mjs
- [ ] Test locally at http://localhost:3000/t/test/...
- [ ] Commit & push to GitHub

## Vercel Configuration (10 minutes)

- [ ] Log in to Vercel Dashboard
- [ ] Go to Project Settings → Domains
- [ ] Add wildcard domain: *.goal-bett.vercel.app
- [ ] Wait for "Domain configured" status
- [ ] Verify it shows as "Wildcard domain"

## DNS Setup (If using custom domain)

- [ ] Log in to DNS provider (Cloudflare, GoDaddy, etc.)
- [ ] Add A record: * → 76.76.19.21 (Vercel IP)
- [ ] Add CNAME record: goal-bett.com → cname.vercel-dns.com
- [ ] Set TTL to 3600
- [ ] Wait 24-48 hours for propagation

## Testing in Vercel Preview

- [ ] Deploy to Vercel: `git push`
- [ ] Get preview URL from Vercel (e.g., goal-bett-xyz.vercel.app)
- [ ] Extract preview domain: goal-bett-xyz.vercel.app

### Test Super Admin
- [ ] Visit: super.goal-bett-xyz.vercel.app
- [ ] Verify: Shows /s/dashboard
- [ ] Check: Correct branding & navigation
- [ ] Test: Game library, settings, tenants

### Test Tenant Admin
- [ ] Visit: acme.goal-bett-xyz.vercel.app/admin
- [ ] Verify: Shows /t/acme/admin
- [ ] Check: Correct tenant name in UI
- [ ] Test: Player management, agent management

### Test Public Betting
- [ ] Visit: acme.goal-bett-xyz.vercel.app
- [ ] Verify: Shows /p/ (public betting)
- [ ] Check: Can view sports, place bets
- [ ] Test: Casino, slots, live games

### Test Agent Portal
- [ ] Visit: acme.goal-bett-xyz.vercel.app/agent
- [ ] Verify: Shows /a/ (agent interface)
- [ ] Check: Player management features
- [ ] Test: Bet operations

### Test Backwards Compatibility
- [ ] Visit: goal-bett-xyz.vercel.app/s/dashboard
- [ ] Verify: Super admin still works
- [ ] Visit: goal-bett-xyz.vercel.app/t/acme/...
- [ ] Verify: Legacy paths still work

## Production Deployment

- [ ] All preview tests passing
- [ ] Update environment variables in Vercel:
  - [ ] NEXT_PUBLIC_VERCEL_URL
  - [ ] NEXT_PUBLIC_SUPER_ADMIN_URL
  - [ ] NEXT_PUBLIC_APP_DOMAIN
- [ ] Deploy to production: `git push`
- [ ] Wait for build to complete
- [ ] DNS propagation complete (24-48 hours)

## Post-Launch Verification

- [ ] super.goal-bett.vercel.app accessible ✓
- [ ] Tenant subdomains working ✓
- [ ] Admin paths accessible ✓
- [ ] Agent portals working ✓
- [ ] Backwards compat paths working ✓
- [ ] Monitor error logs for 24 hours
- [ ] Check performance metrics
- [ ] Verify all tenants operational

## Documentation Updates

- [ ] Update README with new URLs
- [ ] Create tenant onboarding guide
- [ ] Document subdomain naming convention
- [ ] Create admin training materials
- [ ] Update support documentation

## Monitoring & Support

- [ ] Set up error tracking (Sentry, LogRocket, etc.)
- [ ] Configure performance monitoring
- [ ] Create runbook for common issues
- [ ] Set up alerts for failed deployments
- [ ] Schedule team training session

---

## Estimated Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| Code Implementation | 15 min | Ready |
| Vercel Config | 10 min | Pending |
| DNS Setup | 24-48 hrs | Pending |
| Testing | 30 min | Pending |
| Production Deploy | 5 min | Pending |
| **Total** | **~2 days** | **Ready to start** |

---

## Quick Rollback Plan

If issues occur in production:

1. Go to Vercel Deployments
2. Click "Rollback to previous version"
3. Keep wildcard domain active (backwards compat paths still work)
4. Fix issue locally
5. Re-deploy when ready

**Zero downtime rollback guaranteed.**

---

## Support Contacts

- Vercel Support: https://vercel.com/help
- DNS Issues: Contact your registrar support
- Custom domain setup: https://vercel.com/docs/concepts/projects/custom-domains
