-- Create service_price_history table
CREATE TABLE IF NOT EXISTS public.service_price_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  old_price DECIMAL(10,2),
  new_price DECIMAL(10,2) NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on service_price_history
ALTER TABLE public.service_price_history ENABLE ROW LEVEL SECURITY;

-- Create policies for service_price_history
CREATE POLICY "Users can view price history of their own services"
ON public.service_price_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.services
    WHERE services.id = service_price_history.service_id
    AND services.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert price history for their own services"
ON public.service_price_history
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.services
    WHERE services.id = service_price_history.service_id
    AND services.user_id = auth.uid()
  )
);

-- Create service_packages table
CREATE TABLE IF NOT EXISTS public.service_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  service_ids UUID[] NOT NULL,
  discount_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  final_price DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on service_packages
ALTER TABLE public.service_packages ENABLE ROW LEVEL SECURITY;

-- Create policies for service_packages
CREATE POLICY "Users can view their own service packages"
ON public.service_packages
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own service packages"
ON public.service_packages
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own service packages"
ON public.service_packages
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own service packages"
ON public.service_packages
FOR DELETE
USING (auth.uid() = user_id);

-- Create updated_at trigger for service_packages
CREATE TRIGGER update_service_packages_updated_at
BEFORE UPDATE ON public.service_packages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_service_price_history_service_id ON public.service_price_history(service_id);
CREATE INDEX idx_service_price_history_changed_at ON public.service_price_history(changed_at DESC);
CREATE INDEX idx_service_packages_user_id ON public.service_packages(user_id);
CREATE INDEX idx_service_packages_is_active ON public.service_packages(is_active);