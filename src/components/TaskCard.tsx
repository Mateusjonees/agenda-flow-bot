import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Trash2, Edit, User, ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { TaskItem } from "@/types/task";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";

interface TaskCardProps {
  task: TaskItem;
  onEdit: (task: TaskItem) => void;
  onDelete: (id: string) => void;
  isReadOnly?: boolean;
  subtasks?: SubTask[];
  onSubtaskToggle?: (taskId: string, subtaskId: string) => void;
  onAddSubtask?: (taskId: string) => void;
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
    opacity: isDragging ? 0.5 : 1,
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200",
      medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300 border-yellow-200",
      high: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300 border-orange-200",
      urgent: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border-red-200",
    };
    return colors[priority] || "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
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

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      general: "bg-slate-100 text-slate-700 dark:bg-slate-950 dark:text-slate-300",
      follow_up: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
      reactivation: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
      proposal_follow_up: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
    };
    return colors[type] || "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      general: "Geral",
      follow_up: "Follow-up",
      reactivation: "Reativação",
      proposal_follow_up: "Follow-up de Proposta",
    };
    return labels[type] || type;
  };

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== "completed";
  const completedSubtasks = subtasks.filter(st => st.completed).length;
  const hasSubtasks = subtasks.length > 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? "opacity-50" : ""}
    >
      <Card className="hover:shadow-md transition-all duration-200 border-l-4" style={{ borderLeftColor: task.color || '#FF6B35' }}>
        <CardHeader className="p-3 pb-2">
          <div className="flex items-start gap-2">
            <div
              {...listeners}
              {...attributes}
              className="cursor-grab active:cursor-grabbing mt-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <GripVertical className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-sm font-medium line-clamp-2">{task.title}</CardTitle>
              {hasSubtasks && (
                <div className="text-xs text-muted-foreground mt-1">
                  {completedSubtasks}/{subtasks.length} subtarefas concluídas
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-0 space-y-3">
          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
          )}

          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline" className={`text-xs px-2 py-0.5 ${getPriorityColor(task.priority)}`}>
              {getPriorityLabel(task.priority)}
            </Badge>
            <Badge variant="outline" className={`text-xs px-2 py-0.5 ${getTypeColor(task.type)}`}>
              {getTypeLabel(task.type)}
            </Badge>
          </div>

          {task.due_date && (
            <div className={`flex items-center gap-1.5 text-xs ${isOverdue ? "text-destructive" : "text-muted-foreground"}`}>
              <Calendar className="h-3 w-3" />
              <span>{format(new Date(task.due_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
            </div>
          )}

          {task.metadata?.customer_name && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              <span className="truncate">{task.metadata.customer_name}</span>
            </div>
          )}

          {/* Subtasks Section */}
          {(hasSubtasks || task.status !== "completed") && (
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-full justify-between px-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="text-xs">Subtarefas</span>
                  {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 mt-2">
                {subtasks.map((subtask) => (
                  <div key={subtask.id} className="flex items-center gap-2 pl-2">
                    <Checkbox
                      checked={subtask.completed}
                      onCheckedChange={() => onSubtaskToggle?.(task.id, subtask.id)}
                      disabled={isReadOnly}
                      className="h-3 w-3"
                    />
                    <span className={`text-xs ${subtask.completed ? "line-through text-muted-foreground" : ""}`}>
                      {subtask.title}
                    </span>
                  </div>
                ))}
                {task.status !== "completed" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-full text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddSubtask?.(task.id);
                    }}
                    disabled={isReadOnly}
                  >
                    + Adicionar subtarefa
                  </Button>
                )}
              </CollapsibleContent>
            </Collapsible>
          )}

          {task.status !== "completed" && (
            <div className="flex gap-1.5 pt-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(task);
                }}
                disabled={isReadOnly}
              >
                <Edit className="h-3 w-3 mr-1" />
                <span className="text-xs">Editar</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(task.id);
                }}
                disabled={isReadOnly}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
