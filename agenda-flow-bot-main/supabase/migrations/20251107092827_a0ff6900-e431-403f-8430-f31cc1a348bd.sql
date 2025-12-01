-- Tabela de Serviços/Produtos oferecidos
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  duration INTEGER DEFAULT 60, -- duração em minutos
  price NUMERIC DEFAULT 0,
  color TEXT DEFAULT '#3B82F6', -- cor para visualização na agenda
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Policies para services
CREATE POLICY "Users can manage own services" 
ON services 
FOR ALL 
USING (auth.uid() = user_id);

-- Tabela de Horários de Funcionamento
CREATE TABLE IF NOT EXISTS business_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  day_of_week INTEGER NOT NULL, -- 0=domingo, 1=segunda, ..., 6=sábado
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;

-- Policies para business_hours
CREATE POLICY "Users can manage own business hours" 
ON business_hours 
FOR ALL 
USING (auth.uid() = user_id);

-- Adicionar campo service_id em appointments
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES services(id);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_services_user_id ON services(user_id);
CREATE INDEX IF NOT EXISTS idx_services_active ON services(is_active);
CREATE INDEX IF NOT EXISTS idx_business_hours_user_id ON business_hours(user_id);
CREATE INDEX IF NOT EXISTS idx_business_hours_day ON business_hours(day_of_week);
CREATE INDEX IF NOT EXISTS idx_appointments_service ON appointments(service_id);

-- Comentários
COMMENT ON TABLE services IS 'Catálogo de serviços/produtos oferecidos';
COMMENT ON TABLE business_hours IS 'Horários de funcionamento do negócio';
COMMENT ON COLUMN services.duration IS 'Duração do serviço em minutos';
COMMENT ON COLUMN services.color IS 'Cor hexadecimal para visualização na agenda';
COMMENT ON COLUMN business_hours.day_of_week IS '0=domingo, 1=segunda, 2=terça, 3=quarta, 4=quinta, 5=sexta, 6=sábado';