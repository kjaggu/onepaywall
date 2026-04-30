# Data Model — Payments

## Two separate payment flows — never mix them

| Flow | Payer | Recipient | Keys |
|------|-------|-----------|------|
| OnePaywall billing | Publisher | OnePaywall | Env: `RAZORPAY_PLATFORM_KEY_ID` / `RAZORPAY_PLATFORM_KEY_SECRET` |
| Reader monetization | Reader | Publisher | `publisher_pg_configs` — platform reader keys or publisher's own |

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
- Platform reader monetization uses `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET` (or `RAZORPAY_READER_WEBHOOK_SECRET` for the reader subscription platform webhook). Do not confuse these with OnePaywall SaaS billing keys.
- Decrypt only inside `lib/payments/` at moment of use. Never log, never return via API.
- `provider` stored now so adding Stripe/PayU is a `resolveConfig` adapter, not a schema change.

## `publisher_reader_plans`
```
id, publisher_id FK (unique), currency
monthly_price, quarterly_price, annual_price, subs_enabled
monthly_razorpay_plan_id, quarterly_razorpay_plan_id, annual_razorpay_plan_id
monthly_synced_price/currency/pg_mode/synced_at/sync_error
quarterly_synced_price/currency/pg_mode/synced_at/sync_error
annual_synced_price/currency/pg_mode/synced_at/sync_error
default_unlock_price, unlock_enabled, created_at, updated_at
```
- Publishers create one reader membership with monthly/quarterly/annual intervals.
- Saving enabled subscriptions creates Razorpay plan IDs immediately in the currently selected reader payment account.
- If price, currency, or payment mode changes, create a new Razorpay plan ID; old subscriptions keep their original provider/account metadata.

## `reader_subscribers`
```
id, publisher_id FK, email_hash, encrypted_email, razorpay_customer_id
active, created_at, updated_at
UNIQUE (publisher_id, email_hash)
```
- Intentional PII exception for paid reader subscriptions.
- Use normalised email hash for lookup and AES-encrypted email for magic links/support.

## `reader_subscriptions`
```
id, publisher_id FK, subscriber_id FK, interval, status, pg_mode
razorpay_subscription_id (unique), razorpay_plan_id
current_period_start, current_period_end, cancelled_at, cancel_at_cycle_end
dunning_started_at, created_at, updated_at
```
- Publisher-wide access in v1. Any active subscription unlocks all domains owned by that publisher.
- `pg_mode` records whether the subscription was created under platform keys or the publisher's own Razorpay keys.

## `reader_subscription_links`
```
id, publisher_id FK, subscriber_id FK, reader_id FK, created_at
UNIQUE (reader_id, publisher_id)
```
- Links a paid subscriber to an anonymous reader/browser token after checkout or magic-link restore.

## `reader_subscription_magic_links`
```
token, publisher_id FK, subscriber_id FK, return_url, expires_at, used_at, created_at
```
- Short-lived restore links for cross-device access. Readers do not log in on every visit.

## `reader_transactions`
```
id, publisher_id FK, domain_id FK nullable, reader_id FK nullable
type ('subscription'|'one_time_unlock'), status ('pending'|'completed'|'refunded'|'failed')
amount, currency
razorpay_payment_id, razorpay_order_id, razorpay_subscription_id
reader_email_hash, encrypted_reader_email
content_url, failure_reason, metadata JSONB
created_at, updated_at, completed_at
```
- Insert a `pending` row when checkout is created.
- Mark `completed` on successful synchronous verification or `payment.captured` webhook.
- Mark `failed` on invalid verification or `payment.failed` webhook.
- Store reader email hash + encrypted email when collected during checkout so publishers can reconcile and later issue invoices.
- Completed rows are revenue; pending/failed rows are operational/payment-attempt history.

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
