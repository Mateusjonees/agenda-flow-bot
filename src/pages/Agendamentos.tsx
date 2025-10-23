import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const Agendamentos = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Agendamentos</h1>
          <p className="text-muted-foreground">Gerencie todos os seus agendamentos</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Agendamento
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Calendário de Agendamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <p>Nenhum agendamento encontrado. Crie seu primeiro agendamento!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Agendamentos;
