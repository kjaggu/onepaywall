-- Idempotency support for the unlock revenue loop.
-- recordSuccessfulUnlock dedupes on razorpay_payment_id so the verify route
-- and the webhook can both fire without producing duplicate transactions.
-- Without this UNIQUE the dedupe is racy under concurrent calls.
CREATE UNIQUE INDEX IF NOT EXISTS "reader_transactions_razorpay_payment_id_idx"
  ON "reader_transactions"("razorpay_payment_id")
  WHERE "razorpay_payment_id" IS NOT NULL;

-- gate_unlocks previously used a plain (non-unique) index — INSERT ON CONFLICT
-- DO NOTHING required a unique constraint to actually dedupe. Replace with a
-- unique index so a single (reader, gate) pair only ever has one active unlock.
DROP INDEX IF EXISTS "gate_unlocks_reader_gate_idx";
CREATE UNIQUE INDEX IF NOT EXISTS "gate_unlocks_reader_gate_idx"
  ON "gate_unlocks"("reader_id", "gate_id");
