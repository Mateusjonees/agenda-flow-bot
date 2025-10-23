import { useState, useEffect } from "react";
import { Bell, Calendar, ListTodo } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface Appointment {
  id: string;
  title: string;
  start_time: string;
  customer_id: string;
}

interface Task {
  id: string;
  title: string;
  due_date: string;
  priority: string;
}

export function NotificationBell() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Buscar atendimentos do dia
    const { data: appointmentsData } = await supabase
      .from("appointments")
      .select("id, title, start_time, customer_id")
      .eq("user_id", user.id)
      .gte("start_time", today.toISOString())
      .lt("start_time", tomorrow.toISOString())
      .order("start_time", { ascending: true });

    // Buscar tarefas pendentes
    const { data: tasksData } = await supabase
      .from("tasks")
      .select("id, title, due_date, priority")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .lte("due_date", tomorrow.toISOString())
      .order("due_date", { ascending: true })
      .limit(10);

    setAppointments(appointmentsData || []);
    setTasks(tasksData || []);
    setLoading(false);
  };

  const totalNotifications = appointments.length + tasks.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={fetchNotifications}
        >
          <Bell className="w-4 h-4" />
          {totalNotifications > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {totalNotifications}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold">Notificações</h4>
          {totalNotifications > 0 && (
            <Badge variant="secondary">{totalNotifications}</Badge>
          )}
        </div>
        
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              Carregando...
            </div>
          ) : totalNotifications === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              Nenhuma notificação no momento
            </div>
          ) : (
            <div className="p-2">
              {appointments.length > 0 && (
                <div className="mb-2">
                  <div className="flex items-center gap-2 px-2 py-1.5">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Atendimentos de Hoje</span>
                  </div>
                  <div className="space-y-1">
                    {appointments.map((apt) => (
                      <div
                        key={apt.id}
                        className="flex items-start gap-3 p-2 rounded-md hover:bg-muted transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{apt.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(apt.start_time), "HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {appointments.length > 0 && tasks.length > 0 && (
                <Separator className="my-2" />
              )}

              {tasks.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 px-2 py-1.5">
                    <ListTodo className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Tarefas Pendentes</span>
                  </div>
                  <div className="space-y-1">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-start gap-3 p-2 rounded-md hover:bg-muted transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{task.title}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(task.due_date), "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                            {task.priority === "high" && (
                              <Badge variant="destructive" className="h-4 text-[10px] px-1">
                                Alta
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
