-- Remover a constraint antiga que está causando o erro
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_status_check;

-- Adicionar nova constraint com os valores corretos para o board Kanban
ALTER TABLE public.tasks ADD CONSTRAINT tasks_status_check 
  CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled'));

-- Atualizar tarefas existentes com status inválido para pending
UPDATE public.tasks 
SET status = 'pending' 
WHERE status NOT IN ('pending', 'in_progress', 'completed', 'cancelled');