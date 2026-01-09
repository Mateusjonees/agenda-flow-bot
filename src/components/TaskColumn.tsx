import { useDroppable } from "@dnd-kit/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface TaskColumnProps {
  id: string;
  title: string;
  icon: ReactNode;
  count: number;
  children: ReactNode;
  onAddTask?: () => void;
  isReadOnly?: boolean;
  accentColor?: string;
}

// Mapeamento de cores para dots
const getColumnDotColor = (id: string) => {
  switch (id) {
    case "pending":
      return "bg-yellow-500";
    case "in_progress":
      return "bg-blue-500";
    case "completed":
      return "bg-green-500";
    default:
      return "bg-slate-400";
  }
};

export const TaskColumn = ({
  id,
  title,
  icon,
  count,
  children,
  onAddTask,
  isReadOnly,
}: TaskColumnProps) => {
  const { isOver, setNodeRef } = useDroppable({
    id,
    data: {
      status: id,
    },
  });

  return (
    <Card 
      className={cn(
        "flex flex-col h-full bg-muted/30 dark:bg-slate-900/50 rounded-2xl border-0 shadow-sm",
        "transition-all duration-300",
        isOver && "ring-2 ring-primary/50 bg-primary/5"
      )}
    >
      <CardHeader className="pb-3 border-b border-border/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Dot colorido em vez de ícone */}
            <span className={cn("w-3 h-3 rounded-full", getColumnDotColor(id))} />
            
            <CardTitle className="text-base font-semibold text-foreground">
              {title}
            </CardTitle>
            
            {/* Counter com estilo pill */}
            <span className="text-xs font-medium text-muted-foreground bg-background/80 px-2.5 py-1 rounded-full">
              {count}
            </span>
          </div>
          
          {onAddTask && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-full hover:bg-background/80"
              onClick={onAddTask}
              disabled={isReadOnly}
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent
        ref={setNodeRef}
        className={cn(
          "flex-1 p-3 space-y-3 overflow-y-auto min-h-[400px]",
          "transition-colors duration-200",
          isOver && "bg-primary/5"
        )}
      >
        {children}
      </CardContent>
    </Card>
  );
};
