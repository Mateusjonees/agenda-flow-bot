import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Calendar, User, Phone, Mail, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

type Customer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
};

type Appointment = {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  status: string;
  customers?: Customer;
};

type AppointmentQuickSearchProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectAppointment: (appointmentId: string) => void;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-green-500/10 text-green-700 dark:text-green-400";
    case "cancelled":
      return "bg-red-500/10 text-red-700 dark:text-red-400";
    case "pending":
      return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400";
    default:
      return "bg-primary/10 text-primary";
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

export function AppointmentQuickSearch({ open, onOpenChange, onSelectAppointment }: AppointmentQuickSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["appointments-search"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          customers(id, name, email, phone)
        `)
        .order("start_time", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as Appointment[];
    },
    enabled: open,
    refetchOnMount: 'always',
  });

  // Filtrar agendamentos por nome, email ou telefone do cliente
  const filteredAppointments = appointments.filter(apt => {
    if (!apt.customers || !searchTerm) return false;
    
    const search = searchTerm.toLowerCase();
    const name = apt.customers.name?.toLowerCase() || "";
    const email = apt.customers.email?.toLowerCase() || "";
    const phone = apt.customers.phone?.toLowerCase().replace(/\D/g, "") || "";
    const searchPhone = search.replace(/\D/g, "");
    
    return name.includes(search) || 
           email.includes(search) || 
           phone.includes(searchPhone);
  });

  // Reset search when dialog closes
  useEffect(() => {
    if (!open) {
      setSearchTerm("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-2xl">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Buscar por nome, email ou telefone do cliente..." 
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Carregando...
              </div>
            ) : (
              <>
                <CommandEmpty>
                  {searchTerm ? "Nenhum agendamento encontrado." : "Digite para buscar..."}
                </CommandEmpty>
                {filteredAppointments.length > 0 && (
                  <CommandGroup heading={`${filteredAppointments.length} agendamento(s) encontrado(s)`}>
                    {filteredAppointments.map((apt) => (
                  <CommandItem
                    key={apt.id}
                    value={apt.id}
                    onSelect={() => {
                      onSelectAppointment(apt.id);
                      onOpenChange(false);
                    }}
                    className="flex flex-col items-start gap-2 p-4 cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="font-semibold truncate">{apt.title}</span>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>
                              {format(parseISO(apt.start_time), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className={getStatusColor(apt.status)}>
                        {getStatusLabel(apt.status)}
                      </Badge>
                    </div>
                    
                    {apt.customers && (
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground pl-6">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>{apt.customers.name}</span>
                        </div>
                        {apt.customers.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            <span>{apt.customers.email}</span>
                          </div>
                        )}
                        {apt.customers.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            <span>{apt.customers.phone}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
