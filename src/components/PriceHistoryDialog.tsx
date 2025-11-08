import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { History, TrendingUp, TrendingDown } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PriceHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceId: string;
  serviceName: string;
}

export const PriceHistoryDialog = ({ open, onOpenChange, serviceId, serviceName }: PriceHistoryDialogProps) => {
  const { data: history } = useQuery({
    queryKey: ["price-history", serviceId],
    queryFn: async () => {
      const { data } = await supabase
        .from("service_price_history")
        .select("*")
        .eq("service_id", serviceId)
        .order("changed_at", { ascending: false });

      return data || [];
    },
    enabled: open,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Preços - {serviceName}
          </DialogTitle>
          <DialogDescription>
            Acompanhe todas as alterações de preço deste serviço
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {history && history.length > 0 ? (
            history.map((entry, index) => {
              const priceDiff = index < history.length - 1 
                ? entry.new_price - history[index + 1].new_price 
                : 0;
              
              return (
                <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{formatCurrency(entry.new_price)}</span>
                      {entry.old_price && (
                        <>
                          <span className="text-muted-foreground text-sm line-through">
                            {formatCurrency(entry.old_price)}
                          </span>
                          {priceDiff !== 0 && (
                            <Badge variant={priceDiff > 0 ? "default" : "secondary"} className="text-xs">
                              {priceDiff > 0 ? (
                                <TrendingUp className="h-3 w-3 mr-1" />
                              ) : (
                                <TrendingDown className="h-3 w-3 mr-1" />
                              )}
                              {Math.abs(priceDiff).toFixed(2)}
                            </Badge>
                          )}
                        </>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(entry.changed_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma alteração de preço registrada</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
