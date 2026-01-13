-- Tabela de depoimentos públicos
CREATE TABLE public.testimonials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  business_name TEXT NOT NULL,
  business_type TEXT NOT NULL DEFAULT 'outros',
  content TEXT NOT NULL,
  rating INTEGER NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  photo_url TEXT,
  highlight TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Política: Qualquer pessoa pode ver depoimentos aprovados
CREATE POLICY "Depoimentos aprovados são públicos"
ON public.testimonials
FOR SELECT
USING (is_approved = true);

-- Política: Usuários autenticados podem inserir depoimentos
CREATE POLICY "Usuários autenticados podem enviar depoimentos"
ON public.testimonials
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Política: Admins podem fazer tudo
CREATE POLICY "Admins podem gerenciar depoimentos"
ON public.testimonials
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);

-- Trigger para updated_at
CREATE TRIGGER update_testimonials_updated_at
BEFORE UPDATE ON public.testimonials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir alguns depoimentos iniciais aprovados
INSERT INTO public.testimonials (name, business_name, business_type, content, rating, highlight, is_approved, is_featured) VALUES
('Ana Silva', 'Studio Ana Silva', 'salao', 'O Foguete transformou meu salão! Agora consigo acompanhar todos os agendamentos e finanças em um só lugar. Minha produtividade aumentou muito!', 5, '+40% produtividade', true, true),
('Carlos Santos', 'Barbearia Premium', 'barbearia', 'Ferramenta incrível! Os lembretes automáticos reduziram drasticamente as faltas dos clientes. Super recomendo para qualquer barbearia.', 5, '-60% faltas', true, true),
('Maria Oliveira', 'Clínica Bem Estar', 'clinica', 'A gestão financeira ficou muito mais fácil. Consigo ver exatamente quanto entrou e saiu, e os relatórios são sensacionais.', 5, '+35% lucro', true, true),
('Pedro Costa', 'Academia Força Total', 'academia', 'Perfeito para controlar as mensalidades e acompanhar cada aluno. O sistema é muito intuitivo e fácil de usar.', 5, '+50 alunos', true, true),
('Juliana Mendes', 'Espaço Juliana Nails', 'salao', 'Melhor investimento que fiz! O controle de estoque e agendamentos me poupou horas de trabalho toda semana.', 5, '+25% vendas', true, false),
('Roberto Lima', 'Consultório Dr. Lima', 'consultorio', 'A organização dos agendamentos melhorou 100%. Meus pacientes adoram receber os lembretes automáticos.', 5, '100% organizado', true, false);
