import { Badge } from "@/components/ui/badge";
import { QrCode, CreditCard, Zap, RefreshCw } from "lucide-react";

interface PaymentMethodBadgeProps {
  method: "pix" | "card";
  variant?: "default" | "detailed";
}

export function PaymentMethodBadge({ method, variant = "default" }: PaymentMethodBadgeProps) {
  if (method === "pix") {
    return (
      <Badge 
        variant="outline" 
        className="gap-1.5 border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400"
      >
        {variant === "detailed" ? (
          <>
            <Zap className="h-3.5 w-3.5" />
            <span>Aprovação Instantânea</span>
          </>
        ) : (
          <>
            <QrCode className="h-3 w-3" />
            <span>PIX</span>
          </>
        )}
      </Badge>
    );
  }

  return (
    <Badge 
      variant="outline" 
      className="gap-1.5 border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400"
    >
      {variant === "detailed" ? (
        <>
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Renovação Automática</span>
        </>
      ) : (
        <>
          <CreditCard className="h-3 w-3" />
          <span>Cartão</span>
        </>
      )}
    </Badge>
  );
}
