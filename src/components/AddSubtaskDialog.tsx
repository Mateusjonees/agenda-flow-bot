import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AddSubtaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (title: string) => void;
}

export const AddSubtaskDialog = ({ open, onOpenChange, onAdd }: AddSubtaskDialogProps) => {
  const [title, setTitle] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onAdd(title.trim());
      setTitle("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Subtarefa</DialogTitle>
          <DialogDescription>
            Crie uma subtarefa para dividir esta tarefa em etapas menores.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="subtask-title">Título da Subtarefa</Label>
              <Input
                id="subtask-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Ligar para cliente"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Adicionar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
