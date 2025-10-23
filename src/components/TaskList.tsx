import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertCircle,
  MessageSquare,
  CreditCard,
  UserX,
  Package,
  Calendar
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Task {
  id: string;
  title: string;
  description: string;
  type: string;
  priority: string;
  status: string;
  due_date: string;
  related_entity_type: string;
  related_entity_id: string;
}

interface TaskListProps {
  showAll?: boolean;
  maxItems?: number;
}

export const TaskList = ({ showAll = false, maxItems = 10 }: TaskListProps) => {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, [showAll]);

  const fetchTasks = async () => {
    let query = supabase
      .from("tasks")
      .select("*")
      .in("status", ["pending", "in_progress"])
      .order("due_date", { ascending: true });

    if (!showAll) {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      query = query.lte("due_date", today.toISOString());
    }

    if (maxItems) {
      query = query.limit(maxItems);
    }

    const { data, error } = await query;

    if (error) {
      toast({
        title: "Erro ao carregar tarefas",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setTasks(data || []);
    }
    setLoading(false);
  };

  const handleCompleteTask = async (taskId: string) => {
    const { error } = await supabase
      .from("tasks")
      .update({ 
        status: "completed",
        completed_at: new Date().toISOString()
      })
      .eq("id", taskId);

    if (error) {
      toast({
        title: "Erro ao completar tarefa",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Tarefa concluída!",
      });
      fetchTasks();
    }
  };

  const getTaskIcon = (type: string) => {
    const icons: Record<string, any> = {
      post_sale: MessageSquare,
      followup: Clock,
      payment: CreditCard,
      reactivation: UserX,
      restock: Package,
      preparation: Calendar,
    };
    const Icon = icons[type] || Circle;
    return <Icon className="h-4 w-4" />;
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: "destructive",
      high: "default",
      medium: "secondary",
      low: "outline",
    };
    return colors[priority] || "secondary";
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      urgent: "Urgente",
      high: "Alta",
      medium: "Média",
      low: "Baixa",
    };
    return labels[priority] || priority;
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  if (loading) {
    return <div className="text-muted-foreground">Carregando tarefas...</div>;
  }

  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {showAll ? "Nenhuma tarefa pendente" : "Nenhuma tarefa para hoje"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <Card key={task.id} className={isOverdue(task.due_date) ? "border-destructive" : ""}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Checkbox
                checked={false}
                onCheckedChange={() => handleCompleteTask(task.id)}
                className="mt-1"
              />
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {getTaskIcon(task.type)}
                    <h4 className="font-medium">{task.title}</h4>
                  </div>
                  <Badge variant={getPriorityColor(task.priority) as any}>
                    {getPriorityLabel(task.priority)}
                  </Badge>
                </div>
                {task.description && (
                  <p className="text-sm text-muted-foreground">{task.description}</p>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {isOverdue(task.due_date) ? (
                    <div className="flex items-center gap-1 text-destructive">
                      <AlertCircle className="h-3 w-3" />
                      Atrasada
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(task.due_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
