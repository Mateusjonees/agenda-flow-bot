import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

const Configuracoes = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Configurações</h1>
        <p className="text-muted-foreground">Configure as informações do seu negócio</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Negócio</CardTitle>
          <CardDescription>Configure os dados principais do seu estabelecimento</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="business-name">Nome do Negócio</Label>
              <Input id="business-name" placeholder="Meu Salão" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="business-type">Tipo de Negócio</Label>
              <Input id="business-type" placeholder="Salão de Beleza" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" placeholder="(11) 99999-9999" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" placeholder="contato@meusalao.com" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Endereço</Label>
            <Input id="address" placeholder="Rua Example, 123 - Bairro, Cidade - UF" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Horário de Funcionamento</CardTitle>
          <CardDescription>Defina os horários de atendimento</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"].map((day) => (
              <div key={day} className="flex items-center gap-4">
                <div className="w-24">
                  <p className="text-sm font-medium">{day}</p>
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <Input type="time" defaultValue="09:00" className="w-32" />
                  <span className="text-muted-foreground">até</span>
                  <Input type="time" defaultValue="18:00" className="w-32" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configurações de Agendamento</CardTitle>
          <CardDescription>Personalize como os agendamentos funcionam</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="slot-duration">Duração padrão (minutos)</Label>
              <Input id="slot-duration" type="number" defaultValue="60" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="buffer-time">Tempo entre agendamentos (minutos)</Label>
              <Input id="buffer-time" type="number" defaultValue="0" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button className="gap-2">
          <Save className="w-4 h-4" />
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
};

export default Configuracoes;
