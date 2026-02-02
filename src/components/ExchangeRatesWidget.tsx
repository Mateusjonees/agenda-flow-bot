import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, RefreshCw, DollarSign, Euro, Bitcoin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface ExchangeRate {
  code: string;
  name: string;
  bid: number;
  ask: number;
  high: number;
  low: number;
  varBid: number;
  pctChange: number;
  timestamp: string;
}

interface ExchangeRates {
  usd: ExchangeRate;
  eur: ExchangeRate;
  btc: ExchangeRate;
}

export const ExchangeRatesWidget = () => {
  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchRates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-exchange-rates");
      
      if (error) throw error;
      
      if (data?.success) {
        setRates(data.rates);
        setLastUpdate(new Date(data.updated_at));
      }
    } catch (error) {
      console.error("Error fetching exchange rates:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
    // Atualizar a cada 5 minutos
    const interval = setInterval(fetchRates, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (value: number, decimals = 2) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  };

  const getIcon = (code: string) => {
    switch (code) {
      case "USD": return <DollarSign className="w-5 h-5" />;
      case "EUR": return <Euro className="w-5 h-5" />;
      case "BTC": return <Bitcoin className="w-5 h-5" />;
      default: return <DollarSign className="w-5 h-5" />;
    }
  };

  const RateCard = ({ rate }: { rate: ExchangeRate }) => {
    const isPositive = rate.pctChange >= 0;
    
    return (
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-primary/10 text-primary">
            {getIcon(rate.code)}
          </div>
          <div>
            <p className="font-semibold text-sm">{rate.code}</p>
            <p className="text-xs text-muted-foreground">{rate.name}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-lg">
            {formatCurrency(rate.bid, rate.code === "BTC" ? 2 : 2)}
          </p>
          <Badge 
            variant={isPositive ? "default" : "destructive"}
            className="text-xs"
          >
            {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
            {isPositive ? "+" : ""}{rate.pctChange.toFixed(2)}%
          </Badge>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Cotações em Tempo Real</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={fetchRates}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        {lastUpdate && (
          <p className="text-xs text-muted-foreground">
            Atualizado: {lastUpdate.toLocaleTimeString("pt-BR")}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {loading && !rates ? (
          <>
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </>
        ) : rates ? (
          <>
            <RateCard rate={rates.usd} />
            <RateCard rate={rates.eur} />
            <RateCard rate={rates.btc} />
          </>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Não foi possível carregar as cotações
          </p>
        )}
      </CardContent>
    </Card>
  );
};
