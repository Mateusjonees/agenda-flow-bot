import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, User, Pencil, CheckCircle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Customer = {
  id: string;
  name: string;
};

type Appointment = {
  id: string;
  title: string;
  description: string | null;
  customer_id: string;
  start_time: string;
  end_time: string;
  status: string;
  notes: string | null;
  customers?: Customer;
};

type DayAppointmentsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date;
  appointments: Appointment[];
  onEdit: (appointmentId: string) => void;
  onFinish: (appointment: { id: string; title: string }) => void;
  onDelete: (appointmentId: string) => void;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
    case "cancelled":
      return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20";
    case "pending":
      return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20";
    default:
      return "bg-primary/10 text-primary border-primary/20";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "completed": return "Concluído";
    case "cancelled": return "Cancelado";
    case "pending": return "Pendente";
    case "confirmed": return "Confirmado";
    default: return status;
  }
};

export function DayAppointmentsDialog({
  open,
  onOpenChange,
  date,
  appointments,
  onEdit,
  onFinish,
  onDelete,
}: DayAppointmentsDialogProps) {
  const sortedAppointments = [...appointments].sort((a, b) => 
    parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime()
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Agendamentos de {format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto pr-2 space-y-3">
          {sortedAppointments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum agendamento para este dia
            </div>
          ) : (
            sortedAppointments.map((apt) => (
              <div
                key={apt.id}
                className={cn(
                  "p-4 rounded-lg border-2 bg-card hover:shadow-md transition-all",
                  getStatusColor(apt.status)
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Clock className="w-4 h-4 flex-shrink-0" />
                      <span className="font-bold text-foreground">
                        {format(parseISO(apt.start_time), "HH:mm")} - {format(parseISO(apt.end_time), "HH:mm")}
                      </span>
                      <Badge variant="outline" className={cn("text-xs", getStatusColor(apt.status))}>
                        {getStatusLabel(apt.status)}
                      </Badge>
                    </div>
                    
                    <div className="text-base font-semibold text-foreground">
                      {apt.title}
                    </div>
                    
                    {apt.customers && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="w-4 h-4" />
                        <span>{apt.customers.name}</span>
                      </div>
                    )}
                    
                    {apt.description && (
                      <div className="text-sm text-muted-foreground">
                        {apt.description}
                      </div>
                    )}
                    
                    {apt.notes && (
                      <div className="text-xs text-muted-foreground italic">
                        Obs: {apt.notes}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onEdit(apt.id)}
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    
                    {apt.status !== "completed" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onFinish({ id: apt.id, title: apt.title })}
                        title="Finalizar"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => onDelete(apt.id)}
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
