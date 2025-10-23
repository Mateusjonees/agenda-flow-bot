import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { format, addDays, addWeeks, addMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

const Agendamentos = () => {
  const [open, setOpen] = useState(false);
  const [clientName, setClientName] = useState("");
  const [service, setService] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [viewType, setViewType] = useState<"day" | "week" | "month">("week");
  const [currentDate, setCurrentDate] = useState(new Date());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientName || !service || !date || !time) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    toast.success("Agendamento criado com sucesso!");
    setOpen(false);
    
    // Limpar formulário
    setClientName("");
    setService("");
    setDate("");
    setTime("");
    setNotes("");
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
    const hours = Array.from({ length: 14 }, (_, i) => i + 8); // 8h às 21h
    
    return (
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-muted p-4 border-b">
          <h3 className="font-semibold">{format(currentDate, "EEEE", { locale: ptBR })}</h3>
        </div>
        <div className="divide-y">
          {hours.map((hour) => (
            <div key={hour} className="flex items-center p-4 hover:bg-muted/50 transition-colors">
              <div className="w-20 text-sm text-muted-foreground">
                {String(hour).padStart(2, "0")}:00
              </div>
              <div className="flex-1 min-h-[40px] text-sm text-muted-foreground">
                Disponível
              </div>
            </div>
          ))}
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
        <div className="grid grid-cols-8 border-b bg-muted">
          <div className="p-3"></div>
          {days.map((day) => (
            <div
              key={day.toISOString()}
              className={`p-3 text-center border-l ${
                isSameDay(day, new Date()) ? "bg-primary/10" : ""
              }`}
            >
              <div className="text-xs text-muted-foreground">
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
        <div className="divide-y">
          {hours.map((hour) => (
            <div key={hour} className="grid grid-cols-8">
              <div className="p-3 text-sm text-muted-foreground border-r">
                {String(hour).padStart(2, "0")}:00
              </div>
              {days.map((day) => (
                <div
                  key={`${day.toISOString()}-${hour}`}
                  className="p-3 border-l hover:bg-muted/50 transition-colors min-h-[60px]"
                ></div>
              ))}
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
    
    // Preencher início do mês
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
            
            return (
              <div
                key={idx}
                className={`min-h-[100px] p-3 border-b border-l first:border-l-0 hover:bg-muted/50 transition-colors ${
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
          <h1 className="text-4xl font-bold text-foreground mb-2">Agendamentos</h1>
          <p className="text-muted-foreground">Gerencie todos os seus agendamentos</p>
        </div>
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
                <Label htmlFor="client">Cliente *</Label>
                <Input
                  id="client"
                  placeholder="Nome do cliente"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  required
                />
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
                <Button type="submit">
                  Criar Agendamento
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Calendário de Agendamentos</CardTitle>
            <Tabs value={viewType} onValueChange={(v) => setViewType(v as "day" | "week" | "month")}>
              <TabsList>
                <TabsTrigger value="day">Dia</TabsTrigger>
                <TabsTrigger value="week">Semana</TabsTrigger>
                <TabsTrigger value="month">Mês</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handlePrevious}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleNext}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" onClick={handleToday} className="gap-2">
                <CalendarIcon className="w-4 h-4" />
                Hoje
              </Button>
            </div>
            <h3 className="text-lg font-semibold capitalize">{getDateRangeText()}</h3>
          </div>
        </CardHeader>
        <CardContent>
          {viewType === "day" && renderDayView()}
          {viewType === "week" && renderWeekView()}
          {viewType === "month" && renderMonthView()}
        </CardContent>
      </Card>
    </div>
  );
};

export default Agendamentos;
