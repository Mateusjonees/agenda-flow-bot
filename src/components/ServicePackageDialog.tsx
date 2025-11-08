import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Package } from "lucide-react";

interface Service {
  id: string;
  name: string;
  price: number;
}

interface ServicePackageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const ServicePackageDialog = ({ open, onOpenChange, onSuccess }: ServicePackageDialogProps) => {
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    discount_percentage: "10",
  });

  useEffect(() => {
    if (open) {
      fetchServices();
    }
  }, [open]);

  const fetchServices = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("services")
      .select("id, name, price")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("name");

    setServices(data || []);
  };

  const calculateTotalPrice = () => {
    const selected = services.filter(s => selectedServices.includes(s.id));
    const total = selected.reduce((acc, s) => acc + s.price, 0);
    const discount = parseFloat(formData.discount_percentage) || 0;
    return total * (1 - discount / 100);
  };

  const handleSubmit = async () => {
    if (!formData.name || selectedServices.length < 2) {
      toast({
        title: "Erro",
        description: "Preencha o nome e selecione pelo menos 2 serviços",
        variant: "destructive",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("service_packages").insert({
      user_id: user.id,
      name: formData.name,
      description: formData.description,
      service_ids: selectedServices,
      discount_percentage: parseFloat(formData.discount_percentage),
      final_price: calculateTotalPrice(),
    });

    if (error) {
      toast({
        title: "Erro ao criar pacote",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Pacote criado com sucesso!",
      });
      setFormData({ name: "", description: "", discount_percentage: "10" });
      setSelectedServices([]);
      onSuccess();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Criar Pacote de Serviços
          </DialogTitle>
          <DialogDescription>
            Agrupe serviços com desconto especial
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="package-name">Nome do Pacote *</Label>
            <Input
              id="package-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Pacote Completo"
            />
          </div>

          <div>
            <Label htmlFor="package-description">Descrição</Label>
            <Textarea
              id="package-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descrição do pacote"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="discount">Desconto (%)</Label>
            <Input
              id="discount"
              type="number"
              value={formData.discount_percentage}
              onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
              min="0"
              max="100"
            />
          </div>

          <div className="space-y-2">
            <Label>Selecione os Serviços (mínimo 2)</Label>
            <div className="border rounded-lg p-4 space-y-2 max-h-48 overflow-y-auto">
              {services.map((service) => (
                <div key={service.id} className="flex items-center gap-2">
                  <Checkbox
                    id={service.id}
                    checked={selectedServices.includes(service.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedServices([...selectedServices, service.id]);
                      } else {
                        setSelectedServices(selectedServices.filter(id => id !== service.id));
                      }
                    }}
                  />
                  <label htmlFor={service.id} className="text-sm cursor-pointer flex-1">
                    {service.name} - {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(service.price)}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {selectedServices.length >= 2 && (
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Preço Final do Pacote:</span>
                <span className="text-xl font-bold text-primary">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(calculateTotalPrice())}
                </span>
              </div>
            </div>
          )}

          <Button onClick={handleSubmit} className="w-full">
            Criar Pacote
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
