import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Trash2, Edit, User, ChevronDown, ChevronUp, GripVertical, Check, Plus, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { TaskItem } from "@/types/task";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: TaskItem;
  onEdit: (task: TaskItem) => void;
  onDelete: (id: string) => void;
  isReadOnly?: boolean;
  subtasks?: SubTask[];
  onSubtaskToggle?: (taskId: string, subtaskId: string) => void;
  onAddSubtask?: (taskId: string) => void;
  onComplete?: (taskId: string) => void;
}

interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export const TaskCard = ({ 
  task, 
  onEdit, 
  onDelete, 
  isReadOnly,
  subtasks = [],
  onSubtaskToggle,
  onAddSubtask,
  onComplete,
}: TaskCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: {
      id: task.id,
      status: task.status,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  // Cores dos dots por prioridade
  const getPriorityDotColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: "bg-blue-500",
      medium: "bg-yellow-500",
      high: "bg-orange-500",
      urgent: "bg-red-500",
    };
    return colors[priority] || "bg-slate-400";
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      low: "Baixa",
      medium: "Média",
      high: "Alta",
      urgent: "Urgente",
    };
    return labels[priority] || priority;
  };

  // Cores dos dots por tipo
  const getTypeDotColor = (type: string) => {
    const colors: Record<string, string> = {
      general: "bg-slate-500",
      follow_up: "bg-purple-500",
      reactivation: "bg-cyan-500",
      proposal_follow_up: "bg-indigo-500",
    };
    return colors[type] || "bg-slate-400";
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      general: "Geral",
      follow_up: "Follow-up",
      reactivation: "Reativação",
      proposal_follow_up: "Follow-up Proposta",
    };
    return labels[type] || type;
  };

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== "completed";
  const completedSubtasks = subtasks.filter(st => st.completed).length;
  const hasSubtasks = subtasks.length > 0;

  return (
    <div ref={setNodeRef} style={style}>
      <Card 
        className={cn(
          "bg-white dark:bg-slate-800/90 rounded-2xl shadow-sm border border-border/30",
          "hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300",
          isDragging && "opacity-50 shadow-xl scale-105",
          isOverdue && "ring-2 ring-red-500/20"
        )}
      >
        <CardHeader className="p-4 pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {/* Drag handle */}
              <div
                {...listeners}
                {...attributes}
                className={cn(
                  "mt-0.5 cursor-grab active:cursor-grabbing",
                  isReadOnly && "cursor-not-allowed opacity-50"
                )}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground/40 hover:text-muted-foreground transition-colors" />
              </div>
              
              {/* Priority dot + Title */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span 
                    className={cn(
                      "w-2.5 h-2.5 rounded-full shrink-0",
                      getPriorityDotColor(task.priority)
                    )} 
                  />
                  <h4 className="font-medium text-sm text-foreground truncate">
                    {task.title}
                  </h4>
                </div>
                
                {task.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 ml-4.5">
                    {task.description}
                  </p>
                )}
              </div>
            </div>

            {/* Overdue indicator */}
            {isOverdue && (
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4 pt-2 space-y-3">
          {/* Tags row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Type tag */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={cn("w-2 h-2 rounded-full", getTypeDotColor(task.type))} />
              <span>{getTypeLabel(task.type)}</span>
            </div>

            {/* Priority tag */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={cn("w-2 h-2 rounded-full", getPriorityDotColor(task.priority))} />
              <span>{getPriorityLabel(task.priority)}</span>
            </div>

            {/* Due date */}
            {task.due_date && (
              <div className={cn(
                "flex items-center gap-1 text-xs",
                isOverdue ? "text-red-500" : "text-muted-foreground"
              )}>
                <Calendar className="h-3 w-3" />
                <span>
                  {format(new Date(task.due_date), "dd MMM", { locale: ptBR })}
                </span>
              </div>
            )}
          </div>

          {/* Customer */}
          {task.metadata?.customer_name && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              <span className="truncate">{task.metadata.customer_name}</span>
            </div>
          )}

          {/* Subtasks */}
          {(hasSubtasks || task.status !== "completed") && (
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between h-8 px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span>
                    {hasSubtasks 
                      ? `Subtarefas (${completedSubtasks}/${subtasks.length})`
                      : "Subtarefas"
                    }
                  </span>
                  {isOpen ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1.5 mt-2">
                {subtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    className="flex items-center gap-2 text-xs p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      checked={subtask.completed}
                      onCheckedChange={() => onSubtaskToggle?.(task.id, subtask.id)}
                      disabled={isReadOnly}
                      className="h-3.5 w-3.5"
                    />
                    <span
                      className={cn(
                        "flex-1",
                        subtask.completed && "line-through text-muted-foreground"
                      )}
                    >
                      {subtask.title}
                    </span>
                  </div>
                ))}
                {task.status !== "completed" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-full text-xs text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddSubtask?.(task.id);
                    }}
                    disabled={isReadOnly}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Adicionar subtarefa
                  </Button>
                )}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Action buttons */}
          {task.status !== "completed" && (
            <div className="flex items-center justify-between pt-1 border-t border-border/30">
              <div className="flex items-center gap-1">
                {(task.status === "pending" || task.status === "in_progress") && onComplete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      onComplete(task.id);
                    }}
                    disabled={isReadOnly}
                  >
                    <Check className="h-3.5 w-3.5 mr-1" />
                    Concluir
                  </Button>
                )}
              </div>
              
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(task);
                  }}
                  disabled={isReadOnly}
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(task.id);
                  }}
                  disabled={isReadOnly}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
