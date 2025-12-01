import { useDroppable } from '@dnd-kit/core';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface DroppableTimeSlotProps {
  id: string;
  date: Date;
  hour: number;
  children: ReactNode;
  className?: string;
}

export const DroppableTimeSlot = ({
  id,
  date,
  hour,
  children,
  className,
}: DroppableTimeSlotProps) => {
  const { isOver, setNodeRef } = useDroppable({
    id,
    data: {
      date,
      hour,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'transition-all duration-200',
        isOver && 'bg-primary/10 border-2 border-primary border-dashed rounded-lg',
        className
      )}
    >
      {children}
    </div>
  );
};
