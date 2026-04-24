# Data Model — Payments

## Two separate payment flows — never mix them

| Flow | Payer | Recipient | Keys |
|------|-------|-----------|------|
| OnePaywall billing | Publisher | OnePaywall | Env: `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` |
| Reader monetization | Reader | Publisher | `publisher_pg_configs` — platform or publisher's own |

Always call `lib/payments/resolveConfig(publisherId)` to get credentials for reader monetization.

## `publisher_pg_configs`
```
id, publisher_id FK (unique), mode ('platform'|'own'), provider ('razorpay')
key_id (null if platform), key_secret (AES-256 encrypted, null if platform)
webhook_secret (AES-256 encrypted, null if platform)
active bool, created_at, updated_at
```
- One row per publisher. Upsert on update.
- `mode = 'platform'` → use env keys. `mode = 'own'` → key_id/key_secret/webhook_secret required.
- Decrypt only inside `lib/payments/` at moment of use. Never log, never return via API.
- `provider` stored now so adding Stripe/PayU is a `resolveConfig` adapter, not a schema change.

## `plans`
```
id, name, slug (unique), price_monthly_paise int, domain_limit (null=unlimited)
gate_limit (null=unlimited), active bool, created_at, updated_at
```

## `publisher_subscriptions`
```
id, publisher_id FK, plan_id FK, razorpay_subscription_id (unique)
status ('trialing'|'active'|'past_due'|'cancelled')
current_period_start, current_period_end, created_at, updated_at
```
- Always billed through OnePaywall's platform keys — never publisher's own keys.

## `pg_webhook_events`  ← idempotency log
```
id, publisher_id FK (null = OnePaywall platform event), provider ('razorpay')
event_id, event_type, payload JSONB, processed_at
UNIQUE (provider, publisher_id, event_id)
```
### Webhook processing rule (strict order)
1. Verify signature using correct keys for publisher's config
2. Check `pg_webhook_events` for `(provider, publisher_id, event_id)` → return 200 if exists
3. Insert event record
4. Process side effects
