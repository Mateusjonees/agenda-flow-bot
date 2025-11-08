import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, isBefore, startOfDay } from 'date-fns';

interface DragData {
  id: string;
  type: 'appointment' | 'task';
  currentStartTime: Date;
  currentEndTime?: Date;
}

interface DropData {
  date: Date;
  hour: number;
}

export const useDragDropAppointment = () => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<'appointment' | 'task' | null>(null);
  const queryClient = useQueryClient();

  const handleDragStart = (event: any) => {
    const { active } = event;
    setActiveId(active.id);
    setActiveType(active.data.current?.type || null);
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      setActiveType(null);
      return;
    }

    const dragData: DragData = active.data.current;
    const dropData: DropData = over.data.current;

    if (!dragData || !dropData) {
      setActiveId(null);
      setActiveType(null);
      return;
    }

    // Calculate new date/time
    const newDate = new Date(dropData.date);
    newDate.setHours(dropData.hour, 0, 0, 0);

    // Validate: cannot move to past
    if (isBefore(startOfDay(newDate), startOfDay(new Date()))) {
      toast.error("⚠️ Não é possível mover para uma data passada");
      setActiveId(null);
      setActiveType(null);
      return;
    }

    // Calculate duration for appointments
    let newEndTime: Date | undefined;
    if (dragData.type === 'appointment' && dragData.currentEndTime) {
      const duration = dragData.currentEndTime.getTime() - dragData.currentStartTime.getTime();
      newEndTime = new Date(newDate.getTime() + duration);
    }

    try {
      // Update in database
      if (dragData.type === 'appointment') {
        const { error } = await supabase
          .from('appointments')
          .update({
            start_time: newDate.toISOString(),
            end_time: newEndTime?.toISOString(),
          })
          .eq('id', dragData.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('tasks')
          .update({
            due_date: newDate.toISOString(),
          })
          .eq('id', dragData.id);

        if (error) throw error;
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });

      // Show success message
      const itemName = dragData.type === 'appointment' ? 'Atendimento' : 'Tarefa';
      toast.success(`${itemName} movido para ${format(newDate, "dd/MM/yyyy 'às' HH:mm")}`);
    } catch (error) {
      console.error('Error moving item:', error);
      toast.error("Erro ao mover item. Tente novamente.");
    }

    setActiveId(null);
    setActiveType(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setActiveType(null);
  };

  return {
    activeId,
    activeType,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
  };
};
