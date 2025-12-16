-- Deletar transações financeiras incorretas de assinaturas de plataforma
-- Estas transações apareciam erroneamente nos relatórios dos usuários

DELETE FROM public.financial_transactions
WHERE description ILIKE '%Assinatura%' 
  AND (
    description ILIKE '%Plano Foguetinho%' 
    OR description ILIKE '%Mercado Pago%'
    OR description ILIKE '%PIX%assinatura%'
    OR description ILIKE '%reativação%assinatura%'
  )
  AND type = 'income';