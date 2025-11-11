import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle, Pencil, Filter, Trash2, Check, ChevronsUpDown, List, CalendarDays, Clock, User, XCircle, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format, addDays, addWeeks, addMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FinishAppointmentDialog } from "@/components/FinishAppointmentDialog";
import { EditAppointmentDialog } from "@/components/EditAppointmentDialog";
import { CalendarView } from "@/components/CalendarView";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { DndContext, DragOverlay, PointerSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { useDragDropAppointment } from "@/hooks/use-drag-drop-appointment";
import { DraggableAppointment } from "@/components/DraggableAppointment";
import { DroppableTimeSlot } from "@/components/DroppableTimeSlot";
import { useReadOnly, ReadOnlyWrapper } from "@/components/SubscriptionGuard";

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

type Task = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  priority: string;
  status: string;
  due_date: string;
  related_entity_type: string | null;
  related_entity_id: string | null;
};

// Funções auxiliares para cores e ícones
const getAppointmentColors = (appointment: Appointment) => {
  const now = new Date();
  const startTime = parseISO(appointment.start_time);
  const timeDiff = (startTime.getTime() - now.getTime()) / (1000 * 60);
  
  if (appointment.status === "completed") {
    return {
      bg: "bg-green-50 dark:bg-green-950/30",
      border: "border-green-500",
      text: "text-green-900 dark:text-green-100",
      badge: "bg-green-500 hover:bg-green-600",
      pulse: false
    };
  }
  
  if (appointment.status === "cancelled") {
    return {
      bg: "bg-red-50 dark:bg-red-950/30",
      border: "border-red-500",
      text: "text-red-900 dark:text-red-100",
      badge: "bg-red-500 hover:bg-red-600",
      pulse: false
    };
  }
  
  if (timeDiff < 0 && appointment.status === "scheduled") {
    return {
      bg: "bg-orange-100 dark:bg-orange-950/40",
      border: "border-orange-600",
      text: "text-orange-900 dark:text-orange-100",
      badge: "bg-orange-600 hover:bg-orange-700",
      pulse: true
    };
  }
  
  if (timeDiff >= 0 && timeDiff <= 30 && appointment.status === "scheduled") {
    return {
      bg: "bg-yellow-50 dark:bg-yellow-950/30",
      border: "border-yellow-500",
      text: "text-yellow-900 dark:text-yellow-100",
      badge: "bg-yellow-500 hover:bg-yellow-600",
      pulse: true
    };
  }
  
  if (timeDiff > 30 && timeDiff <= 120 && appointment.status === "scheduled") {
    return {
      bg: "bg-blue-50 dark:bg-blue-950/30",
      border: "border-blue-400",
      text: "text-blue-900 dark:text-blue-100",
      badge: "bg-blue-500 hover:bg-blue-600",
      pulse: false
    };
  }
  
  return {
    bg: "bg-slate-50 dark:bg-slate-900/30",
    border: "border-slate-300 dark:border-slate-700",
    text: "text-slate-900 dark:text-slate-100",
    badge: "bg-slate-500 hover:bg-slate-600",
    pulse: false
  };
};

const getStatusIcon = (status: string, timeDiff: number) => {
  if (status === "completed") return <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />;
  if (status === "cancelled") return <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />;
  if (timeDiff < 0) return <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 animate-pulse" />;
  if (timeDiff <= 30) return <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 animate-pulse" />;
  return <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />;
};

const getStatusLabel = (status: string, timeDiff: number) => {
  if (status === "completed") return "Concluído";
  if (status === "cancelled") return "Cancelado";
  if (timeDiff < 0) return "Atrasado";
  if (timeDiff <= 30) return `${Math.floor(timeDiff)}min`;
  if (timeDiff <= 120) return "Em breve";
  return "Agendado";
};

