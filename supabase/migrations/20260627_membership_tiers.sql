-- Membership tiers (Free / Designer / Brand).
-- Adds the subscription tier and Stripe linkage to the existing user_credits row.
-- Apply in the Supabase SQL editor before rolling out the subscription release.

alter table public.user_credits
  add column if not exists tier text not null default 'free'
    check (tier in ('free', 'designer', 'brand')),
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists subscription_status text,        -- active | past_due | canceled | ...
  add column if not exists subscription_current_period_end timestamptz;

create index if not exists user_credits_stripe_customer_idx
  on public.user_credits (stripe_customer_id);
create index if not exists user_credits_stripe_subscription_idx
  on public.user_credits (stripe_subscription_id);
