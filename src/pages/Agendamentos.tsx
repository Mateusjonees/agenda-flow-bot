import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useIsSmallScreen } from "@/hooks/use-small-screen";
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
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle, Pencil, Filter, Trash2, Check, ChevronsUpDown, List, CalendarDays, Clock, User, XCircle, AlertTriangle, FileText } from "lucide-react";
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
import { DayAppointmentsDialog } from "@/components/DayAppointmentsDialog";
import { AppointmentQuickSearch } from "@/components/AppointmentQuickSearch";
import { Search, Bell } from "lucide-react";
import { useAppointmentReminders } from "@/hooks/useAppointmentReminders";
import { useFacebookPixel } from "@/hooks/useFacebookPixel";

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
  const isMobile = useIsMobile();
  const isSmallScreen = useIsSmallScreen();
  const { isReadOnly } = useReadOnly();
  const { testNotification } = useAppointmentReminders();
  const { trackSchedule } = useFacebookPixel();
  const [open, setOpen] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [service, setService] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("60");
  const [notes, setNotes] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("calendar");
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
  const [dayDialogOpen, setDayDialogOpen] = useState(false);
  const [selectedDayDate, setSelectedDayDate] = useState<Date>(new Date());
  const [selectedDayAppointments, setSelectedDayAppointments] = useState<Appointment[]>([]);
  const [quickSearchOpen, setQuickSearchOpen] = useState(false);
  const [compactWeekSelectedDay, setCompactWeekSelectedDay] = useState<Date>(new Date());
  
  // Ctrl+K para busca rápida
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setQuickSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Filtros
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCustomer, setFilterCustomer] = useState<string>("all");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterDateStart, setFilterDateStart] = useState<string>("");
  const [filterDateEnd, setFilterDateEnd] = useState<string>("");
  
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

  // Buscar horários de funcionamento
  const { data: businessHours = [] } = useQuery({
    queryKey: ["business-hours"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data, error } = await supabase
        .from("business_hours")
        .select("*")
        .eq("user_id", user.id)
        .order("day_of_week");
      
      if (error) throw error;
      return data || [];
    },
  });

  // Verificar se um dia está ativo
  const isDayActive = (date: Date) => {
    const dayOfWeek = date.getDay();
    const dayConfig = businessHours.find(h => h.day_of_week === dayOfWeek);
    
    // Se não há NENHUMA configuração de horário, considerar todos os dias de seg-sex como ativos
    if (businessHours.length === 0) {
      return dayOfWeek >= 1 && dayOfWeek <= 5; // Seg a Sex
    }
    
    return dayConfig?.is_active ?? false;
  };

  // Obter horários de funcionamento de um dia específico
  const getDayHours = (date: Date) => {
    const dayOfWeek = date.getDay();
    const dayConfig = businessHours.find(h => h.day_of_week === dayOfWeek);
    
    // Se não tem configuração para este dia
    if (!dayConfig) {
      // Se não tem NENHUMA configuração de horário, usar padrão comercial
      if (businessHours.length === 0) {
        return {
          start: "08:00",
          end: "18:00",
        };
      }
      // Se tem configuração mas este dia não está configurado, retorna null
      return null;
    }
    
    // Se o dia está configurado mas não está ativo
    if (!dayConfig.is_active) {
      return null;
    }
    
    return {
      start: dayConfig.start_time,
      end: dayConfig.end_time,
    };
  };

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
    
    // Filtro de data personalizado
    if (filterDateStart) {
      const aptDate = parseISO(apt.start_time);
      const startDate = new Date(filterDateStart);
      startDate.setHours(0, 0, 0, 0);
      if (aptDate < startDate) return false;
    }
    if (filterDateEnd) {
      const aptDate = parseISO(apt.start_time);
      const endDate = new Date(filterDateEnd);
      endDate.setHours(23, 59, 59, 999);
      if (aptDate > endDate) return false;
    }
    
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      // Track schedule event for Facebook Pixel
      trackSchedule({
        content_name: data?.title || 'Appointment',
      });
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
    const today = currentDate;
    
    // Verificar se o dia está ativo
    const dayHours = getDayHours(today);
    
    if (!dayHours) {
      return (
        <div className="border rounded-lg overflow-hidden bg-card p-8 text-center">
          <CalendarIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Dia não disponível</h3>
          <p className="text-muted-foreground">
            {format(today, "EEEE", { locale: ptBR })} não está configurado como dia de funcionamento
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Vá em Configurações {'>'} Horário de Funcionamento para ativar este dia
          </p>
        </div>
      );
    }
    
    // Gerar horários baseados na configuração
    const [startHour] = dayHours.start.split(':').map(Number);
    const [endHour] = dayHours.end.split(':').map(Number);
    
    const dayAppointments = appointments.filter(apt => {
      const aptDate = parseISO(apt.start_time);
      return isSameDay(aptDate, currentDate);
    });
    
    const dayTasks = allTasks.filter(task => {
      const taskDate = parseISO(task.due_date);
      return isSameDay(taskDate, currentDate);
    });
    
    // Calcular o range de horas considerando agendamentos fora do horário de funcionamento
    const appointmentHours = dayAppointments.map(apt => parseISO(apt.start_time).getHours());
    const taskHours = dayTasks.map(task => parseISO(task.due_date).getHours());
    const allEventHours = [...appointmentHours, ...taskHours];
    
    // Expandir o range para incluir eventos fora do horário de funcionamento
    const minEventHour = allEventHours.length > 0 ? Math.min(...allEventHours) : startHour;
    const maxEventHour = allEventHours.length > 0 ? Math.max(...allEventHours) : endHour;
    
    const effectiveStartHour = Math.min(startHour, minEventHour);
    const effectiveEndHour = Math.max(endHour, maxEventHour);
    
    const hours = Array.from({ length: effectiveEndHour - effectiveStartHour + 1 }, (_, i) => effectiveStartHour + i);

    const currentHour = new Date().getHours();
    const currentMinute = new Date().getMinutes();
    const isCurrentDay = isSameDay(currentDate, new Date());
    
    return (
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-3 sm:p-4 border-b">
          <h3 className="font-semibold text-base sm:text-lg capitalize">{format(currentDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Funcionamento: {dayHours.start} - {dayHours.end}
          </p>
        </div>
        <div className="divide-y relative">
          {hours.map((hour) => {
            // Filtrar agendamentos para esta hora usando hora LOCAL
            const hourAppointments = dayAppointments.filter(apt => {
              const aptDate = parseISO(apt.start_time);
              // getHours() retorna hora LOCAL do navegador
              const aptHour = aptDate.getHours();
              return aptHour === hour;
            });
            
            // Filtrar tarefas para esta hora usando hora LOCAL
            const hourTasks = dayTasks.filter(task => {
              const taskDate = parseISO(task.due_date);
              const taskHour = taskDate.getHours();
              return taskHour === hour;
            });
            
            // Verificar se está dentro do horário de funcionamento
            const isWithinBusinessHours = hour >= startHour && hour < endHour;

            return (
              <DroppableTimeSlot
                key={hour}
                id={`day-${format(currentDate, 'yyyy-MM-dd')}-${hour}`}
                date={currentDate}
                hour={hour}
                className={cn(
                  "flex items-start p-2 sm:p-4 transition-colors min-h-[70px] sm:min-h-[90px] relative",
                  isWithinBusinessHours ? "hover:bg-muted/50" : "bg-muted/30"
                )}
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
    const allDays = eachDayOfInterval({ start, end });
    
    // Filtrar apenas dias ativos
    const activeDays = allDays.filter(day => isDayActive(day));
    
    if (activeDays.length === 0) {
      return (
        <div className="border rounded-lg overflow-hidden bg-card p-8 text-center">
          <CalendarIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum dia disponível</h3>
          <p className="text-muted-foreground">
            Não há dias de funcionamento configurados para esta semana
          </p>
        </div>
      );
    }
    
    // Determinar o horário mínimo e máximo entre todos os dias ativos
    let minHour = 24;
    let maxHour = -1;
    let hasBusinessHoursConfig = false;
    
    activeDays.forEach(day => {
      const dayHours = getDayHours(day);
      if (dayHours) {
        hasBusinessHoursConfig = true;
        const [startH] = dayHours.start.split(':').map(Number);
        const [endH] = dayHours.end.split(':').map(Number);
        minHour = Math.min(minHour, startH);
        maxHour = Math.max(maxHour, endH);
      }
    });
    
    // Se não há configuração de horário de funcionamento, usar horário comercial padrão
    if (!hasBusinessHoursConfig || minHour > maxHour) {
      minHour = 8;
      maxHour = 18;
    }
    
    // Considerar também os agendamentos que estão fora do horário de funcionamento
    const appointmentHours = appointments.map(apt => parseISO(apt.start_time).getHours());
    if (appointmentHours.length > 0) {
      minHour = Math.min(minHour, ...appointmentHours);
      maxHour = Math.max(maxHour, ...appointmentHours.map(h => h + 1)); // +1 para incluir a hora do agendamento
    }
    
    // Considerar também as tarefas
    const taskHours = allTasks.map(task => parseISO(task.due_date).getHours());
    if (taskHours.length > 0) {
      minHour = Math.min(minHour, ...taskHours);
      maxHour = Math.max(maxHour, ...taskHours.map(h => h + 1));
    }
    
    // Garantir que maxHour não ultrapasse 24
    maxHour = Math.min(maxHour, 24);
    
    const hours = Array.from({ length: maxHour - minHour }, (_, i) => minHour + i);

    // Mobile and Small Screen view - Compact Week with day selector
    if (isMobile || isSmallScreen) {
      // Get appointments for the selected day
      const selectedDayAppointments = appointments.filter(apt => 
        isSameDay(parseISO(apt.start_time), compactWeekSelectedDay)
      ).sort((a, b) => parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime());

      const selectedDayHours = getDayHours(compactWeekSelectedDay);
      const isSelectedToday = isSameDay(compactWeekSelectedDay, new Date());

      return (
        <div className="space-y-3">
          {/* Day selector chips - horizontal scroll */}
          <div className="flex gap-2 overflow-x-auto pb-2 px-1 -mx-1 scrollbar-hide">
            {activeDays.map((day) => {
              const isCurrentDay = isSameDay(day, new Date());
              const isSelected = isSameDay(day, compactWeekSelectedDay);
              const dayAppointmentsCount = appointments.filter(apt => 
                isSameDay(parseISO(apt.start_time), day)
              ).length;
              
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setCompactWeekSelectedDay(day)}
                  className={cn(
                    "flex flex-col items-center min-w-[56px] px-3 py-2 rounded-xl transition-all duration-200 border-2 flex-shrink-0",
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25"
                      : isCurrentDay
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "bg-card border-border hover:border-primary/30 hover:bg-accent/50"
                  )}
                >
                  <span className={cn(
                    "text-[10px] uppercase font-semibold tracking-wider",
                    isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                  )}>
                    {format(day, "EEE", { locale: ptBR })}
                  </span>
                  <span className={cn(
                    "text-lg font-bold",
                    isSelected ? "text-primary-foreground" : ""
                  )}>
                    {format(day, "dd")}
                  </span>
                  {dayAppointmentsCount > 0 && (
                    <div className={cn(
                      "w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center mt-1",
                      isSelected
                        ? "bg-white/20 text-primary-foreground"
                        : "bg-primary/15 text-primary"
                    )}>
                      {dayAppointmentsCount}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected day content */}
          <div className={cn(
            "rounded-2xl overflow-hidden bg-gradient-to-br from-card to-card/80 backdrop-blur-sm border border-border/50 shadow-lg transition-all duration-300",
            isSelectedToday && "ring-2 ring-primary/40 shadow-primary/10 shadow-xl"
          )}>
            {/* Day header */}
            <div className={cn(
              "p-4 flex items-center justify-between relative overflow-hidden",
              isSelectedToday 
                ? "bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" 
                : "bg-gradient-to-r from-muted/60 via-muted/30 to-transparent"
            )}>
              <div className="flex items-center gap-4 relative z-10">
                <div className={cn(
                  "flex items-center justify-center text-2xl font-bold transition-all duration-300",
                  isSelectedToday 
                    ? "w-12 h-12 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/30" 
                    : "w-12 h-12 rounded-xl bg-muted text-foreground"
                )}>
                  {format(compactWeekSelectedDay, "dd")}
                </div>
                <div>
                  <div className="font-bold text-lg capitalize text-foreground">
                    {format(compactWeekSelectedDay, "EEEE", { locale: ptBR })}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {format(compactWeekSelectedDay, "MMMM yyyy", { locale: ptBR })}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                {selectedDayHours && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5 bg-background/50 px-2 py-1 rounded-full backdrop-blur-sm">
                    <Clock className="w-3 h-3" />
                    {selectedDayHours.start} - {selectedDayHours.end}
                  </div>
                )}
                {selectedDayAppointments.length > 0 && (
                  <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors">
                    {selectedDayAppointments.length} {selectedDayAppointments.length === 1 ? 'evento' : 'eventos'}
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Appointments list */}
            <div className="p-3 space-y-2">
              {selectedDayAppointments.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-muted/50 flex items-center justify-center">
                    <CalendarIcon className="w-7 h-7 opacity-50" />
                  </div>
                  <p className="text-sm font-medium">Nenhum agendamento</p>
                  <p className="text-xs mt-1 opacity-70">Toque para agendar</p>
                </div>
              ) : (
                selectedDayAppointments.map((apt) => {
                  const statusConfig = {
                    confirmed: { bg: "from-emerald-500/15 to-emerald-500/5", border: "border-emerald-500/30", dot: "bg-emerald-500" },
                    pending: { bg: "from-amber-500/15 to-amber-500/5", border: "border-amber-500/30", dot: "bg-amber-500" },
                    cancelled: { bg: "from-red-500/15 to-red-500/5", border: "border-red-500/30", dot: "bg-red-500" },
                    completed: { bg: "from-violet-500/15 to-violet-500/5", border: "border-violet-500/30", dot: "bg-violet-500" }
                  };
                  const status = statusConfig[apt.status as keyof typeof statusConfig] || statusConfig.completed;
                  
                  return (
                    <div 
                      key={apt.id}
                      className={cn(
                        "p-4 rounded-xl flex items-center gap-4 transition-all duration-300 cursor-pointer",
                        "bg-gradient-to-r border backdrop-blur-sm",
                        "hover:shadow-md hover:scale-[1.01] active:scale-[0.99]",
                        status.bg, status.border
                      )}
                      onClick={() => {
                        setMobileSelectedAppointment(apt);
                        setMobileMenuOpen(true);
                      }}
                    >
                      {/* Time column */}
                      <div className="flex flex-col items-center min-w-[52px]">
                        <span className="text-lg font-bold text-foreground">{format(parseISO(apt.start_time), "HH:mm")}</span>
                        <span className="text-xs text-muted-foreground">{format(parseISO(apt.end_time), "HH:mm")}</span>
                      </div>
                      
                      {/* Divider with status dot */}
                      <div className="flex flex-col items-center gap-1 h-full">
                        <div className={cn("w-2.5 h-2.5 rounded-full shadow-lg", status.dot)} />
                        <div className="w-px flex-1 bg-border/50 min-h-[20px]" />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-foreground truncate">
                          {apt.title}
                        </div>
                        {apt.customers && (
                          <div className="flex items-center gap-1.5 text-muted-foreground text-sm mt-1">
                            <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
                              <User className="w-3 h-3" />
                            </div>
                            <span className="truncate">{apt.customers.name}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Arrow */}
                      <div className="w-8 h-8 rounded-full bg-background/80 flex items-center justify-center shadow-sm">
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      );
    }

    // Desktop view - horizontal grid
    return (
      <div className="border rounded-lg overflow-hidden bg-card shadow-sm w-full">
        {/* Cabeçalho dos dias */}
        <div 
          className="grid border-b bg-muted/50 sticky top-0 z-10"
          style={{ gridTemplateColumns: `40px repeat(${activeDays.length}, 1fr)` }}
        >
          <div className="p-1 border-r flex items-center justify-center">
            <Clock className="w-3 h-3 text-muted-foreground" />
          </div>
          {activeDays.map((day) => {
            const isCurrentDay = isSameDay(day, new Date());
            const dayAppointmentsCount = appointments.filter(apt => 
              isSameDay(parseISO(apt.start_time), day)
            ).length;
            
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "py-2 px-1 border-l text-center transition-all",
                  isCurrentDay ? "bg-primary/10" : "hover:bg-accent/5"
                )}
              >
                <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
                  {format(day, "EEE", { locale: ptBR })}
                </div>
                <div className={cn(
                  "flex items-center justify-center mt-0.5"
                )}>
                  <div className={cn(
                    "text-sm font-bold",
                    isCurrentDay && "w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs"
                  )}>
                    {format(day, "dd")}
                  </div>
                </div>
                {dayAppointmentsCount > 0 && (
                  <div className="flex justify-center mt-1">
                    <div className="w-4 h-4 rounded-full bg-primary/20 text-primary text-[9px] font-bold flex items-center justify-center">
                      {dayAppointmentsCount}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Grid de horários */}
        <div className="divide-y">
          {hours.map((hour) => (
            <div 
              key={hour} 
              className="grid"
              style={{ gridTemplateColumns: `40px repeat(${activeDays.length}, 1fr)` }}
            >
              <div className="p-1 text-[10px] text-muted-foreground border-r font-medium bg-muted/20 h-[60px] flex items-start justify-center">
                {String(hour).padStart(2, "0")}h
              </div>
              {activeDays.map((day) => {
                const isCurrentDay = isSameDay(day, new Date());
                const dayHours = getDayHours(day);
                
                const isWithinBusinessHours = dayHours && (() => {
                  const [startHour] = dayHours.start.split(':').map(Number);
                  const [endHour] = dayHours.end.split(':').map(Number);
                  return hour >= startHour && hour < endHour;
                })();
                
                const dayHourAppointments = appointments.filter(apt => {
                  const aptDate = parseISO(apt.start_time);
                  const aptHour = aptDate.getHours();
                  return isSameDay(aptDate, day) && aptHour === hour;
                });

                const statusConfig: Record<string, { bg: string; border: string; text: string }> = {
                  scheduled: { bg: "bg-blue-500/10", border: "border-l-blue-500", text: "text-blue-700 dark:text-blue-300" },
                  confirmed: { bg: "bg-emerald-500/10", border: "border-l-emerald-500", text: "text-emerald-700 dark:text-emerald-300" },
                  pending: { bg: "bg-amber-500/10", border: "border-l-amber-500", text: "text-amber-700 dark:text-amber-300" },
                  cancelled: { bg: "bg-red-500/10", border: "border-l-red-500", text: "text-red-700 dark:text-red-300" },
                  completed: { bg: "bg-violet-500/10", border: "border-l-violet-500", text: "text-violet-700 dark:text-violet-300" }
                };
                
                const maxVisible = 3;
                const hasMore = dayHourAppointments.length > maxVisible;
                const visibleAppointments = dayHourAppointments.slice(0, maxVisible);

                return (
                  <DroppableTimeSlot
                    key={`${day.toISOString()}-${hour}`}
                    id={`week-${format(day, 'yyyy-MM-dd')}-${hour}`}
                    date={day}
                    hour={hour}
                    className={cn(
                      "p-0.5 border-l transition-colors h-[100px] overflow-hidden",
                      isWithinBusinessHours ? "hover:bg-accent/5" : "bg-muted/30",
                      isCurrentDay && isWithinBusinessHours && "bg-primary/5"
                    )}
                  >
                    <div className="flex flex-col gap-0.5 h-full overflow-hidden">
                      {visibleAppointments.map((apt) => {
                        const status = statusConfig[apt.status || "scheduled"] || statusConfig.scheduled;
                        
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
                                "rounded cursor-pointer transition-all duration-200",
                                "border-l-2 px-1 py-0.5",
                                "hover:shadow-md hover:scale-[1.02]",
                                status.bg, status.border
                              )}
                              onClick={(e) => {
                                e.stopPropagation();
                                setMobileSelectedAppointment(apt);
                                setMobileMenuOpen(true);
                              }}
                              title={`${format(parseISO(apt.start_time), "HH:mm")} - ${apt.title}${apt.customers?.name ? ` (${apt.customers.name})` : ''}`}
                            >
                              <div className="flex items-center gap-1">
                                <span className={cn("text-[10px] font-bold", status.text)}>
                                  {format(parseISO(apt.start_time), "HH:mm")}
                                </span>
                                <span className="text-[10px] font-medium text-foreground truncate leading-tight">
                                  {apt.customers?.name || apt.title}
                                </span>
                              </div>
                            </div>
                          </DraggableAppointment>
                        );
                      })}
                      {hasMore && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDayDate(day);
                            setSelectedDayAppointments(appointments.filter(apt => 
                              isSameDay(parseISO(apt.start_time), day)
                            ));
                            setDayDialogOpen(true);
                          }}
                          className="text-[10px] font-semibold text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20 rounded px-1.5 py-0.5 transition-colors text-center"
                        >
                          +{dayHourAppointments.length - maxVisible} mais
                        </button>
                      )}
                    </div>
                  </DroppableTimeSlot>
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

    // Obter dias ativos da configuração do usuário
    const activeDayNumbers = businessHours
      .filter(h => h.is_active)
      .map(h => h.day_of_week);
    
    // Dias da semana filtrados
    const allDaysOfWeek = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
    const activeDaysOfWeek = allDaysOfWeek.filter((_, idx) => activeDayNumbers.includes(idx));
    
    // Filtrar dias do mês para mostrar apenas os dias ativos
    const filteredDays = allDays.filter(day => activeDayNumbers.includes(day.getDay()));
    
    // Definir número de colunas baseado nos dias ativos
    const gridCols = activeDayNumbers.length || 7;
    const gridColsClass = {
      1: "grid-cols-1",
      2: "grid-cols-2",
      3: "grid-cols-3",
      4: "grid-cols-4",
      5: "grid-cols-5",
      6: "grid-cols-6",
      7: "grid-cols-7"
    }[gridCols] || "grid-cols-7";

    return (
      <div className="overflow-hidden rounded-lg border">
        {/* Cabeçalho dos dias da semana - apenas dias ativos */}
        <div className={cn("grid bg-muted/50 border-b", gridColsClass)}>
          {activeDaysOfWeek.map((day) => (
            <div key={day} className="p-3 text-center border-l first:border-l-0 border-border">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {day.slice(0, 3)}
              </div>
            </div>
          ))}
        </div>
        
        {/* Grid de dias - apenas dias ativos */}
        <div className={cn("grid bg-background", gridColsClass)}>
          {filteredDays.map((day, idx) => {
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
                  "min-h-[110px] sm:min-h-[140px] p-2 border-b border-l first:border-l-0",
                  "relative group transition-colors",
                  "bg-card hover:bg-accent/5",
                  !isCurrentMonth && "opacity-60",
                  isCurrentDay && "bg-primary/5 ring-2 ring-primary/30"
                )}
              >
                {/* Número do dia - estilo Google Calendar */}
                <div className="flex items-center justify-center mb-2">
                  <div
                    className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all",
                      isCurrentDay && "bg-primary text-primary-foreground shadow-sm",
                      !isCurrentDay && !isCurrentMonth && "text-muted-foreground/50",
                      !isCurrentDay && isCurrentMonth && "text-foreground hover:bg-muted/50"
                    )}
                  >
                    {format(day, "d")}
                  </div>
                </div>
                
                {/* Indicador de agendamentos no topo */}
                {hasAppointments && (
                  <div className="absolute top-2 right-2">
                    <div className="w-2 h-2 rounded-full bg-primary shadow-sm" />
                  </div>
                )}
                
                {/* Lista de agendamentos - estilo Google Calendar */}
                <div className="space-y-1 overflow-hidden">
                  {dayAppointments.slice(0, 3).map((apt) => {
                    const statusColors = {
                      confirmed: "hsl(142 71% 45%)",
                      pending: "hsl(48 96% 53%)",
                      cancelled: "hsl(0 84% 60%)",
                      completed: "hsl(271 81% 56%)"
                    };
                    
                    const borderColor = statusColors[apt.status as keyof typeof statusColors] || statusColors.completed;
                    
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
                             "group/card relative px-2 py-1.5 rounded-md cursor-pointer border-l-[3px]",
                             "transition-all duration-200 hover:shadow-md hover:scale-[1.02] hover:z-10",
                             "bg-card hover:bg-accent/10"
                           )}
                          style={{ borderLeftColor: borderColor }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setMobileSelectedAppointment(apt);
                            setMobileMenuOpen(true);
                          }}
                        >
                          {/* Horário e título */}
                          <div className="flex items-start gap-1.5">
                            <span className="text-[10px] sm:text-xs font-bold shrink-0 mt-0.5 text-foreground">
                              {format(parseISO(apt.start_time), "HH:mm")}
                            </span>
                            <span className="text-[10px] sm:text-xs font-medium truncate flex-1 text-foreground/90">
                              {apt.title}
                            </span>
                          </div>
                          
                          {/* Cliente (apenas desktop) */}
                          <div className="hidden sm:flex items-center gap-1 mt-0.5 text-[9px] text-muted-foreground">
                            <User className="w-2.5 h-2.5" />
                            <span className="truncate">{apt.customers?.name}</span>
                          </div>
                        </div>
                      </DraggableAppointment>
                    );
                  })}
                  
                  {/* Indicador de mais agendamentos */}
                  {dayAppointments.length > 3 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDayDate(day);
                        setSelectedDayAppointments(dayAppointments);
                        setDayDialogOpen(true);
                      }}
                      className="w-full text-[10px] text-primary font-semibold py-1 px-2 rounded bg-primary/10 hover:bg-primary/20 transition-colors text-center"
                    >
                      +{dayAppointments.length - 3} {dayAppointments.length - 3 === 1 ? 'mais' : 'mais'}
                    </button>
                  )}
                </div>
              </DroppableTimeSlot>
            );
          })}
        </div>
      </div>
    );
  };

  const renderListView = () => {
    const sortedAppointments = [...appointments].sort((a, b) => 
      parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime()
    );

    const handleQuickDateFilter = (period: string) => {
      const today = new Date();
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      switch (period) {
        case "today":
          setFilterDateStart(format(startOfToday, "yyyy-MM-dd"));
          setFilterDateEnd(format(startOfToday, "yyyy-MM-dd"));
          break;
        case "week":
          const weekStart = startOfWeek(today, { weekStartsOn: 0 });
          const weekEnd = endOfWeek(today, { weekStartsOn: 0 });
          setFilterDateStart(format(weekStart, "yyyy-MM-dd"));
          setFilterDateEnd(format(weekEnd, "yyyy-MM-dd"));
          break;
        case "month":
          const monthStart = startOfMonth(today);
          const monthEnd = endOfMonth(today);
          setFilterDateStart(format(monthStart, "yyyy-MM-dd"));
          setFilterDateEnd(format(monthEnd, "yyyy-MM-dd"));
          break;
        case "7days":
          setFilterDateStart(format(addDays(today, -7), "yyyy-MM-dd"));
          setFilterDateEnd(format(today, "yyyy-MM-dd"));
          break;
        case "30days":
          setFilterDateStart(format(addDays(today, -30), "yyyy-MM-dd"));
          setFilterDateEnd(format(today, "yyyy-MM-dd"));
          break;
      }
    };

    return (
      <div className="space-y-4">
        {/* Filtros de Data */}
        <Card>
          <CardContent className="p-4 space-y-4">
            {/* Atalhos de Período */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Períodos Rápidos</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickDateFilter("today")}
                  className="text-xs"
                >
                  Hoje
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickDateFilter("week")}
                  className="text-xs"
                >
                  Esta Semana
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickDateFilter("month")}
                  className="text-xs"
                >
                  Este Mês
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickDateFilter("7days")}
                  className="text-xs"
                >
                  Últimos 7 Dias
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickDateFilter("30days")}
                  className="text-xs"
                >
                  Últimos 30 Dias
                </Button>
              </div>
            </div>

            {/* Filtros Personalizados */}
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 space-y-2">
                <Label htmlFor="filter-date-start" className="text-sm font-medium">
                  Data Início
                </Label>
                <Input
                  id="filter-date-start"
                  type="date"
                  value={filterDateStart}
                  onChange={(e) => setFilterDateStart(e.target.value)}
                  className="h-10"
                />
              </div>
              
              <div className="flex-1 space-y-2">
                <Label htmlFor="filter-date-end" className="text-sm font-medium">
                  Data Fim
                </Label>
                <Input
                  id="filter-date-end"
                  type="date"
                  value={filterDateEnd}
                  onChange={(e) => setFilterDateEnd(e.target.value)}
                  className="h-10"
                />
              </div>
              
              <Button
                variant="outline"
                onClick={() => {
                  setFilterDateStart("");
                  setFilterDateEnd("");
                }}
                className="h-10 gap-2"
              >
                <XCircle className="w-4 h-4" />
                Limpar Datas
              </Button>
            </div>
            
            {(filterDateStart || filterDateEnd) && (
              <div className="flex items-center justify-between p-3 bg-primary/5 rounded-md border border-primary/20">
                <div className="text-sm font-medium text-primary">
                  <span className="font-bold">{sortedAppointments.length}</span> agendamento(s) encontrado(s)
                  {filterDateStart && filterDateEnd && ` entre ${format(new Date(filterDateStart), "dd/MM/yyyy")} e ${format(new Date(filterDateEnd), "dd/MM/yyyy")}`}
                  {filterDateStart && !filterDateEnd && ` a partir de ${format(new Date(filterDateStart), "dd/MM/yyyy")}`}
                  {!filterDateStart && filterDateEnd && ` até ${format(new Date(filterDateEnd), "dd/MM/yyyy")}`}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lista de Agendamentos */}
        {sortedAppointments.length === 0 ? (
          <div className="text-center py-12">
            <CalendarIcon className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Nenhum agendamento encontrado</p>
            {(filterDateStart || filterDateEnd) && (
              <Button
                variant="link"
                onClick={() => {
                  setFilterDateStart("");
                  setFilterDateEnd("");
                }}
                className="mt-2"
              >
                Limpar filtros de data
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
        {sortedAppointments.map((apt) => {
          const statusColors = {
            scheduled: "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20",
            pending: "border-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20",
            cancelled: "border-red-500 bg-red-50/50 dark:bg-red-950/20",
            completed: "border-green-500 bg-green-50/50 dark:bg-green-950/20"
          };
          
          const borderColor = statusColors[apt.status as keyof typeof statusColors] || statusColors.scheduled;
          
          return (
            <Card key={apt.id} className={cn("border-l-4 hover:shadow-md transition-all", borderColor)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="font-bold">
                        {format(parseISO(apt.start_time), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {apt.status === "completed" ? "Concluído" :
                         apt.status === "cancelled" ? "Cancelado" :
                         apt.status === "pending" ? "Pendente" : "Confirmado"}
                      </Badge>
                    </div>
                    
                    <div className="text-lg font-semibold">{apt.title}</div>
                    
                    {apt.customers && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="w-4 h-4" />
                        <span>{apt.customers.name}</span>
                      </div>
                    )}
                    
                    {apt.description && (
                      <p className="text-sm text-muted-foreground">{apt.description}</p>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditAppointmentId(apt.id);
                        setEditDialogOpen(true);
                      }}
                      disabled={isReadOnly}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    
                    {apt.status !== "completed" && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => {
                          setSelectedAppointment({ id: apt.id, title: apt.title });
                          setFinishDialogOpen(true);
                        }}
                        disabled={isReadOnly}
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        setDeleteAppointmentId(apt.id);
                        setDeleteDialogOpen(true);
                      }}
                      disabled={isReadOnly}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
          </div>
        )}
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
          <Button 
            variant="outline" 
            className="gap-2 h-10"
            onClick={() => setQuickSearchOpen(true)}
          >
            <Search className="w-4 h-4" />
            <span className="hidden md:inline">Buscar</span>
            <kbd className="hidden md:inline pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 ml-2">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
          <Button 
            variant="outline" 
            className="gap-2 h-10"
            onClick={testNotification}
            title="Testar notificações de lembrete"
          >
            <Bell className="w-4 h-4" />
            <span className="hidden md:inline">Notificações</span>
          </Button>
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
              <CardTitle className="text-xl sm:text-2xl">Visualização</CardTitle>
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "list" | "calendar")}>
                <TabsList className="h-9 grid grid-cols-2 w-full sm:w-auto">
                  <TabsTrigger value="list" className="text-xs sm:text-sm gap-1.5">
                    <List className="w-3 h-3" />
                    Lista
                  </TabsTrigger>
                  <TabsTrigger value="calendar" className="text-xs sm:text-sm gap-1.5">
                    <CalendarDays className="w-3 h-3" />
                    Calendário
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              {viewMode === "calendar" && (
                <Tabs value={viewType} onValueChange={(v) => setViewType(v as "day" | "week" | "month")}>
                  <TabsList className="h-9 grid grid-cols-3 w-full sm:w-auto">
                    <TabsTrigger value="day" className="text-xs sm:text-sm">Dia</TabsTrigger>
                    <TabsTrigger value="week" className="text-xs sm:text-sm">Semana</TabsTrigger>
                    <TabsTrigger value="month" className="text-xs sm:text-sm">Mês</TabsTrigger>
                  </TabsList>
                </Tabs>
              )}
            </div>
            
            {viewMode === "calendar" && (
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
            )}
          </div>
          
          {viewMode === "calendar" && (
            <div className="flex items-center justify-center pt-2">
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold capitalize text-center">{getDateRangeText()}</h3>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Carregando atendimentos...</div>
            </div>
          ) : (
            <>
              {viewMode === "list" && renderListView()}
              {viewMode === "calendar" && (
                <>
                  {viewType === "day" && renderDayView()}
                  {viewType === "week" && renderWeekView()}
                  {viewType === "month" && renderMonthView()}
                </>
              )}
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

      {/* Menu mobile para agendamentos - Simplificado */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl p-4 pb-6">
          {mobileSelectedAppointment && (
            <div className="space-y-4">
              {/* Linha principal com info essencial */}
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 text-center">
                  <div className="text-lg font-bold text-foreground">
                    {format(parseISO(mobileSelectedAppointment.start_time), "HH:mm")}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(parseISO(mobileSelectedAppointment.end_time), "HH:mm")}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">
                    {mobileSelectedAppointment.title}
                  </h3>
                  {mobileSelectedAppointment.customers?.name && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                      <User className="w-3.5 h-3.5" />
                      <span className="truncate">{mobileSelectedAppointment.customers.name}</span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(parseISO(mobileSelectedAppointment.start_time), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                  </p>
                </div>
                
                <Badge 
                  className={cn(
                    "flex-shrink-0",
                    mobileSelectedAppointment.status === "completed" && "bg-green-500 hover:bg-green-600",
                    mobileSelectedAppointment.status === "cancelled" && "bg-red-500 hover:bg-red-600",
                    mobileSelectedAppointment.status === "scheduled" && "bg-blue-500 hover:bg-blue-600"
                  )}
                >
                  {mobileSelectedAppointment.status === "completed" ? "Concluído" 
                    : mobileSelectedAppointment.status === "cancelled" ? "Cancelado" 
                    : "Agendado"}
                </Badge>
              </div>
              
              {/* Botões de ação - grid horizontal */}
              <div className="grid grid-cols-2 gap-2">
                {mobileSelectedAppointment.status !== "completed" && (
                  <Button
                    size="sm"
                    className="h-10 bg-green-600 hover:bg-green-700 text-white gap-1.5"
                    onClick={() => {
                      setSelectedAppointment({ 
                        id: mobileSelectedAppointment.id, 
                        title: mobileSelectedAppointment.title 
                      });
                      setFinishDialogOpen(true);
                      setMobileMenuOpen(false);
                    }}
                    disabled={isReadOnly}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Finalizar
                  </Button>
                )}
                
                <Button
                  size="sm"
                  variant="outline"
                  className="h-10 gap-1.5"
                  onClick={() => {
                    setEditAppointmentId(mobileSelectedAppointment.id);
                    setEditDialogOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  disabled={isReadOnly}
                >
                  <Pencil className="w-4 h-4" />
                  Editar
                </Button>
                
                {mobileSelectedAppointment.status !== "cancelled" && mobileSelectedAppointment.status !== "completed" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-10 gap-1.5 text-orange-600 border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-950/30"
                    onClick={() => {
                      // Cancelar via mutation se necessário - por ora abre edição
                      setEditAppointmentId(mobileSelectedAppointment.id);
                      setEditDialogOpen(true);
                      setMobileMenuOpen(false);
                    }}
                    disabled={isReadOnly}
                  >
                    <XCircle className="w-4 h-4" />
                    Cancelar
                  </Button>
                )}
                
                <Button
                  size="sm"
                  variant="outline"
                  className="h-10 gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={() => {
                    setDeleteAppointmentId(mobileSelectedAppointment.id);
                    setDeleteDialogOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  disabled={isReadOnly}
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
      
      {/* Dialog para ver todos os agendamentos do dia */}
      <DayAppointmentsDialog
        open={dayDialogOpen}
        onOpenChange={setDayDialogOpen}
        date={selectedDayDate}
        appointments={selectedDayAppointments}
        onEdit={(appointmentId) => {
          setEditAppointmentId(appointmentId);
          setEditDialogOpen(true);
          setDayDialogOpen(false);
        }}
        onFinish={(appointment) => {
          setSelectedAppointment(appointment);
          setFinishDialogOpen(true);
          setDayDialogOpen(false);
        }}
        onDelete={(appointmentId) => {
          setDeleteAppointmentId(appointmentId);
          setDeleteDialogOpen(true);
          setDayDialogOpen(false);
        }}
      />
      
      {/* Busca Rápida com Ctrl+K */}
      <AppointmentQuickSearch
        open={quickSearchOpen}
        onOpenChange={setQuickSearchOpen}
        onSelectAppointment={(appointmentId) => {
          setEditAppointmentId(appointmentId);
          setEditDialogOpen(true);
        }}
      />
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
