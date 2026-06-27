# Membership pricing — rollout notes

Three tiers + one transactional production layer. This documents what must be
configured outside the repo before the release behaves correctly.

## Tiers
| Tier | Price | AI | Setup fee | Production | Size profiles |
|---|---|---|---|---|---|
| Free | $0 | 3 generations | **$25** | standard | 1 |
| Designer | $19/mo | unlimited | waived | standard | 1 |
| Brand | $79/mo | unlimited | waived | **5% off** | unlimited |

Per-piece prices, 2× sample, $4/extra-logo and the 50/50 deposit split are
unchanged — tiers only adjust the setup fee and the Brand discount.

## Required before rollout

### 1. Stripe — create two recurring prices
- Product **Designer** → recurring $19/mo → copy its Price ID.
- Product **Brand** → recurring $79/mo → copy its Price ID.
- Set env vars:
  - `STRIPE_DESIGNER_PRICE_ID=price_…`
  - `STRIPE_BRAND_PRICE_ID=price_…`
- Webhook (`/api/webhooks/stripe`) must receive, in addition to the existing
  `checkout.session.completed`:
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  (`STRIPE_WEBHOOK_SECRET` already required.)

### 2. Supabase — apply the migration
Run `supabase/migrations/20260627_membership_tiers.sql` (adds `tier`,
`stripe_customer_id`, `stripe_subscription_id`, `subscription_status`,
`subscription_current_period_end` to `user_credits`).

## Behavior
- Subscribing → `/api/checkout/subscription` (recurring Checkout). The webhook
  sets `tier` on success and keeps it synced on subscription updates/cancels
  (cancel → back to `free`).
- AI gating: Designer/Brand are unlimited; Free gets 3 then the **Upgrade**
  paywall. **Existing AI credit balances are still honored** — packs are just no
  longer sold, and the activation-fee offset mechanic is removed.
- Production checkout reads the user's tier: setup fee waived for subscribers;
  Brand's 5% is applied and the **discounted** unit prices are stored on the
  order so the later deposit/final steps stay consistent.

## Not yet wired (follow-ups)
- A Stripe Billing Portal link for members to manage/cancel (today: managed in
  Stripe directly).
- `priority_queue` / Creative-Direction-included are surfaced as Brand perks but
  not yet enforced operationally.
