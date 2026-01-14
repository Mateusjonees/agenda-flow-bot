import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface DaySchedule {
  isActive: boolean;
  startTime: string;
  endTime: string;
}

interface OperatingSettingsProps {
  user: any;
  settings: any;
  schedules: Record<number, DaySchedule>;
  setSchedules: (schedules: Record<number, DaySchedule>) => void;
  defaultSlotDuration: number;
  setDefaultSlotDuration: (value: number) => void;
  bufferTime: number;
  setBufferTime: (value: number) => void;
}

export const OperatingSettings = ({
  user,
  settings,
  schedules,
  setSchedules,
  defaultSlotDuration,
  setDefaultSlotDuration,
  bufferTime,
  setBufferTime,
}: OperatingSettingsProps) => {
  const queryClient = useQueryClient();

  const saveSettingsMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase.from("business_settings").upsert({
        user_id: user.id,
        default_slot_duration: defaultSlotDuration,
        buffer_time: bufferTime,
        profile_image_url: settings?.profile_image_url,
        business_name: settings?.business_name
      }, { onConflict: "user_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-settings"] });
    },
    onError: (error) => {
      console.error("Erro ao salvar:", error);
      throw error;
    }
  });

  const saveBusinessHoursMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Usuário não autenticado");

      await supabase.from("business_hours").delete().eq("user_id", user.id);

      const hoursToInsert = Object.entries(schedules).map(([day, schedule]) => ({
        user_id: user.id,
        day_of_week: Number(day),
        start_time: schedule.startTime,
        end_time: schedule.endTime,
        is_active: schedule.isActive
      }));
      const { error } = await supabase.from("business_hours").insert(hoursToInsert);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-hours"] });
    },
    onError: (error) => {
      console.error("Erro ao salvar horários:", error);
      throw error;
    }
  });

  const handleSave = async () => {
    try {
      await saveSettingsMutation.mutateAsync();
      await saveBusinessHoursMutation.mutateAsync();
      toast.success("Configurações de funcionamento salvas!");
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar configurações");
    }
  };

  const days = [
    { day: 1, name: "Segunda" },
    { day: 2, name: "Terça" },
    { day: 3, name: "Quarta" },
    { day: 4, name: "Quinta" },
    { day: 5, name: "Sexta" },
    { day: 6, name: "Sábado" },
    { day: 0, name: "Domingo" }
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Horário de Funcionamento</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Defina os horários de atendimento</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6">
          <div className="space-y-3">
            {days.map(({ day, name }) => (
              <div key={day} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <div className="flex items-center gap-2 min-w-[100px] sm:w-24">
                  <Switch
                    checked={schedules[day]?.isActive || false}
                    onCheckedChange={(checked) =>
                      setSchedules({
                        ...schedules,
                        [day]: { ...schedules[day], isActive: checked }
                      })
                    }
                  />
                  <p className="text-sm font-medium">{name}</p>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 flex-1 pl-8 sm:pl-0">
                  <Input
                    type="time"
                    value={schedules[day]?.startTime || "09:00"}
                    onChange={(e) =>
                      setSchedules({
                        ...schedules,
                        [day]: { ...schedules[day], startTime: e.target.value }
                      })
                    }
                    disabled={!schedules[day]?.isActive}
                    className="w-[100px] sm:w-32 text-xs sm:text-sm"
                  />
                  <span className="text-xs sm:text-sm text-muted-foreground">-</span>
                  <Input
                    type="time"
                    value={schedules[day]?.endTime || "18:00"}
                    onChange={(e) =>
                      setSchedules({
                        ...schedules,
                        [day]: { ...schedules[day], endTime: e.target.value }
                      })
                    }
                    disabled={!schedules[day]?.isActive}
                    className="w-[100px] sm:w-32 text-xs sm:text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Configurações de Agendamento</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Personalize como os agendamentos funcionam</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="slot-duration">Duração padrão (minutos)</Label>
              <Input
                id="slot-duration"
                type="number"
                value={defaultSlotDuration}
                onChange={(e) => setDefaultSlotDuration(Number(e.target.value))}
                min="15"
                max="240"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="buffer-time">Tempo entre agendamentos (minutos)</Label>
              <Input
                id="buffer-time"
                type="number"
                value={bufferTime}
                onChange={(e) => setBufferTime(Number(e.target.value))}
                min="0"
                max="60"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          className="gap-2"
          onClick={handleSave}
          disabled={saveSettingsMutation.isPending || saveBusinessHoursMutation.isPending}
        >
          <Save className="w-4 h-4" />
          {saveSettingsMutation.isPending || saveBusinessHoursMutation.isPending
            ? "Salvando..."
            : "Salvar Funcionamento"}
        </Button>
      </div>
    </div>
  );
};
