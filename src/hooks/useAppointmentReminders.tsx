import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { parseISO, differenceInMinutes } from "date-fns";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

type Appointment = {
  id: string;
  title: string;
  start_time: string;
  status: string;
  customers?: {
    name: string;
  };
};

export function useAppointmentReminders() {
  const notifiedAppointments = useRef<Set<string>>(new Set());

  // Buscar agendamentos do dia
  const { data: appointments = [] } = useQuery({
    queryKey: ["appointments-reminders"],
    queryFn: async () => {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

      const { data, error } = await supabase
        .from("appointments")
        .select(`
          id,
          title,
          start_time,
          status,
          customers(name)
        `)
        .gte("start_time", startOfDay.toISOString())
        .lte("start_time", endOfDay.toISOString())
        .eq("status", "scheduled")
        .order("start_time");

      if (error) throw error;
      return data as Appointment[];
    },
    refetchInterval: 60000, // Verificar a cada 1 minuto
  });

  useEffect(() => {
    // Solicitar permissão para notificações do browser
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    // Verificar agendamentos próximos
    const checkReminders = () => {
      const now = new Date();

      appointments.forEach((apt) => {
        const startTime = parseISO(apt.start_time);
        const minutesUntil = differenceInMinutes(startTime, now);

        // Notificar 30 minutos antes, 15 minutos antes e 5 minutos antes
        const shouldNotify =
          (minutesUntil <= 30 && minutesUntil > 29) ||
          (minutesUntil <= 15 && minutesUntil > 14) ||
          (minutesUntil <= 5 && minutesUntil > 4);

        const notificationKey = `${apt.id}-${minutesUntil}`;

        if (shouldNotify && !notifiedAppointments.current.has(notificationKey)) {
          notifiedAppointments.current.add(notificationKey);

          // Toast notification
          toast.info(`Lembrete de Agendamento`, {
            description: `${apt.title} com ${apt.customers?.name} em ${minutesUntil} minutos às ${format(startTime, "HH:mm")}`,
            duration: 10000,
          });

          // Browser notification
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("Lembrete de Agendamento", {
              body: `${apt.title} com ${apt.customers?.name} em ${minutesUntil} minutos às ${format(startTime, "HH:mm", { locale: ptBR })}`,
              icon: "/logo.png",
              tag: apt.id,
            });
          }
        }
      });
    };

    checkReminders();
    const interval = setInterval(checkReminders, 60000); // Verificar a cada 1 minuto

    return () => clearInterval(interval);
  }, [appointments]);

  // Função para testar notificações
  const testNotification = () => {
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification("Teste de Notificação", {
          body: "As notificações estão funcionando!",
          icon: "/logo.png",
        });
        toast.success("Notificação de teste enviada!");
      } else if (Notification.permission === "default") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            new Notification("Teste de Notificação", {
              body: "As notificações estão funcionando!",
              icon: "/logo.png",
            });
            toast.success("Notificação de teste enviada!");
          } else {
            toast.error("Permissão de notificação negada");
          }
        });
      } else {
        toast.error("Permissão de notificação negada. Ative nas configurações do navegador.");
      }
    } else {
      toast.error("Seu navegador não suporta notificações");
    }
  };

  return { testNotification };
}
