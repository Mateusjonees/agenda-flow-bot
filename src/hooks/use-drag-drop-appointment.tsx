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
  date: Date | any;
  hour: number;
}

// Helper function to convert serialized dates back to Date objects
const convertToDate = (dateObj: any): Date => {
  if (dateObj instanceof Date) {
    return dateObj;
  }
  if (dateObj?._type === 'Date' && dateObj?.value?.iso) {
    return new Date(dateObj.value.iso);
  }
  if (typeof dateObj === 'string') {
    return new Date(dateObj);
  }
  return new Date(dateObj);
};

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

    // Convert serialized dates back to Date objects
    const convertedStartTime = convertToDate(dragData.currentStartTime);
    const convertedEndTime = dragData.currentEndTime ? convertToDate(dragData.currentEndTime) : undefined;
    const convertedDropDate = convertToDate(dropData.date);

    // Calculate new date/time
    const newDate = new Date(convertedDropDate);
    newDate.setHours(dropData.hour, 0, 0, 0);

    console.log('New date calculated:', newDate);
    console.log('Current date:', new Date());

    // Calculate duration for appointments
    let newEndTime: Date | undefined;
    if (dragData.type === 'appointment' && convertedEndTime) {
      const duration = convertedEndTime.getTime() - convertedStartTime.getTime();
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
