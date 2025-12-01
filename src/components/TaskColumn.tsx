import { useDroppable } from "@dnd-kit/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

export const TaskColumn = ({
  id,
  title,
  icon,
  count,
  children,
  onAddTask,
  isReadOnly,
  accentColor = "border-primary",
}: TaskColumnProps) => {
  const { isOver, setNodeRef } = useDroppable({
    id,
    data: {
      status: id,
    },
  });

  return (
    <Card className={cn("flex flex-col h-full", isOver && "ring-2 ring-primary")}>
      <CardHeader className={cn("border-b-4 pb-3", accentColor)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle className="text-base md:text-lg">{title}</CardTitle>
            <Badge variant="secondary" className="ml-1">
              {count}
            </Badge>
          </div>
          {onAddTask && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
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
          isOver && "bg-primary/5"
        )}
      >
        {children}
      </CardContent>
    </Card>
  );
};
