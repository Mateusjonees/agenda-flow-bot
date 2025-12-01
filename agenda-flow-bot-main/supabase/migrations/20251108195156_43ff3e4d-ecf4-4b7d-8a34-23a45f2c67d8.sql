-- Remover a constraint antiga de status
ALTER TABLE proposals DROP CONSTRAINT IF EXISTS proposals_status_check;

-- Adicionar nova constraint com o status "confirmed"
ALTER TABLE proposals ADD CONSTRAINT proposals_status_check 
  CHECK (status IN ('pending', 'sent', 'viewed', 'accepted', 'rejected', 'expired', 'paused', 'confirmed', 'canceled'));