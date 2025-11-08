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
    console.log('Drag start - active:', active);
    console.log('Drag start - active.data.current:', active.data.current);
    setActiveId(active.id);
    setActiveType(active.data.current?.type || null);
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;

    console.log('Drag end - active:', active);
    console.log('Drag end - over:', over);

    if (!over) {
      console.log('No drop target');
      setActiveId(null);
      setActiveType(null);
      return;
    }

    const dragData: DragData = active.data.current;
    const dropData: DropData = over.data.current;

    console.log('Drag data:', dragData);
    console.log('Drop data:', dropData);

    if (!dragData || !dropData) {
      console.log('Missing drag or drop data');
      setActiveId(null);
      setActiveType(null);
      return;
    }

    if (!dragData.id) {
      console.error('Missing ID in drag data:', dragData);
      toast.error("Erro: ID do item não encontrado");
      setActiveId(null);
      setActiveType(null);
      return;
    }

    // Calculate new date/time
    const newDate = new Date(dropData.date);
    newDate.setHours(dropData.hour, 0, 0, 0);

    console.log('New date calculated:', newDate);
    console.log('Current date:', new Date());

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

    console.log('Attempting to update:', {
      id: dragData.id,
      type: dragData.type,
      newStartTime: newDate.toISOString(),
      newEndTime: newEndTime?.toISOString(),
    });

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
      queryClient.invalidateQueries({ queryKey: ['tasks-calendar'] });

      // Show success message
      const itemName = dragData.type === 'appointment' ? 'Atendamento' : 'Tarefa';
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
