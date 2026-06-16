-- AI credit system: track free generations, paid credits, and per-project unlimited access.

CREATE TABLE IF NOT EXISTS user_credits (
  user_id               UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  free_generations_used INTEGER     NOT NULL DEFAULT 0,
  ai_credit_balance     INTEGER     NOT NULL DEFAULT 0,
  ai_spend_cents        INTEGER     NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_credits_owner_select"
  ON user_credits FOR SELECT USING (auth.uid() = user_id);

-- All writes go through service-role routes (API routes, webhooks) — no client write policy needed.

-- Full audit log for every AI generation event and credit transaction.
CREATE TABLE IF NOT EXISTS ai_transactions (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  type              TEXT        NOT NULL CHECK (type IN (
    'free_usage',
    'credit_purchase',
    'credit_usage',
    'activation_unlock',
    'activation_credit_applied'
  )),
  amount_cents      INTEGER     NOT NULL DEFAULT 0,
  credits_added     INTEGER     NOT NULL DEFAULT 0,
  credits_consumed  INTEGER     NOT NULL DEFAULT 0,
  project_id        UUID        REFERENCES projects(id) ON DELETE SET NULL,
  stripe_session_id TEXT,
  note              TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE ai_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_transactions_owner_select"
  ON ai_transactions FOR SELECT USING (auth.uid() = user_id);

-- Track which project has unlimited AI enabled (set after activation payment).
ALTER TABLE production_orders
  ADD COLUMN IF NOT EXISTS unlimited_ai_project_id UUID    REFERENCES projects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS ai_spend_applied_cents   INTEGER NOT NULL DEFAULT 0;
