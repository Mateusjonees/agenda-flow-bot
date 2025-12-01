-- Adicionar índice para melhor performance e prevenir duplicações
CREATE INDEX IF NOT EXISTS idx_financial_transactions_pix_lookup 
ON financial_transactions(user_id, amount, description, payment_method, transaction_date);

-- Limpar transações duplicadas mantendo apenas a mais recente de cada grupo
WITH duplicates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, amount, description, payment_method, DATE(transaction_date)
      ORDER BY created_at DESC
    ) as rn
  FROM financial_transactions
  WHERE status IN ('pending', 'completed')
    AND payment_method = 'pix'
)
DELETE FROM financial_transactions
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Log das transações removidas
DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Removidas % transações duplicadas', deleted_count;
END $$;