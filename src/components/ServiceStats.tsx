import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Calendar, DollarSign } from "lucide-react";

interface ServiceStatsProps {
  serviceId: string;
  serviceName: string;
}

export const ServiceStats = ({ serviceId, serviceName }: ServiceStatsProps) => {
  const { data: stats } = useQuery({
    queryKey: ["service-stats", serviceId],
    queryFn: async () => {
      const { data: appointments } = await supabase
        .from("appointments")
        .select("id, created_at")
        .eq("service_id", serviceId)
        .eq("status", "completed");

      const { data: revenue } = await supabase
        .from("financial_transactions")
        .select("amount")
        .eq("description", serviceName)
        .eq("type", "income");

      const totalRevenue = revenue?.reduce((acc, t) => acc + t.amount, 0) || 0;
      
      return {
        totalAppointments: appointments?.length || 0,
        totalRevenue,
      };
    },
  });

  return (
    <div className="grid grid-cols-2 gap-2 mt-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Calendar className="h-3 w-3" />
        <span>{stats?.totalAppointments || 0} atendimentos</span>
      </div>
      <div className="flex items-center gap-2 text-xs text-success">
        <TrendingUp className="h-3 w-3" />
        <span>
          {new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(stats?.totalRevenue || 0)}
        </span>
      </div>
    </div>
  );
};
