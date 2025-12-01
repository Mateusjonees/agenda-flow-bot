import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { ReactNode } from 'react';

interface DraggableAppointmentProps {
  id: string;
  type: 'appointment' | 'task';
  currentStartTime: Date;
  currentEndTime?: Date;
  children: ReactNode;
}

export const DraggableAppointment = ({
  id,
  type,
  currentStartTime,
  currentEndTime,
  children,
}: DraggableAppointmentProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    data: {
      id,
      type,
      currentStartTime,
      currentEndTime,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
    touchAction: 'none',
    transition: 'opacity 200ms ease, transform 200ms ease',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={isDragging ? 'shadow-lg scale-105' : ''}
    >
      {children}
    </div>
  );
};
