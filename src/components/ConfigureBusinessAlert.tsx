import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Building2, Settings, X, Clock, FileText, Image } from "lucide-react";

interface BusinessSettings {
  business_name: string | null;
  cpf_cnpj: string | null;
  address: string | null;
  profile_image_url: string | null;
  whatsapp_number: string | null;
}

interface BusinessHours {
  id: string;
  is_active: boolean;
}

export function ConfigureBusinessAlert() {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [missingItems, setMissingItems] = useState<string[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    checkBusinessConfig();
  }, []);

  const checkBusinessConfig = async () => {
    // Check if already dismissed today
    const dismissedDate = localStorage.getItem("business_alert_dismissed");
    if (dismissedDate) {
      const dismissed = new Date(dismissedDate);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - dismissed.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < 7) {
        return; // Don't show for 7 days after dismissal
      }
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const missing: string[] = [];

    // Check business settings
    const { data: settings } = await supabase
      .from("business_settings")
      .select("business_name, cpf_cnpj, address, profile_image_url, whatsapp_number")
      .eq("user_id", user.id)
      .single();

    if (!settings) {
      missing.push("Dados da empresa");
      missing.push("Logo");
      missing.push("Horários de funcionamento");
    } else {
      if (!settings.business_name) missing.push("Nome da empresa");
      if (!settings.cpf_cnpj) missing.push("CPF/CNPJ");
      if (!settings.address) missing.push("Endereço");
      if (!settings.profile_image_url) missing.push("Logo da empresa");
    }

    // Check business hours
    const { data: hours } = await supabase
      .from("business_hours")
      .select("id, is_active")
      .eq("user_id", user.id);

    if (!hours || hours.length === 0 || !hours.some(h => h.is_active)) {
      missing.push("Horários de funcionamento");
    }

    if (missing.length > 0) {
      setMissingItems([...new Set(missing)]); // Remove duplicates
      setShow(true);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem("business_alert_dismissed", new Date().toISOString());
    setDismissed(true);
    setTimeout(() => setShow(false), 300);
  };

  const handleConfigure = () => {
    navigate("/configuracoes");
  };

  if (!show) return null;

  return (
    <Alert 
      className={`
        relative mb-6 border-0 overflow-hidden transition-all duration-300
        bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10
        dark:from-amber-500/20 dark:via-orange-500/20 dark:to-amber-500/20
        ${dismissed ? "opacity-0 scale-95" : "opacity-100 scale-100"}
      `}
    >
      {/* Decorative background */}
      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-orange-500/5" />
      
      {/* Animated border */}
      <div className="absolute inset-0 rounded-lg border-2 border-amber-500/30 dark:border-amber-400/40" />
      
      <div className="relative flex items-start gap-4 p-2">
        {/* Icon */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
            <Building2 className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground flex items-center gap-2 mb-1">
            <Settings className="w-4 h-4 text-amber-500" />
            Configure sua Empresa
          </h3>
          
          <AlertDescription className="text-muted-foreground text-sm mb-3">
            É importante configurar os dados da sua empresa para que seus contratos, 
            agenda e documentos sejam emitidos com as informações corretas.
          </AlertDescription>

          {/* Missing items */}
          <div className="flex flex-wrap gap-2 mb-4">
            {missingItems.map((item, index) => (
              <span 
                key={index}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20"
              >
                {item === "Logo da empresa" && <Image className="w-3 h-3" />}
                {item === "Horários de funcionamento" && <Clock className="w-3 h-3" />}
                {(item !== "Logo da empresa" && item !== "Horários de funcionamento") && <FileText className="w-3 h-3" />}
                {item}
              </span>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button 
              onClick={handleConfigure}
              size="sm"
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md shadow-amber-500/25"
            >
              <Settings className="w-4 h-4 mr-2" />
              Configurar Agora
            </Button>
            <Button 
              onClick={handleDismiss}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
            >
              Lembrar depois
            </Button>
          </div>
        </div>

        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={handleDismiss}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </Alert>
  );
}
