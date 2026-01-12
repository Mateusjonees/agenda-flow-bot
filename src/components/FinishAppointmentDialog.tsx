import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, CheckCircle, DollarSign, Package, CreditCard, Banknote, Smartphone } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type InventoryItem = {
  id: string;
  name: string;
  current_stock: number;
  unit: string;
};

type StockUsage = {
  item_id: string;
  quantity: number;
};

interface FinishAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentId: string;
  appointmentTitle: string;
}

const paymentMethods = [
  { value: "dinheiro", label: "Dinheiro", icon: Banknote, color: "text-green-500" },
  { value: "pix", label: "PIX", icon: Smartphone, color: "text-teal-500" },
  { value: "cartao_credito", label: "Crédito", icon: CreditCard, color: "text-blue-500" },
  { value: "cartao_debito", label: "Débito", icon: CreditCard, color: "text-purple-500" },
];

export function FinishAppointmentDialog({
  open,
  onOpenChange,
  appointmentId,
  appointmentTitle,
}: FinishAppointmentDialogProps) {
  const [stockUsages, setStockUsages] = useState<StockUsage[]>([]);
  const [appointmentValue, setAppointmentValue] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("dinheiro");
  const queryClient = useQueryClient();

  // Buscar dados do appointment e proposta quando abrir o diálogo
  useEffect(() => {
    if (open && appointmentId) {
      const fetchAppointmentData = async () => {
        const { data: appointment } = await supabase
          .from("appointments")
          .select("proposal_id, price")
          .eq("id", appointmentId)
          .single();

        if (appointment?.proposal_id) {
          const { data: proposal } = await supabase
            .from("proposals")
            .select("final_amount")
            .eq("id", appointment.proposal_id)
            .single();

          if (proposal?.final_amount) {
            setAppointmentValue(proposal.final_amount.toString());
          }
        } else if (appointment?.price) {
          setAppointmentValue(appointment.price.toString());
        }
      };

      fetchAppointmentData();
    } else if (!open) {
      setAppointmentValue("");
      setPaymentMethod("dinheiro");
      setStockUsages([]);
    }
  }, [open, appointmentId]);

  // Buscar itens do estoque
  const { data: inventoryItems = [] } = useQuery({
    queryKey: ["inventory-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_items")
        .select("id, name, current_stock, unit")
        .order("name");
      
      if (error) throw error;
      return data as InventoryItem[];
    },
  });

  // Mutation para finalizar atendimento
  const finishAppointment = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: appointment } = await supabase
        .from("appointments")
        .select("customer_id")
        .eq("id", appointmentId)
        .single();

      if (!appointment) throw new Error("Agendamento não encontrado");

      const { data: loyaltyCardBefore } = await supabase
        .from("loyalty_cards")
        .select("current_stamps, stamps_required")
        .eq("user_id", user.id)
        .eq("customer_id", appointment.customer_id)
        .single();

      const updateData: any = { 
        status: "completed",
        payment_status: "paid"
      };

      if (appointmentValue && parseFloat(appointmentValue) > 0) {
        updateData.price = parseFloat(appointmentValue);
        updateData.payment_method = paymentMethod;
      }

      const { error: updateError } = await supabase
        .from("appointments")
        .update(updateData)
        .eq("id", appointmentId);

      if (updateError) throw updateError;

      if (appointmentValue && parseFloat(appointmentValue) > 0) {
        const { error: transactionError } = await supabase
          .from("financial_transactions")
          .insert({
            user_id: user.id,
            type: "income",
            amount: parseFloat(appointmentValue),
            description: `Atendimento: ${appointmentTitle}`,
            payment_method: paymentMethod,
            status: "completed",
            transaction_date: new Date().toISOString(),
            appointment_id: appointmentId
          });

        if (transactionError) throw transactionError;
      }

      await new Promise(resolve => setTimeout(resolve, 1000));

      const { data: loyaltyCardAfter } = await supabase
        .from("loyalty_cards")
        .select("current_stamps, stamps_required, rewards_redeemed")
        .eq("user_id", user.id)
        .eq("customer_id", appointment.customer_id)
        .single();

      for (const usage of stockUsages) {
        const { error: stockError } = await supabase.rpc("update_inventory_stock", {
          p_item_id: usage.item_id,
          p_quantity: usage.quantity,
          p_type: "out",
          p_reason: `Usado no atendimento: ${appointmentTitle}`,
          p_reference_type: "appointment",
          p_reference_id: appointmentId,
        });

        if (stockError) throw stockError;
      }

      return { loyaltyCardBefore, loyaltyCardAfter };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      queryClient.invalidateQueries({ queryKey: ["loyalty-cards"] });
      queryClient.invalidateQueries({ queryKey: ["customer-history"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["financial-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      
      const { loyaltyCardBefore, loyaltyCardAfter } = data;
      
      if (loyaltyCardBefore && loyaltyCardAfter) {
        const wasCompleted = loyaltyCardBefore.current_stamps + 1 >= loyaltyCardBefore.stamps_required;
        const rewardsIncreased = loyaltyCardAfter.rewards_redeemed > (loyaltyCardBefore as any).rewards_redeemed;
        
        if (wasCompleted || rewardsIncreased) {
          toast.success("🎉 Parabéns! O cliente completou o cartão fidelidade e ganhou uma visita grátis!", {
            duration: 5000,
          });
        } else {
          toast.success("Atendimento finalizado com sucesso!");
        }
      } else {
        toast.success("Atendimento finalizado com sucesso!");
      }
      
      onOpenChange(false);
      setStockUsages([]);
      setAppointmentValue("");
      setPaymentMethod("dinheiro");
    },
    onError: (error) => {
      toast.error("Erro ao finalizar atendimento");
      console.error(error);
    },
  });

  const addStockUsage = () => {
    setStockUsages([...stockUsages, { item_id: "", quantity: 1 }]);
  };

  const removeStockUsage = (index: number) => {
    setStockUsages(stockUsages.filter((_, i) => i !== index));
  };

  const updateStockUsage = (index: number, field: keyof StockUsage, value: string | number) => {
    const updated = [...stockUsages];
    updated[index] = { ...updated[index], [field]: value };
    setStockUsages(updated);
  };

  const handleFinish = () => {
    finishAppointment.mutate();
  };

  const selectedPaymentMethod = paymentMethods.find(m => m.value === paymentMethod);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-2xl border-0 shadow-2xl">
        {/* Header com gradiente */}
        <div className="relative bg-gradient-to-br from-green-500 to-emerald-600 p-6 pb-8 rounded-t-2xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnY0em0wLTZoLTJ2LTRoMnY0em0tNiA2aC0ydi00aDJ2NHptMC02aC0ydi00aDJ2NHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30 rounded-t-2xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Finalizar Atendimento</h2>
                <p className="text-white/80 text-sm">Confirme os detalhes e finalize</p>
              </div>
            </div>
            <div className="mt-4 bg-white/20 backdrop-blur-sm rounded-xl p-3">
              <p className="text-white font-medium truncate">{appointmentTitle}</p>
            </div>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-5 space-y-5 bg-background">
          {/* Seção de Valor */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Valor do Atendimento</h3>
                <p className="text-xs text-muted-foreground">Opcional - registra no financeiro</p>
              </div>
            </div>
            
            <div className="bg-muted/30 rounded-xl p-4 space-y-4 border border-border/50">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">R$</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={appointmentValue}
                  onChange={(e) => setAppointmentValue(e.target.value)}
                  className="pl-10 h-12 text-lg font-semibold rounded-xl border-border/50 focus:border-primary"
                />
              </div>

              {/* Forma de pagamento - botões visuais */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Forma de Pagamento</Label>
                <div className="grid grid-cols-4 gap-2">
                  {paymentMethods.map((method) => {
                    const Icon = method.icon;
                    const isSelected = paymentMethod === method.value;
                    return (
                      <button
                        key={method.value}
                        type="button"
                        onClick={() => setPaymentMethod(method.value)}
                        className={cn(
                          "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all",
                          isSelected
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border/50 hover:border-border hover:bg-muted/50"
                        )}
                      >
                        <Icon className={cn("w-5 h-5", isSelected ? method.color : "text-muted-foreground")} />
                        <span className={cn(
                          "text-[10px] font-medium",
                          isSelected ? "text-foreground" : "text-muted-foreground"
                        )}>
                          {method.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Seção de Estoque */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <Package className="w-4 h-4 text-orange-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Itens Utilizados</h3>
                  <p className="text-xs text-muted-foreground">Baixa automática no estoque</p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addStockUsage}
                className="gap-1.5 h-9 rounded-lg text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar
              </Button>
            </div>

            {stockUsages.length === 0 ? (
              <div className="bg-muted/30 rounded-xl p-6 text-center border border-dashed border-border/50">
                <Package className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Nenhum item adicionado
                </p>
                <p className="text-xs text-muted-foreground/70">
                  Clique em "Adicionar" para registrar uso de estoque
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {stockUsages.map((usage, index) => {
                  const selectedItem = inventoryItems.find(i => i.id === usage.item_id);
                  return (
                    <div key={index} className="flex gap-2 items-center bg-muted/30 p-3 rounded-xl border border-border/50">
                      <div className="flex-1">
                        <Select
                          value={usage.item_id}
                          onValueChange={(value) => updateStockUsage(index, "item_id", value)}
                        >
                          <SelectTrigger className="h-10 rounded-lg border-border/50">
                            <SelectValue placeholder="Selecione um item" />
                          </SelectTrigger>
                          <SelectContent>
                            {inventoryItems.map((item) => (
                              <SelectItem key={item.id} value={item.id}>
                                <div className="flex items-center justify-between gap-2">
                                  <span>{item.name}</span>
                                  <Badge variant="secondary" className="text-[10px]">
                                    {item.current_stock} {item.unit}
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="w-24">
                        <Input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={usage.quantity}
                          onChange={(e) => updateStockUsage(index, "quantity", parseFloat(e.target.value) || 0)}
                          className="h-10 text-center rounded-lg border-border/50"
                        />
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeStockUsage(index)}
                        className="h-10 w-10 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer com botões */}
        <div className="p-5 pt-0 bg-background">
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setStockUsages([]);
                setAppointmentValue("");
                setPaymentMethod("dinheiro");
              }}
              className="flex-1 h-12 rounded-xl font-medium"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleFinish}
              disabled={finishAppointment.isPending}
              className="flex-1 h-12 rounded-xl font-semibold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg shadow-green-500/25"
            >
              {finishAppointment.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Finalizando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Finalizar
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
