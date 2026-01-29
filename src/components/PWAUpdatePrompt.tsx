import { useEffect } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { toast } from "sonner";

export function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, r) {
      if (r) {
        setInterval(() => r.update(), 5 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.error("SW registration error:", error);
    },
  });

  useEffect(() => {
    if (needRefresh) {
      toast.info("Nova versão disponível!", {
        description: "Clique para atualizar o sistema",
        duration: Infinity,
        action: { label: "Atualizar", onClick: () => updateServiceWorker(true) },
      });
    }
  }, [needRefresh, updateServiceWorker]);

  return null;
}