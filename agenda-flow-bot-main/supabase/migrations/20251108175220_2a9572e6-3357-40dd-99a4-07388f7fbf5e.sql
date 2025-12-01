-- Remove a política que permite acesso de leitura para todos
DROP POLICY IF EXISTS "Enable read access for all users" ON appointments;

-- Remove a política existente de gerenciamento próprio se existir
DROP POLICY IF EXISTS "Users can manage own appointments" ON appointments;

-- Cria política para que usuários vejam apenas seus próprios agendamentos
CREATE POLICY "Users can view own appointments"
ON appointments
FOR SELECT
USING (auth.uid() = user_id);

-- Cria política para que usuários insiram apenas seus próprios agendamentos
CREATE POLICY "Users can insert own appointments"
ON appointments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Cria política para que usuários atualizem apenas seus próprios agendamentos
CREATE POLICY "Users can update own appointments"
ON appointments
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Cria política para que usuários deletem apenas seus próprios agendamentos
CREATE POLICY "Users can delete own appointments"
ON appointments
FOR DELETE
USING (auth.uid() = user_id);