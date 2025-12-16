-- Deletar TODAS as transações de assinatura de plataforma (pagamentos ao Foguetinho)
-- Esses pagamentos são para a plataforma, não são receitas do negócio do usuário

DELETE FROM public.financial_transactions
WHERE (
  -- Padrões conhecidos de assinatura de plataforma
  description ILIKE '%assinatura monthly%'
  OR description ILIKE '%assinatura mensal%'
  OR description ILIKE '%assinatura semestral%'
  OR description ILIKE '%assinatura anual%'
  OR description ILIKE '%assinatura yearly%'
  OR description ILIKE '%assinatura half-yearly%'
  OR description ILIKE '%assinatura renovação%'
  OR description ILIKE '%plano foguete%'
  OR description ILIKE '%plano foguetinho%'
  OR description ILIKE '%platform subscription%'
  -- OU transações com valores exatos de plano (97, 582, 1164) + descrição de assinatura
  OR (description ILIKE '%assinatura%' AND amount IN (97, 582, 1164))
  -- Padrão genérico: assinatura + PIX com valores de plano
  OR (description ILIKE '%assinatura%pix%' AND amount IN (97, 582, 1164))
);