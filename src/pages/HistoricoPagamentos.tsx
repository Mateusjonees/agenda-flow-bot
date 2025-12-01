import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { SubscriptionPaymentHistory } from "@/components/SubscriptionPaymentHistory";

const HistoricoPagamentos = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/planos")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Histórico de Pagamentos
              </h1>
              <p className="text-muted-foreground">
                Acompanhe todos os pagamentos da sua assinatura
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <SubscriptionPaymentHistory />
      </div>
    </div>
  );
};

export default HistoricoPagamentos;
