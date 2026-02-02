import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface CostCenterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  costCenter?: {
    id: string;
    name: string;
    description: string;
  } | null;
}

export const CostCenterDialog = ({
  open,
  onOpenChange,
  onSuccess,
  costCenter,
}: CostCenterDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    if (costCenter) {
      setFormData({
        name: costCenter.name || "",
        description: costCenter.description || "",
      });
    } else {
      resetForm();
    }
  }, [costCenter, open]);

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "O nome do centro de custo é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const ccData = {
      user_id: user.id,
      name: formData.name.trim(),
      description: formData.description || null,
    };

    let error;

    if (costCenter?.id) {
      const result = await supabase
        .from("cost_centers")
        .update(ccData)
        .eq("id", costCenter.id);
      error = result.error;
    } else {
      const result = await supabase
        .from("cost_centers")
        .insert(ccData);
      error = result.error;
    }

    setLoading(false);

    if (error) {
      console.error("Error saving cost center:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o centro de custo.",
        variant: "destructive",
      });
    } else {
      toast({
        title: costCenter?.id ? "Centro de custo atualizado!" : "Centro de custo criado!",
      });
      onSuccess();
      onOpenChange(false);
      resetForm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{costCenter?.id ? "Editar Centro de Custo" : "Novo Centro de Custo"}</DialogTitle>
          <DialogDescription>
            Crie centros de custo para classificar suas transações por área ou projeto
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Nome *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Marketing, Operacional, Projeto X"
              required
            />
          </div>

          <div>
            <Label>Descrição</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva o propósito deste centro de custo..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {costCenter?.id ? "Salvar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
