-- Adicionar campo status na tabela subtasks
ALTER TABLE subtasks ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Adicionar constraint para validar o status
ALTER TABLE subtasks DROP CONSTRAINT IF EXISTS subtasks_status_check;
ALTER TABLE subtasks ADD CONSTRAINT subtasks_status_check 
  CHECK (status IN ('pending', 'in_progress', 'completed'));

-- Atualizar subtasks existentes com base no campo completed
UPDATE subtasks 
SET status = CASE 
  WHEN completed = true THEN 'completed'
  ELSE 'pending'
END
WHERE status IS NULL OR status = 'pending';