import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  parseISO,
  set,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScheduleAppointmentDialog } from "./ScheduleAppointmentDialog";
import { DndContext, DragOverlay, PointerSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { useDragDropAppointment } from "@/hooks/use-drag-drop-appointment";
import { DraggableAppointment } from "@/components/DraggableAppointment";
import { DroppableTimeSlot } from "@/components/DroppableTimeSlot";

interface Appointment {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  status: string;
  customers?: {
    name: string;
  };
  services?: {
    name: string;
    color: string;
  };
}

export const CalendarView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dayAppointments, setDayAppointments] = useState<Appointment[]>([]);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date; time: string } | null>(null);

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

  useEffect(() => {
    fetchMonthAppointments();
  }, [currentDate]);

  const fetchMonthAppointments = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);

    const { data, error } = await supabase
      .from("appointments")
      .select(`
        *,
        customers(name),
        services(name, color)
      `)
      .eq("user_id", user.id)
      .gte("start_time", monthStart.toISOString())
      .lte("start_time", monthEnd.toISOString())
      .order("start_time");

    if (!error && data) {
      setAppointments(data as Appointment[]);
    }
  };

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    const dayAppts = appointments.filter((apt) =>
      isSameDay(parseISO(apt.start_time), date)
    );
    setDayAppointments(dayAppts);
  };

  const handleTimeSlotClick = (date: Date, hour: number) => {
    const slotDate = set(date, { hours: hour, minutes: 0 });
    setSelectedSlot({ date: slotDate, time: format(slotDate, "HH:mm") });
    setScheduleDialogOpen(true);
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { locale: ptBR });
  const calendarEnd = endOfWeek(monthEnd, { locale: ptBR });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const getAppointmentsForDay = (date: Date) => {
    return appointments.filter((apt) =>
      isSameDay(parseISO(apt.start_time), date)
    );
  };

  return (
    <DndContext 
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">
                {format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleToday}>
                  Hoje
                </Button>
                <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {/* Header dos dias da semana */}
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-semibold text-muted-foreground py-2"
                >
                  {day}
                </div>
              ))}
              
              {/* Dias do mês */}
              {calendarDays.map((day, idx) => {
                const dayAppointments = getAppointmentsForDay(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isToday = isSameDay(day, new Date());
                const isSelected = selectedDate && isSameDay(day, selectedDate);

                return (
                  <DroppableTimeSlot
                    key={idx}
                    id={`calendar-${format(day, 'yyyy-MM-dd')}-9`}
                    date={day}
                    hour={9}
                    className={`
                      min-h-24 p-2 border rounded-lg cursor-pointer transition-all
                      ${!isCurrentMonth ? "bg-muted/30 text-muted-foreground" : "bg-background"}
                      ${isToday ? "border-primary border-2" : "border-border"}
                      ${isSelected ? "ring-2 ring-primary" : ""}
                      hover:bg-accent/50
                    `}
                  >
                    <div onClick={() => handleDayClick(day)}>
                      <div className={`text-sm font-medium mb-1 ${isToday ? "text-primary" : ""}`}>
                        {format(day, "d")}
                      </div>
                      <div className="space-y-1">
                        {dayAppointments.slice(0, 2).map((apt) => (
                          <DraggableAppointment
                            key={apt.id}
                            id={apt.id}
                            type="appointment"
                            currentStartTime={parseISO(apt.start_time)}
                            currentEndTime={parseISO(apt.end_time)}
                          >
                            <div
                              className="text-xs p-1 rounded truncate"
                              style={{
                                backgroundColor: apt.services?.color + "20" || "#3B82F620",
                                borderLeft: `3px solid ${apt.services?.color || "#3B82F6"}`,
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {format(parseISO(apt.start_time), "HH:mm")} - {apt.customers?.name || apt.title}
                            </div>
                          </DraggableAppointment>
                        ))}
                        {dayAppointments.length > 2 && (
                          <div className="text-xs text-muted-foreground">
                            +{dayAppointments.length - 2} mais
                          </div>
                        )}
                      </div>
                    </div>
                  </DroppableTimeSlot>
                );
              })}
            </div>
          </CardContent>
        </Card>

      {/* Dialog de detalhes do dia */}
      <Dialog open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDate && format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {dayAppointments.length === 0 ? (
              <div className="text-center py-8">
                <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum agendamento para este dia</p>
                <Button
                  className="mt-4"
                  onClick={() => {
                    if (selectedDate) {
                      setSelectedSlot({ date: selectedDate, time: "09:00" });
                      setScheduleDialogOpen(true);
                    }
                  }}
                >
                  Novo Agendamento
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {dayAppointments.map((apt) => (
                  <Card key={apt.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: apt.services?.color || "#3B82F6" }}
                            />
                            <span className="font-semibold">
                              {format(parseISO(apt.start_time), "HH:mm")} -{" "}
                              {format(parseISO(apt.end_time), "HH:mm")}
                            </span>
                          </div>
                          <p className="text-sm font-medium">{apt.customers?.name || "Cliente"}</p>
                          <p className="text-sm text-muted-foreground">{apt.title}</p>
                          {apt.services && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Serviço: {apt.services.name}
                            </p>
                          )}
                        </div>
                        <Badge
                          variant={
                            apt.status === "completed"
                              ? "default"
                              : apt.status === "cancelled"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {apt.status === "completed"
                            ? "Concluído"
                            : apt.status === "cancelled"
                            ? "Cancelado"
                            : "Agendado"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de novo agendamento */}
      <ScheduleAppointmentDialog
        open={scheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
        proposal={null}
        onSuccess={() => {
          fetchMonthAppointments();
          setSelectedSlot(null);
        }}
      />
      
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
    </div>
  </DndContext>
  );
};
