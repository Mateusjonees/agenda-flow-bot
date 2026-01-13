import { useDroppable } from '@dnd-kit/core';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface DroppableTimeSlotProps {
  id: string;
  date: Date;
  hour: number;
  children: ReactNode;
  className?: string;
  onClick?: (date: Date, hour: number) => void;
}

export const DroppableTimeSlot = ({
  id,
  date,
  hour,
  children,
  className,
  onClick,
}: DroppableTimeSlotProps) => {
  const { isOver, setNodeRef } = useDroppable({
    id,
    data: {
      date,
      hour,
    },
  });

  const handleClick = (e: React.MouseEvent) => {
    // Only trigger if clicking directly on the slot, not on children
    if (e.target === e.currentTarget && onClick) {
      onClick(date, hour);
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'transition-all duration-200 cursor-pointer',
        isOver && 'bg-primary/10 border-2 border-primary border-dashed rounded-lg',
        className
      )}
      onClick={handleClick}
    >
      {children}
    </div>
  );
};
