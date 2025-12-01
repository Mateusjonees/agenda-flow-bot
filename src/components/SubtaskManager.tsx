import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit2, Check, X, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Subtask {
  id: string;
  title: string;
  status: "pending" | "in_progress" | "completed";
}

interface SubtaskManagerProps {
  taskId: string;
  onSubtasksChange?: () => void;
}

export const SubtaskManager = ({ taskId, onSubtasksChange }: SubtaskManagerProps) => {
  const { toast } = useToast();
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSubtasks();
  }, [taskId]);

  const loadSubtasks = async () => {
    const { data, error } = await supabase
      .from("subtasks")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Erro ao carregar subtarefas:", error);
    } else {
      setSubtasks((data || []).map(st => ({
        id: st.id,
        title: st.title,
        status: st.status as "pending" | "in_progress" | "completed",
      })));
    }
  };

  const addSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;
    
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from("subtasks")
      .insert({
        task_id: taskId,
        user_id: userData.user?.id,
        title: newSubtaskTitle.trim(),
        status: "pending",
        completed: false,
      });

    if (error) {
      toast({
        title: "Erro ao adicionar subtarefa",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setNewSubtaskTitle("");
      await loadSubtasks();
      onSubtasksChange?.();
    }
    setLoading(false);
  };

  const updateSubtaskStatus = async (subtaskId: string, newStatus: "pending" | "in_progress" | "completed") => {
    const { error } = await supabase
      .from("subtasks")
      .update({ 
        status: newStatus,
        completed: newStatus === "completed",
        completed_at: newStatus === "completed" ? new Date().toISOString() : null,
      })
      .eq("id", subtaskId);

    if (error) {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    } else {
      await loadSubtasks();
      onSubtasksChange?.();
    }
  };

  const updateSubtaskTitle = async (subtaskId: string) => {
    if (!editingTitle.trim()) return;

    const { error } = await supabase
      .from("subtasks")
      .update({ title: editingTitle.trim() })
      .eq("id", subtaskId);

    if (error) {
      toast({
        title: "Erro ao editar subtarefa",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setEditingId(null);
      setEditingTitle("");
      await loadSubtasks();
      onSubtasksChange?.();
    }
  };

  const deleteSubtask = async (subtaskId: string) => {
    const { error } = await supabase
      .from("subtasks")
      .delete()
      .eq("id", subtaskId);

    if (error) {
      toast({
        title: "Erro ao excluir subtarefa",
        description: error.message,
        variant: "destructive",
      });
    } else {
      await loadSubtasks();
      onSubtasksChange?.();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200";
      case "in_progress":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300 border-yellow-200";
      case "completed":
        return "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300 border-green-200";
      default:
        return "";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "A Fazer";
      case "in_progress":
        return "Em Processo";
      case "completed":
        return "Concluído";
      default:
        return status;
    }
  };

  const cycleStatus = (currentStatus: string) => {
    const statuses: Array<"pending" | "in_progress" | "completed"> = ["pending", "in_progress", "completed"];
    const currentIndex = statuses.indexOf(currentStatus as any);
    return statuses[(currentIndex + 1) % statuses.length];
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Subtarefas</h4>
        <Badge variant="outline">{subtasks.length}</Badge>
      </div>

      {/* Lista de subtarefas */}
      <div className="space-y-2">
        {subtasks.map((subtask) => (
          <div
            key={subtask.id}
            className="flex items-center gap-2 p-2 rounded-lg border bg-card"
          >
            {editingId === subtask.id ? (
              <>
                <Input
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  className="flex-1 h-8"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") updateSubtaskTitle(subtask.id);
                    if (e.key === "Escape") {
                      setEditingId(null);
                      setEditingTitle("");
                    }
                  }}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={() => updateSubtaskTitle(subtask.id)}
                >
                  <Check className="h-4 w-4 text-green-600" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={() => {
                    setEditingId(null);
                    setEditingTitle("");
                  }}
                >
                  <X className="h-4 w-4 text-red-600" />
                </Button>
              </>
            ) : (
              <>
                <Badge
                  variant="outline"
                  className={`cursor-pointer text-xs px-2 py-0.5 ${getStatusColor(subtask.status)}`}
                  onClick={() => updateSubtaskStatus(subtask.id, cycleStatus(subtask.status))}
                  title="Clique para alterar status"
                >
                  {getStatusLabel(subtask.status)}
                </Badge>
                <span
                  className={`flex-1 text-sm ${
                    subtask.status === "completed" ? "line-through text-muted-foreground" : ""
                  }`}
                >
                  {subtask.title}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={() => {
                    setEditingId(subtask.id);
                    setEditingTitle(subtask.title);
                  }}
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  onClick={() => deleteSubtask(subtask.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Adicionar nova subtarefa */}
      <div className="flex gap-2">
        <Input
          placeholder="Nova subtarefa..."
          value={newSubtaskTitle}
          onChange={(e) => setNewSubtaskTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") addSubtask();
          }}
          className="flex-1"
        />
        <Button
          size="sm"
          onClick={addSubtask}
          disabled={loading || !newSubtaskTitle.trim()}
        >
          <Plus className="h-4 w-4 mr-1" />
          Adicionar
        </Button>
      </div>
    </div>
  );
};
