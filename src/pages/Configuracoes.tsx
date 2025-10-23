import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save, Star, Gift, Link as LinkIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";

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

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400" />
            Pós-venda e Avaliações
          </CardTitle>
          <CardDescription>Configure os links para avaliações e feedback automático</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="google-review" className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4" />
              Link de Avaliação Google
            </Label>
            <Input 
              id="google-review" 
              type="url" 
              placeholder="https://g.page/r/..." 
            />
            <p className="text-xs text-muted-foreground">
              Link para avaliação no Google Meu Negócio
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="instagram-review" className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4" />
              Link do Instagram
            </Label>
            <Input 
              id="instagram-review" 
              type="url" 
              placeholder="https://instagram.com/seunegocio" 
            />
            <p className="text-xs text-muted-foreground">
              Perfil do Instagram do seu negócio
            </p>
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">
                <strong className="text-foreground">Automação de Pós-venda:</strong>
                <p className="mt-1">
                  24 horas após cada serviço concluído, seus clientes receberão automaticamente:
                </p>
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  <li>Pedido de feedback com estrelas</li>
                  <li>Links para avaliação no Google e Instagram</li>
                  <li>Cupom de retorno (10% de desconto)</li>
                  <li>Status da carteirinha fidelidade</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            Programa de Fidelidade
          </CardTitle>
          <CardDescription>Configure a carteirinha fidelidade do seu negócio</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="stamps-required">Número de carimbos necessários</Label>
            <Input 
              id="stamps-required" 
              type="number" 
              defaultValue="5"
              min="2"
              max="20"
            />
            <p className="text-xs text-muted-foreground">
              Quantos serviços o cliente precisa realizar para ganhar uma recompensa (padrão: 5)
            </p>
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-start gap-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
              <Gift className="w-5 h-5 text-primary mt-0.5" />
              <div className="text-sm">
                <strong className="text-foreground">Como funciona:</strong>
                <p className="mt-1 text-muted-foreground">
                  A cada serviço concluído, o cliente ganha automaticamente um carimbo no cartão fidelidade.
                  Quando atingir o número necessário, o cartão é zerado e o cliente tem direito a uma visita grátis! 🎉
                </p>
              </div>
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
