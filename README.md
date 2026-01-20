# goal-bett
# GoalBet - Sports Betting & Casino Platform

A comprehensive sports betting and casino platform built with Next.js, featuring multi-shell architecture for different user roles (Players, Agents, Tenant Admins, Super Admins).

## Features

### Core Features
- **Sports Betting**: Live odds on 1000+ matches daily
- **Casino Games**: Slots, Roulette, Blackjack, and more
- **BetID System**: Generate shareable BetIDs valid for 24 hours
- **Agent Network**: Agent shops can accept cash bets
- **Guest Mode**: Build bets without registration
- **Bulk Game Upload**: Admin interface for importing games (CSV/JSON)

### Compliance & Security
- **Age Gate**: 18+ verification on entry
- **Responsible Gaming**: Nudges and limits
- **Audit Logs**: Track all admin actions
- **Demo Mode**: Fully functional demo environment
- **Role-Based Access**: Protected routes for each role
- **Security Headers**: CSRF tokens, HTTP-only cookies

### Multi-Locale Support
- English, Arabic (RTL), Spanish, French, Portuguese, Swahili
- Currency formatting for USD, EUR, GBP, KES
- Responsive design for mobile/tablet/desktop

### Analytics & Performance
- Event tracking (PageView, AddToSlip, PlaceBet, etc.)
- Performance optimizations (lazy loading, code splitting)
- Accessibility (WCAG AA)
- Responsive mobile-first design

## Getting Started

### Demo Credentials

**Player**
- Email: `player@demo.com`
- Password: `demo123`

**Agent**
- Email: `agent@demo.com`
- Password: `demo123`

**Tenant Admin**
- Email: `tenant@demo.com`
- Password: `demo123`

**Super Admin**
- Email: `superadmin@demo.com`
- Password: `demo123`

### Project Structure

\`\`\`
app/
├── page.jsx                  # Homepage
├── guest/                    # Guest mode pages
├── auth/                     # Authentication
├── p/                        # Player shell
├── a/                        # Agent shell
├── t/                        # Tenant admin shell
└── s/                        # Super admin shell

components/
├── guest/                    # Guest-specific components
├── admin/                    # Admin components
├── compliance/               # Compliance & security
├── dashboard/                # Dashboard components
└── ui/                       # Reusable UI components

lib/
├── analytics-events.ts       # Event tracking
├── auth-service.ts           # Auth utilities
├── env-config.ts             # Feature flags
└── guest-service.ts          # Guest utilities
\`\`\`

### Key Routes

- `/` - Homepage
- `/guest` - Guest betting interface
- `/auth/login` - Login page
- `/auth/signup` - Sign up page
- `/p/dashboard` - Player dashboard
- `/a/dashboard` - Agent dashboard
- `/t/dashboard` - Tenant admin dashboard
- `/s/dashboard` - Super admin dashboard (with games upload)

## Environment Variables

Create `.env.local` file:

\`\`\`bash
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_TENANT_DOMAIN=localhost
NEXT_PUBLIC_CURRENCY=USD
NEXT_PUBLIC_FEATURE_GUEST_MODE=true
NEXT_PUBLIC_ANALYTICS_ID=demo-analytics
NEXT_PUBLIC_DEMO_MODE=true
\`\`\`

## Design System

### Color Palette
- Primary: `#0A1A2F` (Dark Blue)
- Secondary: `#FFD700` (Gold)
- Accent: `#FFA500` (Orange)
- Background: `#0D1F35`
- Muted: `#B8C5D6` (Gray)
- Foreground: `#F5F5F5` (Light Gray)

### Typography
- Font Sans: Geist
- Font Mono: Geist Mono

### Components
All components follow shadcn/ui patterns with custom theming. Custom components include:
- BetSlip drawer
- BetID modal with QR
- Age gate modal
- Games bulk uploader
- Audit log viewer
- Demo mode banner

## Copy Blocks (Per Requirements)

- **Age Gate**: "You must be 18+ to use GoalBet. Please confirm you are 18 or older to continue."
- **BetID Title**: "Your BetID"
- **Validity**: "Valid for 24 h or until odds change"
- **Guest Block CTA**: "Login to place bets online"
- **Demo CTA**: "Try Demo"
- **Nudge**: "Create a free account to save your slip"

## Compliance

### Security Features
- HTTP-only cookies for auth
- CSRF token protection
- Opaque IDs for database objects
- Masked sensitive IDs (only BetID can be copied)
- Audit logs for provider upload, tenant creation, promotions

### Accessibility
- WCAG AA conformance
- Keyboard navigation
- Visible focus rings
- Screen reader support

### Analytics Events
- `page_view` - User navigates
- `add_to_slip` - Selection added to betslip
- `place_bet` - Bet placed
- `cash_in_out` - Cash transaction
- `promo_toggle` - Promotion enabled
- `jackpot_ticket` - Jackpot entry
- `betid_generated` - BetID created

## Performance Targets

- LCP < 2.5s
- CLS < 0.1
- TBT < 200ms (on 4G)
- Lazy loading for casino tiles
- Code splitting per shell

## Deployment

Ready for Vercel deployment:

\`\`\`bash
vercel deploy
\`\`\`

Environment variables will be configured in Vercel dashboard.

## Support

For issues or questions, please check demo credentials and ensure you're in demo mode.

---

**Built with Next.js, React, Tailwind CSS, and Recharts**
# goalbett
