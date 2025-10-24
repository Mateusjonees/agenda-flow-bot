import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle, Pencil, Filter } from "lucide-react";
import { toast } from "sonner";
import { format, addDays, addWeeks, addMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FinishAppointmentDialog } from "@/components/FinishAppointmentDialog";
import { EditAppointmentDialog } from "@/components/EditAppointmentDialog";

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

const Agendamentos = () => {
  const [open, setOpen] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [service, setService] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("60");
  const [notes, setNotes] = useState("");
  const [viewType, setViewType] = useState<"day" | "week" | "month">("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [finishDialogOpen, setFinishDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<{ id: string; title: string } | null>(null);
  const [editAppointmentId, setEditAppointmentId] = useState<string>("");
  
  // Filtros
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCustomer, setFilterCustomer] = useState<string>("all");
  const [filterOpen, setFilterOpen] = useState(false);
  
  const queryClient = useQueryClient();

  // Buscar clientes
  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, name")
        .order("name");
      
      if (error) throw error;
      return data as Customer[];
    },
  });

  // Buscar agendamentos
  const { data: allAppointments = [], isLoading } = useQuery({
    queryKey: ["appointments", currentDate, viewType],
    queryFn: async () => {
      let startDate: Date;
      let endDate: Date;

      if (viewType === "day") {
        startDate = startOfDay(currentDate);
        endDate = endOfDay(currentDate);
      } else if (viewType === "week") {
        startDate = startOfWeek(currentDate, { weekStartsOn: 0 });
        endDate = endOfWeek(currentDate, { weekStartsOn: 0 });
      } else {
        startDate = startOfMonth(currentDate);
        endDate = endOfMonth(currentDate);
      }

      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          customers(id, name)
        `)
        .gte("start_time", startDate.toISOString())
        .lte("start_time", endDate.toISOString())
        .order("start_time");

      if (error) throw error;
      return data as Appointment[];
    },
  });

  // Aplicar filtros
  const appointments = allAppointments.filter(apt => {
    if (filterStatus !== "all" && apt.status !== filterStatus) return false;
    if (filterCustomer !== "all" && apt.customer_id !== filterCustomer) return false;
    return true;
  });

  // Mutation para criar agendamento
  const createAppointment = useMutation({
    mutationFn: async (appointmentData: {
      customer_id: string;
      title: string;
      description: string;
      start_time: string;
      end_time: string;
      notes: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("appointments")
        .insert({
          ...appointmentData,
          user_id: user.id,
          status: "scheduled",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Agendamento criado com sucesso!");
      setOpen(false);
      setCustomerId("");
      setService("");
      setDate("");
      setTime("");
      setDuration("60");
      setNotes("");
    },
    onError: (error) => {
      toast.error("Erro ao criar agendamento");
      console.error(error);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerId || !service || !date || !time) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    // Criar datetime combinando data e hora
    const startDateTime = new Date(`${date}T${time}`);
    const endDateTime = new Date(startDateTime.getTime() + parseInt(duration) * 60000);

    createAppointment.mutate({
      customer_id: customerId,
      title: service,
      description: service,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      notes: notes || "",
    });
  };

  const handlePrevious = () => {
    if (viewType === "day") {
      setCurrentDate(addDays(currentDate, -1));
    } else if (viewType === "week") {
      setCurrentDate(addWeeks(currentDate, -1));
    } else {
      setCurrentDate(addMonths(currentDate, -1));
    }
  };

  const handleNext = () => {
    if (viewType === "day") {
      setCurrentDate(addDays(currentDate, 1));
    } else if (viewType === "week") {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getDateRangeText = () => {
    if (viewType === "day") {
      return format(currentDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } else if (viewType === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      const end = endOfWeek(currentDate, { weekStartsOn: 0 });
      return `${format(start, "dd MMM", { locale: ptBR })} - ${format(end, "dd MMM yyyy", { locale: ptBR })}`;
    } else {
      return format(currentDate, "MMMM 'de' yyyy", { locale: ptBR });
    }
  };

  const renderDayView = () => {
    const hours = Array.from({ length: 14 }, (_, i) => i + 8);
    const dayAppointments = appointments.filter(apt => {
      const aptDate = parseISO(apt.start_time);
      return isSameDay(aptDate, currentDate);
    });
    
    return (
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-muted p-4 border-b">
          <h3 className="font-semibold capitalize">{format(currentDate, "EEEE", { locale: ptBR })}</h3>
        </div>
        <div className="divide-y">
          {hours.map((hour) => {
            const hourAppointments = dayAppointments.filter(apt => {
              const aptHour = parseISO(apt.start_time).getHours();
              return aptHour === hour;
            });

            return (
              <div key={hour} className="flex items-center p-4 hover:bg-muted/50 transition-colors">
                <div className="w-20 text-sm text-muted-foreground">
                  {String(hour).padStart(2, "0")}:00
                </div>
                <div className="flex-1 min-h-[40px]">
                  {hourAppointments.length > 0 ? (
                     <div className="space-y-2">
                        {hourAppointments.map((apt) => (
                         <div key={apt.id} className="bg-primary/10 border-l-4 border-primary p-2 rounded">
                           <div className="flex items-start justify-between gap-2">
                             <div className="flex-1 min-w-0">
                               <div className="font-semibold text-sm">{apt.title}</div>
                               <div className="text-xs text-muted-foreground">
                                 {apt.customers?.name} • {format(parseISO(apt.start_time), "HH:mm")} - {format(parseISO(apt.end_time), "HH:mm")}
                               </div>
                             </div>
                             <div className="flex gap-1 flex-shrink-0">
                               <Button
                                 size="sm"
                                 variant="ghost"
                                 className="h-7 gap-1"
                                 onClick={() => {
                                   setEditAppointmentId(apt.id);
                                   setEditDialogOpen(true);
                                 }}
                               >
                                 <Pencil className="w-3 h-3" />
                                 Editar
                               </Button>
                               <Button
                                 size="sm"
                                 variant="default"
                                 className="h-7 gap-1"
                                 onClick={() => {
                                   setSelectedAppointment({ id: apt.id, title: apt.title });
                                   setFinishDialogOpen(true);
                                 }}
                               >
                                 <CheckCircle className="w-3 h-3" />
                                 Finalizar
                               </Button>
                             </div>
                           </div>
                         </div>
                        ))}
                     </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">Disponível</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 });
    const end = endOfWeek(currentDate, { weekStartsOn: 0 });
    const days = eachDayOfInterval({ start, end });
    const hours = Array.from({ length: 14 }, (_, i) => i + 8);

    return (
      <div className="border rounded-lg overflow-hidden overflow-x-auto">
        <div className="grid grid-cols-8 border-b bg-muted min-w-[800px]">
          <div className="p-3"></div>
          {days.map((day) => (
            <div
              key={day.toISOString()}
              className={`p-3 text-center border-l ${
                isSameDay(day, new Date()) ? "bg-primary/10" : ""
              }`}
            >
              <div className="text-xs text-muted-foreground capitalize">
                {format(day, "EEE", { locale: ptBR })}
              </div>
              <div className={`text-lg font-semibold ${
                isSameDay(day, new Date()) ? "text-primary" : ""
              }`}>
                {format(day, "dd")}
              </div>
            </div>
          ))}
        </div>
        <div className="divide-y min-w-[800px]">
          {hours.map((hour) => (
            <div key={hour} className="grid grid-cols-8">
              <div className="p-3 text-sm text-muted-foreground border-r">
                {String(hour).padStart(2, "0")}:00
              </div>
              {days.map((day) => {
                const dayHourAppointments = appointments.filter(apt => {
                  const aptDate = parseISO(apt.start_time);
                  return isSameDay(aptDate, day) && aptDate.getHours() === hour;
                });

                return (
                     <div
                       key={`${day.toISOString()}-${hour}`}
                        className="p-2 border-l hover:bg-muted/50 transition-colors min-h-[60px]"
                      >
                        {dayHourAppointments.map((apt) => (
                          <div key={apt.id} className="bg-primary/10 border-l-2 border-primary p-1 rounded mb-1 text-xs">
                            <div className="flex items-start justify-between gap-1">
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold truncate">{apt.title}</div>
                                <div className="text-muted-foreground truncate">{apt.customers?.name}</div>
                              </div>
                              <div className="flex gap-0.5 flex-shrink-0">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-5 w-5 p-0"
                                  onClick={() => {
                                    setEditAppointmentId(apt.id);
                                    setEditDialogOpen(true);
                                  }}
                                  title="Editar"
                                >
                                  <Pencil className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-5 w-5 p-0"
                                  onClick={() => {
                                    setSelectedAppointment({ id: apt.id, title: apt.title });
                                    setFinishDialogOpen(true);
                                  }}
                                  title="Finalizar"
                                >
                                  <CheckCircle className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start, end });
    
    const startDay = start.getDay();
    const previousDays = startDay === 0 ? 0 : startDay;
    const allDays = [
      ...Array.from({ length: previousDays }, (_, i) => addDays(start, -(previousDays - i))),
      ...days
    ];

    return (
      <div className="border rounded-lg overflow-hidden">
        <div className="grid grid-cols-7 border-b bg-muted">
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
            <div key={day} className="p-3 text-center text-sm font-semibold border-l first:border-l-0">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {allDays.map((day, idx) => {
            const isCurrentMonth = day >= start && day <= end;
            const isToday = isSameDay(day, new Date());
            
            const dayAppointments = appointments.filter(apt => {
              const aptDate = parseISO(apt.start_time);
              return isSameDay(aptDate, day);
            });
            
            return (
              <div
                key={idx}
                className={`min-h-[100px] p-2 border-b border-l first:border-l-0 hover:bg-muted/50 transition-colors ${
                  !isCurrentMonth ? "bg-muted/30 text-muted-foreground" : ""
                }`}
              >
                <div
                  className={`text-sm font-semibold mb-1 ${
                    isToday ? "bg-primary text-primary-foreground w-7 h-7 rounded-full flex items-center justify-center" : ""
                  }`}
                >
                  {format(day, "d")}
                </div>
                 <div className="space-y-1">
                   {dayAppointments.slice(0, 3).map((apt) => (
                     <div 
                       key={apt.id} 
                       className="bg-primary/10 border-l-2 border-primary p-1 rounded text-xs"
                     >
                       <div className="flex items-start justify-between gap-1">
                         <div className="flex-1 min-w-0">
                           <div className="font-semibold truncate">{format(parseISO(apt.start_time), "HH:mm")}</div>
                           <div className="truncate">{apt.title}</div>
                         </div>
                         <div className="flex gap-0.5 flex-shrink-0">
                           <Button
                             size="sm"
                             variant="ghost"
                             className="h-4 w-4 p-0"
                             onClick={(e) => {
                               e.stopPropagation();
                               setEditAppointmentId(apt.id);
                               setEditDialogOpen(true);
                             }}
                             title="Editar"
                           >
                             <Pencil className="w-2.5 h-2.5" />
                           </Button>
                           <Button
                             size="sm"
                             variant="ghost"
                             className="h-4 w-4 p-0"
                             onClick={(e) => {
                               e.stopPropagation();
                               setSelectedAppointment({ id: apt.id, title: apt.title });
                               setFinishDialogOpen(true);
                             }}
                             title="Finalizar"
                           >
                             <CheckCircle className="w-2.5 h-2.5" />
                           </Button>
                         </div>
                       </div>
                     </div>
                   ))}
                   {dayAppointments.length > 3 && (
                     <div className="text-xs text-muted-foreground">+{dayAppointments.length - 3} mais</div>
                   )}
                 </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Atendimentos</h1>
          <p className="text-muted-foreground">Gerencie todos os seus atendimentos</p>
        </div>
        <div className="flex gap-2">
          <Popover open={filterOpen} onOpenChange={setFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                Filtros
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <div>
                  <Label>Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="scheduled">Agendado</SelectItem>
                      <SelectItem value="completed">Concluído</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Cliente</Label>
                  <Select value={filterCustomer} onValueChange={setFilterCustomer}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {customers.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Agendamento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Novo Agendamento</DialogTitle>
              <DialogDescription>
                Crie um novo agendamento preenchendo os dados abaixo
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="customer">Cliente *</Label>
                <Select value={customerId} onValueChange={setCustomerId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="service">Serviço *</Label>
                <Input
                  id="service"
                  placeholder="Tipo de serviço"
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Data *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="time">Horário *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duração (minutos) *</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutos</SelectItem>
                    <SelectItem value="60">1 hora</SelectItem>
                    <SelectItem value="90">1h 30min</SelectItem>
                    <SelectItem value="120">2 horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  placeholder="Observações adicionais..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createAppointment.isPending}>
                  {createAppointment.isPending ? "Criando..." : "Criar Agendamento"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <CardTitle>Calendário</CardTitle>
              <Tabs value={viewType} onValueChange={(v) => setViewType(v as "day" | "week" | "month")}>
                <TabsList className="h-9">
                  <TabsTrigger value="day" className="text-xs">Dia</TabsTrigger>
                  <TabsTrigger value="week" className="text-xs">Semana</TabsTrigger>
                  <TabsTrigger value="month" className="text-xs">Mês</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleToday} className="gap-2 h-9">
                <CalendarIcon className="w-4 h-4" />
                Hoje
              </Button>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" onClick={handlePrevious} className="h-9 w-9">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleNext} className="h-9 w-9">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-center">
            <h3 className="text-2xl font-bold capitalize">{getDateRangeText()}</h3>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Carregando atendimentos...</div>
            </div>
          ) : (
            <>
              {viewType === "day" && renderDayView()}
              {viewType === "week" && renderWeekView()}
              {viewType === "month" && renderMonthView()}
            </>
          )}
        </CardContent>
      </Card>

      {selectedAppointment && (
        <FinishAppointmentDialog
          open={finishDialogOpen}
          onOpenChange={setFinishDialogOpen}
          appointmentId={selectedAppointment.id}
          appointmentTitle={selectedAppointment.title}
        />
      )}
      
      {editAppointmentId && (
        <EditAppointmentDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          appointmentId={editAppointmentId}
        />
      )}
    </div>
  );
};

export default Agendamentos;
