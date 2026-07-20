DELETE FROM public.transactions t
USING public.transactions t2
WHERE t.paystack_reference IS NOT NULL
  AND t.paystack_reference = t2.paystack_reference
  AND t.created_at > t2.created_at;

CREATE UNIQUE INDEX IF NOT EXISTS transactions_paystack_reference_unique
ON public.transactions (paystack_reference)
WHERE paystack_reference IS NOT NULL;