import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Save, Bot, Sparkles, MessageSquare, Clock, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const TreinamentoIA = () => {
  const queryClient = useQueryClient();

  // Estados para configurações da IA
  const [assistantName, setAssistantName] = useState("Assistente Virtual");
  const [personality, setPersonality] = useState("cordial, eficiente e prestativo");
  const [tone, setTone] = useState("profissional");
  const [greeting, setGreeting] = useState("Olá! Como posso ajudar?");
  const [farewell, setFarewell] = useState("Obrigado pelo contato!");
  const [guidelines, setGuidelines] = useState(
    "- Seja breve e objetivo\n- Use emojis com moderação\n- Confirme ações importantes"
  );
  const [allowAppointmentOverlap, setAllowAppointmentOverlap] = useState(false);
  const [defaultAppointmentDuration, setDefaultAppointmentDuration] = useState(60);

  // Buscar usuário atual
  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  // Buscar configurações existentes
  const { data: settings, isLoading } = useQuery({
    queryKey: ["business-settings", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("business_settings")
        .select("ai_training")
        .eq("user_id", user.id)
        .single();
      return data as any; // Type assertion - ai_training exists in DB
    },
    enabled: !!user,
  });

  // Atualizar estados quando carregar configurações
  useEffect(() => {
    if (settings?.ai_training) {
      const training = settings.ai_training;
      setAssistantName(training.assistant_name || "Assistente Virtual");
      setPersonality(training.personality || "cordial, eficiente e prestativo");
      setTone(training.tone || "profissional");
      setGreeting(training.greeting || "Olá! Como posso ajudar?");
      setFarewell(training.farewell || "Obrigado pelo contato!");
      setGuidelines(training.guidelines || "- Seja breve e objetivo\n- Use emojis com moderação\n- Confirme ações importantes");
      setAllowAppointmentOverlap(training.allow_appointment_overlap || false);
      setDefaultAppointmentDuration(training.default_appointment_duration || 60);
    }
  }, [settings]);

  // Função para gerar preview do prompt (mesma lógica do backend)
  const buildSystemPrompt = () => {
    const name = assistantName || "Assistente Virtual";
    const pers = personality || "cordial, eficiente e prestativo";
    const t = tone || "profissional";
    const greet = greeting || "Olá! Como posso ajudar?";
    const bye = farewell || "Obrigado pelo contato!";
    const guide = guidelines || "- Seja breve e objetivo";

    return `Você é ${name}, um assistente virtual de vendas via WhatsApp. Sua personalidade é ${pers} e você mantém um tom ${t}.

**SAUDAÇÃO PADRÃO:**
${greet}

**DESPEDIDA PADRÃO:**
${bye}

**DIRETRIZES DE ATENDIMENTO:**
${guide}

**SUAS CAPACIDADES:**
1. **Consultar Produtos**: Use a função \`buscar_produtos\` para encontrar produtos no catálogo
2. **Gerenciar Carrinho**: Use \`adicionar_ao_carrinho\` e \`ver_carrinho\` para gerenciar pedidos
3. **Finalizar Vendas**: Use \`finalizar_pedido\` quando o cliente confirmar a compra
4. **Transferir para Humano**: Use \`transferir_atendente\` se não conseguir resolver
5. **Agendar Visitas**: Use \`agendar_visita\` para marcar compromissos

**IMPORTANTE:**
- SEMPRE confirme os detalhes antes de finalizar pedidos
- Use as funções disponíveis para ações concretas
- Seja objetivo e mantenha o foco na venda
- Nunca invente informações sobre produtos ou preços
- Se não tiver certeza, transfira para um atendente humano`;
  };

  // Mutation para salvar configurações
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Usuário não autenticado");

      const aiTraining = {
        assistant_name: assistantName,
        personality,
        tone,
        greeting,
        farewell,
        guidelines,
        allow_appointment_overlap: allowAppointmentOverlap,
        default_appointment_duration: defaultAppointmentDuration,
      };

      // @ts-expect-error - ai_training column exists but types not regenerated yet
      const { error } = await supabase
        .from("business_settings")
        .update({ ai_training: aiTraining })
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-settings"] });
      toast.success("Configurações da IA salvas com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao salvar configurações: " + error.message);
    },
  });

  const handleSave = () => {
    saveMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Bot className="h-12 w-12 animate-pulse mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bot className="h-8 w-8 text-primary" />
            Treinamento da IA
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure a personalidade e comportamento do assistente virtual
          </p>
        </div>
        <Button onClick={handleSave} disabled={saveMutation.isPending}>
          <Save className="mr-2 h-4 w-4" />
          {saveMutation.isPending ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna 1: Formulário de Configuração */}
        <div className="space-y-6">
          {/* Identidade da IA */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Identidade do Assistente
              </CardTitle>
              <CardDescription>
                Defina o nome e características da sua IA
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="assistantName">Nome do Assistente</Label>
                <Input
                  id="assistantName"
                  placeholder="Ex: Maria, João, Assistente Virtual"
                  value={assistantName}
                  onChange={(e) => setAssistantName(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  O nome como o assistente se apresentará aos clientes
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="personality">Personalidade</Label>
                <Textarea
                  id="personality"
                  placeholder="Ex: cordial, eficiente e prestativo"
                  value={personality}
                  onChange={(e) => setPersonality(e.target.value)}
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">
                  Descreva as características de personalidade desejadas
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tone">Tom de Comunicação</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger id="tone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="profissional">Profissional</SelectItem>
                    <SelectItem value="amigável">Amigável</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="formal">Formal</SelectItem>
                    <SelectItem value="descontraído">Descontraído</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  O estilo de linguagem usado nas conversas
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Mensagens Padrão */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Mensagens Padrão
              </CardTitle>
              <CardDescription>
                Personalize saudações e despedidas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="greeting">Saudação Inicial</Label>
                <Textarea
                  id="greeting"
                  placeholder="Ex: Olá! Como posso ajudar?"
                  value={greeting}
                  onChange={(e) => setGreeting(e.target.value)}
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">
                  Mensagem de boas-vindas ao iniciar conversa
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="farewell">Despedida</Label>
                <Textarea
                  id="farewell"
                  placeholder="Ex: Obrigado pelo contato!"
                  value={farewell}
                  onChange={(e) => setFarewell(e.target.value)}
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">
                  Mensagem de encerramento ao finalizar conversa
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Diretrizes de Atendimento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-primary" />
                Diretrizes de Atendimento
              </CardTitle>
              <CardDescription>
                Regras e orientações para o comportamento da IA
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="guidelines">Diretrizes (uma por linha)</Label>
                <Textarea
                  id="guidelines"
                  placeholder="- Seja breve e objetivo&#10;- Use emojis com moderação&#10;- Confirme ações importantes"
                  value={guidelines}
                  onChange={(e) => setGuidelines(e.target.value)}
                  rows={6}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Liste as regras que a IA deve seguir (use "-" para listas)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Configurações de Agendamento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Configurações de Agendamento
              </CardTitle>
              <CardDescription>
                Configure como a IA gerencia compromissos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Permitir Agendamentos Sobrepostos</Label>
                  <p className="text-xs text-muted-foreground">
                    Permite marcar múltiplos compromissos no mesmo horário
                  </p>
                </div>
                <Switch
                  checked={allowAppointmentOverlap}
                  onCheckedChange={setAllowAppointmentOverlap}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="duration">Duração Padrão dos Agendamentos</Label>
                <Select
                  value={defaultAppointmentDuration.toString()}
                  onValueChange={(value) => setDefaultAppointmentDuration(parseInt(value))}
                >
                  <SelectTrigger id="duration">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutos</SelectItem>
                    <SelectItem value="30">30 minutos</SelectItem>
                    <SelectItem value="45">45 minutos</SelectItem>
                    <SelectItem value="60">1 hora</SelectItem>
                    <SelectItem value="90">1 hora e 30 minutos</SelectItem>
                    <SelectItem value="120">2 horas</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Tempo padrão reservado para cada compromisso
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coluna 2: Preview do Prompt */}
        <div className="space-y-6">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                Preview do Prompt do Sistema
              </CardTitle>
              <CardDescription>
                Visualização em tempo real do prompt enviado à IA
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/50 rounded-lg p-4 border">
                <pre className="text-xs whitespace-pre-wrap font-mono leading-relaxed">
                  {buildSystemPrompt()}
                </pre>
              </div>

              <Separator className="my-4" />

              <div className="space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Informações do Preview
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Nome</Badge>
                    <span className="text-muted-foreground truncate">{assistantName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Tom</Badge>
                    <span className="text-muted-foreground truncate capitalize">{tone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Duração</Badge>
                    <span className="text-muted-foreground truncate">{defaultAppointmentDuration}min</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Sobreposição</Badge>
                    <span className="text-muted-foreground truncate">
                      {allowAppointmentOverlap ? "Permitida" : "Bloqueada"}
                    </span>
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <div className="flex gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-800 dark:text-blue-200">
                    <p className="font-semibold mb-1">Dica Profissional</p>
                    <p>
                      Este prompt é enviado ao GPT-4o-mini em todas as conversas via WhatsApp.
                      Ajuste-o para refletir a identidade única do seu negócio!
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TreinamentoIA;