const Agendamentos = () => {
  const { isReadOnly } = useReadOnly();
  const [open, setOpen] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [service, setService] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("60");
  const [notes, setNotes] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [viewType, setViewType] = useState<"day" | "week" | "month">("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [finishDialogOpen, setFinishDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<{ id: string; title: string } | null>(null);
  const [editAppointmentId, setEditAppointmentId] = useState<string>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteAppointmentId, setDeleteAppointmentId] = useState<string>("");
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSelectedAppointment, setMobileSelectedAppointment] = useState<Appointment | null>(null);
  
  // Filtros
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCustomer, setFilterCustomer] = useState<string>("all");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>("all");
  const [filterOpen, setFilterOpen] = useState(false);
  
  const queryClient = useQueryClient();
  
  // Drag and Drop configuration
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    })
  );
  
  const { activeId, activeType, handleDragStart, handleDragEnd, handleDragCancel } = useDragDropAppointment();

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

  // Mutation para excluir agendamento
  const deleteAppointmentMutation = useMutation({
    mutationFn: async (appointmentId: string) => {
      const { error } = await supabase
        .from("appointments")
        .delete()
        .eq("id", appointmentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Agendamento excluído com sucesso!");
      setDeleteDialogOpen(false);
      setDeleteAppointmentId("");
    },
    onError: (error) => {
      console.error("Erro ao excluir agendamento:", error);
      toast.error("Erro ao excluir agendamento");
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

  // Buscar tarefas
  const { data: allTasks = [] } = useQuery({
    queryKey: ["tasks-calendar", currentDate, viewType],
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
        .from("tasks")
        .select("*")
        .gte("due_date", startDate.toISOString())
        .lte("due_date", endDate.toISOString())
        .in("status", ["pending", "in_progress"])
        .order("due_date");

      if (error) throw error;
      return data as Task[];
    },
  });

  // Aplicar filtros
  const appointments = allAppointments.filter(apt => {
    if (filterStatus !== "all" && apt.status !== filterStatus) return false;
    if (filterCustomer !== "all" && apt.customer_id !== filterCustomer) return false;
    if (filterPaymentStatus !== "all" && (apt as any).payment_status !== filterPaymentStatus) return false;
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

  // Estatísticas dos agendamentos
  const now = new Date();
  const appointmentStats = {
    proximos: appointments.filter(apt => {
      const timeDiff = (parseISO(apt.start_time).getTime() - now.getTime()) / (1000 * 60);
      return apt.status === "scheduled" && timeDiff >= 0 && timeDiff <= 30;
    }).length,
    emBreve: appointments.filter(apt => {
      const timeDiff = (parseISO(apt.start_time).getTime() - now.getTime()) / (1000 * 60);
      return apt.status === "scheduled" && timeDiff > 30 && timeDiff <= 120;
    }).length,
    concluidos: appointments.filter(apt => apt.status === "completed").length,
    atrasados: appointments.filter(apt => {
      const timeDiff = (parseISO(apt.start_time).getTime() - now.getTime()) / (1000 * 60);
      return apt.status === "scheduled" && timeDiff < 0;
    }).length,
    total: appointments.length
  };

  const renderDayView = () => {
    const hours = Array.from({ length: 14 }, (_, i) => i + 8);
    const dayAppointments = appointments.filter(apt => {
      const aptDate = parseISO(apt.start_time);
      return isSameDay(aptDate, currentDate);
    });
    
    const dayTasks = allTasks.filter(task => {
      const taskDate = parseISO(task.due_date);
      return isSameDay(taskDate, currentDate);
    });

    const currentHour = new Date().getHours();
    const currentMinute = new Date().getMinutes();
    const isCurrentDay = isSameDay(currentDate, new Date());
    
    return (
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-3 sm:p-4 border-b">
          <h3 className="font-semibold text-base sm:text-lg capitalize">{format(currentDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}</h3>
        </div>
        <div className="divide-y relative">
          {hours.map((hour) => {
            const hourAppointments = dayAppointments.filter(apt => {
              const aptHour = parseISO(apt.start_time).getHours();
              return aptHour === hour;
            });
            
            const hourTasks = dayTasks.filter(task => {
              const taskHour = parseISO(task.due_date).getHours();
              return taskHour === hour;
            });

            return (
              <DroppableTimeSlot
                key={hour}
                id={`day-${format(currentDate, 'yyyy-MM-dd')}-${hour}`}
                date={currentDate}
                hour={hour}
                className="flex items-start p-2 sm:p-4 hover:bg-muted/50 transition-colors min-h-[70px] sm:min-h-[90px] relative"
              >
                {/* Linha de hora atual */}
                {isCurrentDay && hour === currentHour && (
                  <div 
                    className="absolute left-0 w-full border-t-2 border-red-500 z-10 pointer-events-none"
                    style={{ top: `${(currentMinute / 60) * 100}%` }}
                  >
                    <div className="absolute -left-1 -top-2 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
                    <span className="absolute left-4 -top-3 text-xs text-red-500 font-bold bg-background px-1">
                      AGORA
                    </span>
                  </div>
                )}
                
                <div className="w-14 sm:w-20 text-xs sm:text-sm text-muted-foreground font-semibold pt-0.5 flex-shrink-0">
                  {String(hour).padStart(2, "0")}:00
                </div>
                <div className="flex-1 min-w-0">
                  {hourAppointments.length > 0 || hourTasks.length > 0 ? (
                     <div className="space-y-3">
                         {hourAppointments.map((apt) => {
                           const colors = getAppointmentColors(apt);
                           const now = new Date();
                           const timeDiff = (parseISO(apt.start_time).getTime() - now.getTime()) / (1000 * 60);
                           
                           return (
                         <DraggableAppointment
                           key={apt.id}
                           id={apt.id}
                           type="appointment"
                           currentStartTime={parseISO(apt.start_time)}
                           currentEndTime={parseISO(apt.end_time)}
                         >
                           <div className={cn(
                             "group relative overflow-hidden rounded-lg border-l-4 p-3 sm:p-4 transition-all duration-300",
                             "hover:shadow-md hover:scale-[1.02]",
                             colors.bg,
                             colors.border,
                             colors.pulse && "animate-pulse"
                           )}>
                            <div className="flex flex-col gap-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  {getStatusIcon(apt.status, timeDiff)}
                                  <div className="flex-1">
                                    <div className="font-semibold text-base sm:text-lg truncate">{apt.title}</div>
                                    <div className="text-xs sm:text-sm opacity-75 mt-0.5">
                                      {format(parseISO(apt.start_time), "HH:mm")} - {format(parseISO(apt.end_time), "HH:mm")}
                                      <span className="ml-2">
                                        ({Math.floor((parseISO(apt.end_time).getTime() - parseISO(apt.start_time).getTime()) / 60000)}min)
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <Badge className={cn(colors.badge, "text-white")}>
                                  {getStatusLabel(apt.status, timeDiff)}
                                </Badge>
                              </div>
                              
                              <div className="flex items-center gap-2 text-sm">
                                <User className="w-4 h-4 opacity-60" />
                                <span className="font-medium">{apt.customers?.name}</span>
                              </div>
                              
                              {timeDiff >= 0 && timeDiff <= 30 && apt.status === "scheduled" && (
                                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-md">
                                  <div className="flex items-center gap-2 text-xs font-medium text-yellow-900 dark:text-yellow-100">
                                    <Clock className="w-3 h-3" />
                                    Faltam {Math.floor(timeDiff)} minutos
                                  </div>
                                </div>
                              )}
                              
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 sm:h-9 gap-1 flex-1 sm:flex-none text-xs sm:text-sm"
                                    onClick={() => {
                                      setEditAppointmentId(apt.id);
                                      setEditDialogOpen(true);
                                    }}
                                    disabled={isReadOnly}
                                  >
                                    <Pencil className="w-3 h-3" />
                                    <span>Editar</span>
                                  </Button>
                                  {apt.status !== "completed" && (
                                    <Button
                                      size="sm"
                                      variant="default"
                                      className="h-8 sm:h-9 gap-1 flex-1 sm:flex-none text-xs sm:text-sm"
                                      onClick={() => {
                                        setSelectedAppointment({ id: apt.id, title: apt.title });
                                        setFinishDialogOpen(true);
                                      }}
                                      disabled={isReadOnly}
                                    >
                                      <CheckCircle className="w-3 h-3" />
                                      <span>Finalizar</span>
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 sm:h-9 gap-1 flex-1 sm:flex-none text-xs sm:text-sm text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => {
                                      setDeleteAppointmentId(apt.id);
                                      setDeleteDialogOpen(true);
                                    }}
                                    disabled={isReadOnly}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    <span>Excluir</span>
                                  </Button>
                                </div>
                            </div>
                           </div>
                         </DraggableAppointment>
                         );
                         })}
                         
                         {hourTasks.map((task) => (
                          <DraggableAppointment
                            key={task.id}
                            id={task.id}
                            type="task"
                            currentStartTime={parseISO(task.due_date)}
                          >
                           <div className="bg-orange-100 dark:bg-orange-950 border-l-4 border-orange-500 p-2 sm:p-3 rounded-md">
                             <div className="flex items-start justify-between gap-2">
                               <div className="flex-1 min-w-0">
                                 <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                   <div className="font-semibold text-sm sm:text-base truncate">{task.title}</div>
                                   <Badge variant="outline" className="text-xs w-fit">
                                     Tarefa
                                   </Badge>
                                 </div>
                                 <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                   {task.description || "Sem descrição"} • {format(parseISO(task.due_date), "HH:mm")}
                                 </div>
                               </div>
                             </div>
                           </div>
                          </DraggableAppointment>
                         ))}
                      </div>
                   ) : (
                     <div className="text-xs sm:text-sm text-muted-foreground/60 italic py-1">Disponível</div>
                   )}
                 </div>
               </DroppableTimeSlot>
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
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <div className="grid grid-cols-8 border-b min-w-[600px] sm:min-w-[700px] lg:min-w-[800px]">
            <div className="p-2 sm:p-3"></div>
            {days.map((day) => {
              const isCurrentDay = isSameDay(day, new Date());
              const dayAppointmentsCount = appointments.filter(apt => 
                isSameDay(parseISO(apt.start_time), day)
              ).length;
              
              return (
              <div
                key={day.toISOString()}
                className={cn(
                  "p-3 border-l font-semibold text-center transition-colors",
                  isCurrentDay && "bg-primary text-primary-foreground",
                  !isCurrentDay && "bg-muted"
                )}
              >
                <div className="text-xs uppercase tracking-wide opacity-75">
                  {format(day, "EEE", { locale: ptBR })}
                </div>
                <div className={cn(
                  "text-2xl mt-1",
                  isCurrentDay && "font-bold"
                )}>
                  {format(day, "dd")}
                </div>
                <div className="text-xs mt-1 opacity-90">
                  {dayAppointmentsCount > 0 && (
                    <Badge variant={isCurrentDay ? "secondary" : "default"} className="text-xs h-5">
                      {dayAppointmentsCount}
                    </Badge>
                  )}
                </div>
              </div>
              );
            })}
          </div>
          <div className="divide-y min-w-[600px] sm:min-w-[700px] lg:min-w-[800px]">
            {hours.map((hour) => (
              <div key={hour} className="grid grid-cols-8">
                <div className="p-2 sm:p-3 text-xs sm:text-sm text-muted-foreground border-r font-medium">
                  {String(hour).padStart(2, "0")}:00
                </div>
                {days.map((day) => {
                  const dayHourAppointments = appointments.filter(apt => {
                    const aptDate = parseISO(apt.start_time);
                    return isSameDay(aptDate, day) && aptDate.getHours() === hour;
                  });

                  return (
                    <DroppableTimeSlot
                      key={`${day.toISOString()}-${hour}`}
                      id={`week-${format(day, 'yyyy-MM-dd')}-${hour}`}
                      date={day}
                      hour={hour}
                      className="p-1.5 sm:p-2 border-l hover:bg-muted/50 transition-colors min-h-[50px] sm:min-h-[60px]"
                    >
                       {dayHourAppointments.map((apt) => {
                         const colors = getAppointmentColors(apt);
                         const now = new Date();
                         const timeDiff = (parseISO(apt.start_time).getTime() - now.getTime()) / (1000 * 60);
                         
                         return (
                        <DraggableAppointment
                          key={apt.id}
                          id={apt.id}
                          type="appointment"
                          currentStartTime={parseISO(apt.start_time)}
                          currentEndTime={parseISO(apt.end_time)}
                        >
                          <div 
                            className={cn(
                              "border-l-2 p-1 sm:p-1.5 rounded mb-1 text-xs group cursor-pointer transition-all duration-200",
                              "hover:shadow-sm hover:scale-105",
                              colors.bg,
                              colors.border,
                              colors.pulse && "animate-pulse"
                            )}
                            onClick={() => {
                              if (window.innerWidth < 640) {
                                setMobileSelectedAppointment(apt);
                                setMobileMenuOpen(true);
                              }
                            }}
                          >
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-1">
                                {getStatusIcon(apt.status, timeDiff)}
                                <div className="font-semibold truncate text-[11px] sm:text-xs leading-tight flex-1">
                                  {apt.title}
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Badge 
                                  className={cn(colors.badge, "text-white text-[9px] sm:text-[10px] px-1 py-0 h-3.5")}
                                >
                                  {getStatusLabel(apt.status, timeDiff)}
                                </Badge>
                                <div className="truncate text-[10px] sm:text-xs flex-1 opacity-90">
                                  {apt.customers?.name}
                                </div>
                              </div>
                              
                              {/* Botões apenas no desktop */}
                              <div className="hidden sm:flex gap-1 mt-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-5 w-5 p-0 opacity-70 hover:opacity-100 transition-opacity"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditAppointmentId(apt.id);
                                    setEditDialogOpen(true);
                                  }}
                                  title="Editar"
                                >
                                  <Pencil className="w-2.5 h-2.5" />
                                </Button>
                                {apt.status !== "completed" && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-5 w-5 p-0 opacity-70 hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedAppointment({ id: apt.id, title: apt.title });
                                      setFinishDialogOpen(true);
                                    }}
                                    title="Finalizar"
                                  >
                                    <CheckCircle className="w-2.5 h-2.5" />
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-5 w-5 p-0 opacity-70 hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteAppointmentId(apt.id);
                                    setDeleteDialogOpen(true);
                                  }}
                                  title="Excluir"
                                >
                                  <Trash2 className="w-2.5 h-2.5" />
                                </Button>
                              </div>
                             </div>
                          </div>
                        </DraggableAppointment>
                      );
                      })}
                    </DroppableTimeSlot>
                  );
                })}
              </div>
            ))}
          </div>
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
      <div className="overflow-x-auto">
        <div className="border rounded-lg min-w-[280px]">
          <div className="grid grid-cols-7 border-b bg-gradient-to-r from-primary/10 to-primary/5">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
              <div key={day} className="p-2 text-center text-xs sm:text-sm font-semibold border-l first:border-l-0">
                {day}
              </div>
            ))}
          </div>
        <div className="grid grid-cols-7">
          {allDays.map((day, idx) => {
            const isCurrentMonth = day >= start && day <= end;
            const isCurrentDay = isSameDay(day, new Date());
            
            const dayAppointments = appointments.filter(apt => {
              const aptDate = parseISO(apt.start_time);
              return isSameDay(aptDate, day);
            });
            
            const hasAppointments = dayAppointments.length > 0;
            
            return (
              <DroppableTimeSlot
                key={idx}
                id={`month-${format(day, 'yyyy-MM-dd')}-8`}
                date={day}
                hour={8}
                className={cn(
                  "min-h-[100px] sm:min-h-[130px] p-2 sm:p-3 border-b border-l first:border-l-0 transition-all duration-200",
                  "hover:shadow-lg hover:scale-[1.02] hover:z-10",
                  !isCurrentMonth && "opacity-40 bg-muted/30",
                  isCurrentDay && "ring-2 ring-primary shadow-lg bg-gradient-to-br from-primary/5 to-transparent",
                  hasAppointments && !isCurrentDay && "bg-gradient-to-br from-blue-50/30 to-transparent dark:from-blue-950/10 cursor-pointer"
                )}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className={cn(
                        "text-sm sm:text-base font-bold",
                        isCurrentDay && "bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center shadow-md"
                      )}
                    >
                      {format(day, "d")}
                    </div>
                    {dayAppointments.length > 0 && (
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "text-xs h-5 font-semibold",
                          isCurrentDay && "bg-primary/20"
                        )}
                      >
                        {dayAppointments.length}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Preview dots coloridos - mais limpo */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {dayAppointments.slice(0, 6).map((apt) => {
                      const colors = getAppointmentColors(apt);
                      const borderColor = colors.border.replace('border-', 'bg-');
                      return (
                        <div
                          key={apt.id}
                          className={cn(
                            "w-2.5 h-2.5 rounded-full shadow-sm",
                            borderColor,
                            colors.pulse && "animate-pulse"
                          )}
                          title={`${format(parseISO(apt.start_time), "HH:mm")} - ${apt.title}`}
                        />
                      );
                    })}
                    {dayAppointments.length > 6 && (
                      <span className="text-[10px] font-medium opacity-70">+{dayAppointments.length - 6}</span>
                    )}
                  </div>
                  
                  {/* Mobile: Lista de agendamentos */}
                  <div className="md:hidden space-y-1">
                    {dayAppointments.slice(0, 2).map((apt) => {
                      const colors = getAppointmentColors(apt);
                      const now = new Date();
                      const timeDiff = (parseISO(apt.start_time).getTime() - now.getTime()) / (1000 * 60);
                      
                      return (
                      <div
                        key={apt.id}
                        className={cn(
                          "border-l-3 p-1.5 rounded-md cursor-pointer transition-all duration-200",
                          "hover:shadow-sm active:scale-95",
                          colors.bg,
                          colors.border,
                          colors.pulse && "animate-pulse"
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          setMobileSelectedAppointment(apt);
                          setMobileMenuOpen(true);
                        }}
                      >
                        <div className="flex items-center gap-1.5 mb-0.5">
                          {getStatusIcon(apt.status, timeDiff)}
                          <span className="font-bold text-[10px]">{format(parseISO(apt.start_time), "HH:mm")}</span>
                          <Badge className={cn(colors.badge, "text-white text-[8px] px-1 py-0 h-3")}>
                            {getStatusLabel(apt.status, timeDiff)}
                          </Badge>
                        </div>
                        <div className="font-semibold text-[10px] truncate pl-5">{apt.title}</div>
                      </div>
                      );
                    })}
                    {dayAppointments.length > 2 && (
                      <div className="text-[10px] text-muted-foreground pl-1 font-medium">
                        +{dayAppointments.length - 2} {dayAppointments.length - 2 === 1 ? 'mais' : 'mais'}
                      </div>
                    )}
                  </div>
                  
                  {/* Desktop: Lista detalhada */}
                  <div className="hidden md:block space-y-1.5">
                    {dayAppointments.slice(0, 3).map((apt) => {
                      const colors = getAppointmentColors(apt);
                      const now = new Date();
                      const timeDiff = (parseISO(apt.start_time).getTime() - now.getTime()) / (1000 * 60);
                      
                      return (
                      <DraggableAppointment
                        key={apt.id}
                        id={apt.id}
                        type="appointment"
                        currentStartTime={parseISO(apt.start_time)}
                        currentEndTime={parseISO(apt.end_time)}
                      >
                        <div 
                          className={cn(
                            "border-l-3 p-2 rounded-md text-xs transition-all duration-200 cursor-pointer",
                            "hover:shadow-md hover:scale-105 hover:z-10",
                            colors.bg,
                            colors.border,
                            colors.pulse && "animate-pulse"
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            setMobileSelectedAppointment(apt);
                            setMobileMenuOpen(true);
                          }}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              {getStatusIcon(apt.status, timeDiff)}
                              <span className="font-bold">{format(parseISO(apt.start_time), "HH:mm")}</span>
                              <Badge 
                                className={cn(colors.badge, "text-white text-[9px] px-1.5 py-0 h-4")}
                              >
                                {getStatusLabel(apt.status, timeDiff)}
                              </Badge>
                            </div>
                            <div className="font-semibold truncate pl-5">{apt.title}</div>
                            <div className="text-[10px] opacity-75 truncate pl-5">
                              <User className="w-3 h-3 inline mr-1" />
                              {apt.customers?.name}
                            </div>
                          </div>
                        </div>
                      </DraggableAppointment>
                      );
                    })}
                    {dayAppointments.length > 3 && (
                      <div className="text-xs text-muted-foreground pl-2 font-medium flex items-center gap-1">
                        <div className="w-1 h-1 bg-muted-foreground/50 rounded-full" />
                        +{dayAppointments.length - 3} {dayAppointments.length - 3 === 1 ? 'atendimento' : 'atendimentos'}
                      </div>
                    )}
                  </div>
                </div>
              </DroppableTimeSlot>
            );
          })}
        </div>
        </div>
      </div>
    );
  };

  return (
    <DndContext 
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-1 sm:mb-2">Atendimentos</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Gerencie todos os seus atendimentos</p>
          </div>
        <div className="flex gap-2">
          <Popover open={filterOpen} onOpenChange={setFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2 h-10">
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Filtros</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Filtros</Label>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => {
                        setFilterStatus("all");
                        setFilterCustomer("all");
                        setFilterPaymentStatus("all");
                      }}
                    >
                      Limpar
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status do Atendimento</Label>
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
                  <Label className="text-xs text-muted-foreground">Status do Pagamento</Label>
                  <Select value={filterPaymentStatus} onValueChange={setFilterPaymentStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="paid">Pago</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Cliente</Label>
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
            <Button className="gap-2 h-10" disabled={isReadOnly}>
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Novo Agendamento</span>
              <span className="sm:hidden">Novo</span>
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
                <Popover open={customerSearchOpen} onOpenChange={setCustomerSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={customerSearchOpen}
                      className="w-full justify-between h-11"
                    >
                      {customerId
                        ? customers.find((customer) => customer.id === customerId)?.name
                        : "🔍 Buscar cliente por nome..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command shouldFilter>
                      <CommandInput placeholder="Digite para buscar cliente..." className="h-11" />
                      <CommandList>
                        <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                        <CommandGroup>
                          {customers.map((customer) => (
                            <CommandItem
                              key={customer.id}
                              value={customer.name}
                              keywords={[customer.name.toLowerCase()]}
                              onSelect={() => {
                                setCustomerId(customer.id);
                                setCustomerSearchOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  customerId === customer.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {customer.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
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
                <Input
                  id="duration"
                  type="number"
                  min="15"
                  max="480"
                  step="15"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="Ex: 60"
                  required
                />
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
                <Button type="submit" disabled={createAppointment.isPending || isReadOnly}>
                  {createAppointment.isPending ? "Criando..." : "Criar Agendamento"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Estatísticas e Legenda */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/30 dark:to-yellow-900/20 border-yellow-200 dark:border-yellow-800">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Próximos</p>
                <p className="text-xl sm:text-2xl font-bold text-yellow-900 dark:text-yellow-100">{appointmentStats.proximos}</p>
              </div>
              <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Em Breve</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-100">{appointmentStats.emBreve}</p>
              </div>
              <CalendarIcon className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20 border-green-200 dark:border-green-800">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Concluídos</p>
                <p className="text-xl sm:text-2xl font-bold text-green-900 dark:text-green-100">{appointmentStats.concluidos}</p>
              </div>
              <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/20 border-orange-200 dark:border-orange-800">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Atrasados</p>
                <p className="text-xl sm:text-2xl font-bold text-orange-900 dark:text-orange-100">{appointmentStats.atrasados}</p>
              </div>
              <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950/30 dark:to-slate-900/20 border-slate-200 dark:border-slate-800">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total</p>
                <p className="text-xl sm:text-2xl font-bold">{appointmentStats.total}</p>
              </div>
              <CalendarDays className="w-6 h-6 sm:w-8 sm:h-8 text-slate-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Legenda de Cores */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <h3 className="font-semibold text-sm mb-3">Legenda de Status</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded animate-pulse" />
              <span>Próximo (30min)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded" />
              <span>Em breve (2h)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded" />
              <span>Concluído</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-600 rounded animate-pulse" />
              <span>Atrasado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded" />
              <span>Cancelado</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <CardTitle className="text-xl sm:text-2xl">Calendário</CardTitle>
              <Tabs value={viewType} onValueChange={(v) => setViewType(v as "day" | "week" | "month")}>
                <TabsList className="h-9 grid grid-cols-3 w-full sm:w-auto">
                  <TabsTrigger value="day" className="text-xs sm:text-sm">Dia</TabsTrigger>
                  <TabsTrigger value="week" className="text-xs sm:text-sm">Semana</TabsTrigger>
                  <TabsTrigger value="month" className="text-xs sm:text-sm">Mês</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            <div className="flex items-center gap-2 justify-between sm:justify-start">
              <Button variant="outline" size="sm" onClick={handleToday} className="gap-1 sm:gap-2 h-9 px-2 sm:px-3">
                <CalendarIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">Hoje</span>
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
          
          <div className="flex items-center justify-center pt-2">
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold capitalize text-center">{getDateRangeText()}</h3>
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir agendamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O agendamento será permanentemente excluído do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteAppointmentMutation.mutate(deleteAppointmentId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Menu mobile para agendamentos */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="bottom" className="h-auto">
          <SheetHeader>
            <SheetTitle>{mobileSelectedAppointment?.title}</SheetTitle>
            <SheetDescription>
              {mobileSelectedAppointment?.customers?.name && (
                <div className="text-sm mt-1">Cliente: {mobileSelectedAppointment.customers.name}</div>
              )}
              {mobileSelectedAppointment && (
                <div className="text-sm">
                  {format(parseISO(mobileSelectedAppointment.start_time), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  {' - '}
                  {format(parseISO(mobileSelectedAppointment.end_time), "HH:mm")}
                </div>
              )}
            </SheetDescription>
          </SheetHeader>
          
          <div className="flex flex-col gap-3 mt-6 mb-4">
            <Button
              variant="outline"
              className="w-full justify-start gap-2 h-12"
              onClick={() => {
                if (mobileSelectedAppointment) {
                  setEditAppointmentId(mobileSelectedAppointment.id);
                  setEditDialogOpen(true);
                  setMobileMenuOpen(false);
                }
              }}
              disabled={isReadOnly}
            >
              <Pencil className="w-4 h-4" />
              Editar agendamento
            </Button>
            
            {mobileSelectedAppointment?.status !== "completed" && (
              <Button
                variant="default"
                className="w-full justify-start gap-2 h-12"
                onClick={() => {
                  if (mobileSelectedAppointment) {
                    setSelectedAppointment({ 
                      id: mobileSelectedAppointment.id, 
                      title: mobileSelectedAppointment.title 
                    });
                    setFinishDialogOpen(true);
                    setMobileMenuOpen(false);
                  }
                }}
                disabled={isReadOnly}
              >
                <CheckCircle className="w-4 h-4" />
                Finalizar agendamento
              </Button>
            )}
            
            <Button
              variant="destructive"
              className="w-full justify-start gap-2 h-12"
              onClick={() => {
                if (mobileSelectedAppointment) {
                  setDeleteAppointmentId(mobileSelectedAppointment.id);
                  setDeleteDialogOpen(true);
                  setMobileMenuOpen(false);
                }
              }}
              disabled={isReadOnly}
            >
              <Trash2 className="w-4 h-4" />
              Excluir agendamento
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
    
    <DragOverlay>
      {activeId && activeType === 'appointment' ? (
        <div className="bg-primary/30 border-l-4 border-primary p-2 rounded-md opacity-80 shadow-lg">
          <div className="font-semibold text-sm">Movendo atendamento...</div>
        </div>
      ) : activeId && activeType === 'task' ? (
        <div className="bg-orange-200 dark:bg-orange-900 border-l-4 border-orange-500 p-2 rounded-md opacity-80 shadow-lg">
          <div className="font-semibold text-sm">Movendo tarefa...</div>
        </div>
      ) : null}
    </DragOverlay>
  </DndContext>
  );
};

export default Agendamentos;
