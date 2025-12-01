import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Minus, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickStockAdjusterProps {
  onAdjust: (quantity: number, type: "in" | "out") => Promise<void>;
  disabled?: boolean;
  unit?: string;
}

export const QuickStockAdjuster = ({ onAdjust, disabled, unit = "un" }: QuickStockAdjusterProps) => {
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [adjustType, setAdjustType] = useState<"in" | "out" | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [loading, setLoading] = useState(false);

  const handleStartAdjust = (type: "in" | "out") => {
    setAdjustType(type);
    setIsAdjusting(true);
    setQuantity("1");
  };

  const handleConfirm = async () => {
    if (!adjustType || !quantity || parseFloat(quantity) <= 0) return;
    
    setLoading(true);
    try {
      await onAdjust(parseFloat(quantity), adjustType);
      handleCancel();
    } catch (error) {
      console.error("Error adjusting stock:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsAdjusting(false);
    setAdjustType(null);
    setQuantity("1");
  };

  if (isAdjusting) {
    return (
      <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-2">
        <Input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="h-8 w-20"
          min="0.01"
          step="0.01"
          disabled={loading}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") handleConfirm();
            if (e.key === "Escape") handleCancel();
          }}
        />
        <span className="text-xs text-muted-foreground">{unit}</span>
        <Button
          size="icon"
          variant="ghost"
          className={cn(
            "h-8 w-8",
            adjustType === "in" ? "text-green-600 hover:text-green-700" : "text-red-600 hover:text-red-700"
          )}
          onClick={handleConfirm}
          disabled={loading}
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={handleCancel}
          disabled={loading}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        size="icon"
        variant="outline"
        className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
        onClick={() => handleStartAdjust("in")}
        disabled={disabled}
        title="Adicionar ao estoque"
      >
        <Plus className="h-4 w-4" />
      </Button>
      <Button
        size="icon"
        variant="outline"
        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
        onClick={() => handleStartAdjust("out")}
        disabled={disabled}
        title="Remover do estoque"
      >
        <Minus className="h-4 w-4" />
      </Button>
    </div>
  );
};
