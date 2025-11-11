import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useReadOnly } from "@/components/SubscriptionGuard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TaskCard } from "@/components/TaskCard";
import { TaskColumn } from "@/components/TaskColumn";
import { EditTaskDialog } from "@/components/EditTaskDialog";
import { AddSubtaskDialog } from "@/components/AddSubtaskDialog";
import { ListTodo, CheckCircle2, Clock, XCircle, Plus, Loader2, AlertCircle, CircleDot, Undo2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from "@dnd-kit/core";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { TaskItem } from "@/types/task";
import { Badge } from "@/components/ui/badge";

interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

const Tarefas = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isReadOnly } = useReadOnly();
  const [stats, setStats] = useState({
    pending: 0,
    in_progress: 0,
    completed: 0,
    overdue: 0,
  });
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [subtasks, setSubtasks] = useState<Record<string, SubTask[]>>({});
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [addSubtaskDialog, setAddSubtaskDialog] = useState<{ open: boolean; taskId: string | null }>({ open: false, taskId: null });
  const [undoStack, setUndoStack] = useState<Array<{ taskId: string; oldStatus: string; newStatus: string }>>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    due_date: "",
    related_entity_id: "",
    priority: "medium",
    status: "pending",
    type: "general",
  });

  useEffect(() => {
    checkAuth();
    fetchTasks();
    fetchCustomers();
    fetchSubtasks();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchTasks = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("tasks")
      .select(`
        *,
        customers!tasks_customer_id_fkey (
          name
        )
      `)
      .eq("user_id", user.id)
      .order("due_date", { ascending: true });

    if (error) {
      console.error("Erro ao buscar tarefas:", error);
      toast({
        title: "Erro ao carregar tarefas",
        description: error.message,
        variant: "destructive",
      });
    } else {
      const tasksWithMetadata = data.map((task: any) => ({
        ...task,
        metadata: {
          customer_name: task.customers?.name,
        },
      }));
      setTasks(tasksWithMetadata);
      
      // Calculate stats
      const now = new Date().toISOString();
      const pending = tasksWithMetadata.filter((t: TaskItem) => t.status === "pending").length;
      const inProgress = tasksWithMetadata.filter((t: TaskItem) => t.status === "in_progress").length;
      const completed = tasksWithMetadata.filter((t: TaskItem) => t.status === "completed").length;
      const overdue = tasksWithMetadata.filter((t: TaskItem) =>
        (t.status === "pending" || t.status === "in_progress") && 
        t.due_date && 
        new Date(t.due_date) < new Date(now)
      ).length;

      setStats({
        pending,
        in_progress: inProgress,
        completed,
        overdue,
      });
    }
    setLoading(false);
  };

  const fetchCustomers = async () => {
    const { data } = await supabase
      .from("customers")
      .select("id, name")
      .order("name");
    
    if (data) {
      setCustomers(data);
    }
  };

  const fetchSubtasks = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("subtasks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Erro ao buscar subtarefas:", error);
    } else if (data) {
      const subtasksByTask: Record<string, SubTask[]> = {};
      data.forEach((subtask: any) => {
        if (!subtasksByTask[subtask.task_id]) {
          subtasksByTask[subtask.task_id] = [];
        }
        subtasksByTask[subtask.task_id].push({
          id: subtask.id,
          title: subtask.title,
          completed: subtask.completed,
        });
      });
      setSubtasks(subtasksByTask);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.due_date) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o título e a data de vencimento",
        variant: "destructive",
      });
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar logado",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("tasks")
        .insert({
          user_id: session.user.id,
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          due_date: new Date(formData.due_date).toISOString(),
          priority: formData.priority,
          status: formData.status,
          type: formData.type,
          related_entity_type: formData.related_entity_id ? "customer" : null,
          related_entity_id: formData.related_entity_id || null,
          customer_id: formData.related_entity_id || null,
        });

      if (error) {
        console.error("Erro ao criar tarefa:", error);
        toast({
          title: "Erro ao criar tarefa",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Tarefa criada com sucesso!",
        });
        setOpen(false);
        setFormData({
          title: "",
          description: "",
          due_date: "",
          related_entity_id: "",
          priority: "medium",
          status: "pending",
          type: "general",
        });
        fetchTasks();
      }
    } catch (err) {
      console.error("Erro inesperado:", err);
      toast({
        title: "Erro ao criar tarefa",
        description: "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const taskId = active.id as string;
    const newStatus = over.id as string;
    
    // Find the task to get its old status
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const oldStatus = task.status;

    // Add to undo stack
    setUndoStack(prev => [...prev, { taskId, oldStatus, newStatus }]);

    // Update local state immediately for smooth UX
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );

    // Update in database
    const updateData: any = { status: newStatus };
    if (newStatus === "completed") {
      updateData.completed_at = new Date().toISOString();
    } else if (newStatus === "pending" || newStatus === "in_progress") {
      updateData.completed_at = null;
    }

    const { error } = await supabase
      .from("tasks")
      .update(updateData)
      .eq("id", taskId);

    if (error) {
      console.error("Erro ao atualizar tarefa:", error);
      toast({
        title: "Erro ao mover tarefa",
        description: error.message,
        variant: "destructive",
      });
      // Revert on error
      fetchTasks();
    } else {
      toast({
        title: "Tarefa movida!",
        description: "Status atualizado com sucesso",
        action: undoStack.length > 0 ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleUndo()}
          >
            <Undo2 className="h-3 w-3 mr-1" />
            Desfazer
          </Button>
        ) : undefined,
      });
      fetchTasks();
    }
  };

  const handleUndo = async () => {
    if (undoStack.length === 0) return;

    const lastAction = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));

    // Update local state
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === lastAction.taskId ? { ...task, status: lastAction.oldStatus } : task
      )
    );

    // Update in database
    const updateData: any = { status: lastAction.oldStatus };
    if (lastAction.oldStatus === "completed") {
      updateData.completed_at = new Date().toISOString();
    } else {
      updateData.completed_at = null;
    }

    const { error } = await supabase
      .from("tasks")
      .update(updateData)
      .eq("id", lastAction.taskId);

    if (error) {
      console.error("Erro ao desfazer:", error);
      toast({
        title: "Erro ao desfazer",
        description: error.message,
        variant: "destructive",
      });
      fetchTasks();
    } else {
      toast({
        title: "Ação desfeita!",
        description: "Status restaurado",
      });
      fetchTasks();
    }
  };

  const handleDeleteTask = async () => {
    if (!deleteTaskId) return;

    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", deleteTaskId);

    if (error) {
      toast({
        title: "Erro ao excluir tarefa",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Tarefa excluída com sucesso!",
      });
      fetchTasks();
      fetchSubtasks();
    }
    setDeleteTaskId(null);
  };

  const handleAddSubtask = async (title: string) => {
    if (!addSubtaskDialog.taskId) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("subtasks")
      .insert({
        task_id: addSubtaskDialog.taskId,
        user_id: user.id,
        title,
        completed: false,
      });

    if (error) {
      toast({
        title: "Erro ao adicionar subtarefa",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Subtarefa adicionada!",
      });
      fetchSubtasks();
    }
  };

  const handleSubtaskToggle = async (taskId: string, subtaskId: string) => {
    const taskSubtasks = subtasks[taskId] || [];
    const subtask = taskSubtasks.find(st => st.id === subtaskId);
    if (!subtask) return;

    const newCompleted = !subtask.completed;

    const updateData: any = {
      completed: newCompleted,
    };

    if (newCompleted) {
      updateData.completed_at = new Date().toISOString();
    } else {
      updateData.completed_at = null;
    }

    const { error } = await supabase
      .from("subtasks")
      .update(updateData)
      .eq("id", subtaskId);

    if (error) {
      toast({
        title: "Erro ao atualizar subtarefa",
        description: error.message,
        variant: "destructive",
      });
    } else {
      fetchSubtasks();
    }
  };

  const pendingTasks = tasks.filter((t) => t.status === "pending");
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress");
  const completedTasks = tasks.filter((t) => t.status === "completed");
  const historyTasks = tasks.filter((t) => t.status === "completed" || t.status === "cancelled");

  const activeTask = tasks.find((t) => t.id === activeId);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Tarefas+
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-2">
            Gerencie suas tarefas de forma visual e intuitiva
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button disabled={isReadOnly}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Tarefa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Nova Tarefa</DialogTitle>
              <DialogDescription>
                Adicione uma nova tarefa ao sistema
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="due_date">Data de Vencimento *</Label>
                <Input
                  id="due_date"
                  type="datetime-local"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer">Cliente (opcional)</Label>
                <Select
                  value={formData.related_entity_id}
                  onValueChange={(value) => setFormData({ ...formData, related_entity_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Prioridade</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Categoria</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">Geral</SelectItem>
                    <SelectItem value="follow_up">Follow-up</SelectItem>
                    <SelectItem value="reactivation">Reativação</SelectItem>
                    <SelectItem value="proposal_follow_up">Follow-up de Proposta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status Inicial</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">A Fazer</SelectItem>
                    <SelectItem value="in_progress">Em Progresso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isReadOnly}>Criar Tarefa</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Undo Button */}
      {undoStack.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={handleUndo}
            className="shadow-lg hover:shadow-xl transition-all"
            size="lg"
          >
            <Undo2 className="h-4 w-4 mr-2" />
            Desfazer última ação
          </Button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">A Fazer</CardTitle>
            <ListTodo className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Progresso</CardTitle>
            <CircleDot className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.in_progress}</div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atrasadas</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.overdue}</div>
          </CardContent>
        </Card>
      </div>

      {/* Kanban Board - Only Active Tasks */}
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TaskColumn
            id="pending"
            title="A Fazer"
            icon={<ListTodo className="h-5 w-5 text-blue-500" />}
            count={pendingTasks.length}
            onAddTask={() => {
              setFormData({ ...formData, status: "pending" });
              setOpen(true);
            }}
            isReadOnly={isReadOnly}
            accentColor="border-blue-500"
          >
            {pendingTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={setEditingTask}
                onDelete={setDeleteTaskId}
                isReadOnly={isReadOnly}
                subtasks={subtasks[task.id] || []}
                onSubtaskToggle={handleSubtaskToggle}
                onAddSubtask={(taskId) => setAddSubtaskDialog({ open: true, taskId })}
              />
            ))}
            {pendingTasks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <ListTodo className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">Nenhuma tarefa a fazer</p>
              </div>
            )}
          </TaskColumn>

          <TaskColumn
            id="in_progress"
            title="Em Progresso"
            icon={<CircleDot className="h-5 w-5 text-amber-500" />}
            count={inProgressTasks.length}
            onAddTask={() => {
              setFormData({ ...formData, status: "in_progress" });
              setOpen(true);
            }}
            isReadOnly={isReadOnly}
            accentColor="border-amber-500"
          >
            {inProgressTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={setEditingTask}
                onDelete={setDeleteTaskId}
                isReadOnly={isReadOnly}
                subtasks={subtasks[task.id] || []}
                onSubtaskToggle={handleSubtaskToggle}
                onAddSubtask={(taskId) => setAddSubtaskDialog({ open: true, taskId })}
              />
            ))}
            {inProgressTasks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <CircleDot className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">Nenhuma tarefa em progresso</p>
              </div>
            )}
          </TaskColumn>
        </div>

        <DragOverlay>
          {activeTask ? (
            <TaskCard
              task={activeTask}
              onEdit={() => {}}
              onDelete={() => {}}
              isReadOnly={isReadOnly}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* History Section */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <CardTitle>Histórico de Tarefas</CardTitle>
              <Badge variant="secondary">{historyTasks.length}</Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
            >
              {showHistory ? "Ocultar" : "Mostrar"} Histórico
            </Button>
          </div>
          <CardDescription>
            Tarefas concluídas e canceladas
          </CardDescription>
        </CardHeader>
        {showHistory && (
          <CardContent>
            {historyTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">Nenhuma tarefa no histórico</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {historyTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={setEditingTask}
                    onDelete={setDeleteTaskId}
                    isReadOnly={isReadOnly}
                    subtasks={subtasks[task.id] || []}
                    onSubtaskToggle={handleSubtaskToggle}
                    onAddSubtask={(taskId) => setAddSubtaskDialog({ open: true, taskId })}
                  />
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Edit Dialog */}
      {editingTask && (
        <EditTaskDialog
          task={editingTask}
          open={!!editingTask}
          onOpenChange={(open) => {
            if (!open) setEditingTask(null);
          }}
          onTaskUpdated={() => {
            fetchTasks();
            setEditingTask(null);
          }}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTaskId} onOpenChange={(open) => !open && setDeleteTaskId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Tarefa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A tarefa e todas as suas subtarefas serão permanentemente removidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTask} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Subtask Dialog */}
      <AddSubtaskDialog
        open={addSubtaskDialog.open}
        onOpenChange={(open) => setAddSubtaskDialog({ open, taskId: null })}
        onAdd={handleAddSubtask}
      />
    </div>
  );
};

export default Tarefas;
