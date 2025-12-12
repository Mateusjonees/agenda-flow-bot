import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Search, Send, User, Clock, PhoneCall, Loader2, UserPlus, QrCode, Wifi, WifiOff } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { WhatsAppConnectionDialog } from "@/components/WhatsAppConnectionDialog";
interface WhatsAppConversation {
  id: string;
  user_id: string;
  customer_id: string | null;
  whatsapp_phone: string;
  whatsapp_name: string | null;
  status: string;
  last_message_at: string;
  message_count: number;
  assigned_to_human: boolean;
  assigned_to_user_id: string | null;
  customers?: {
    name: string;
  };
}

interface WhatsAppMessage {
  id: string;
  conversation_id: string;
  direction: "inbound" | "outbound";
  message_type: string;
  content: string | null;
  media_url: string | null;
  status: string | null;
  sent_at: string;
  created_at: string;
}

const ConversasWhatsApp = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<WhatsAppConversation | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [connectionDialogOpen, setConnectionDialogOpen] = useState(false);
  const [whatsappConnected, setWhatsappConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();

    // Realtime subscription para novas conversas
    const conversationsChannel = supabase
      .channel("whatsapp_conversations_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "whatsapp_conversations",
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(conversationsChannel);
    };
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);

      // Realtime subscription para novas mensagens
      const messagesChannel = supabase
        .channel(`whatsapp_messages_${selectedConversation.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "whatsapp_messages",
            filter: `conversation_id=eq.${selectedConversation.id}`,
          },
          () => {
            fetchMessages(selectedConversation.id);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(messagesChannel);
      };
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("whatsapp_conversations")
        .select(`
          *,
          customers (
            name
          )
        `)
        .eq("user_id", user.id)
        .order("last_message_at", { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar conversas",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    setLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from("whatsapp_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("sent_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar mensagens",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedConversation || !newMessage.trim()) return;

    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Chamar Edge Function para enviar mensagem via WhatsApp Cloud API
      const { data, error } = await supabase.functions.invoke("send-whatsapp-message", {
        body: {
          user_id: user.id,
          conversation_id: selectedConversation.id,
          to: selectedConversation.whatsapp_phone,
          message_type: "text",
          content: newMessage,
        },
      });

      if (error) throw error;

      toast({
        title: "✅ Mensagem enviada!",
      });

      setNewMessage("");
    } catch (error: any) {
      toast({
        title: "Erro ao enviar mensagem",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleTransferToHuman = async () => {
    if (!selectedConversation) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("whatsapp_conversations")
        .update({
          assigned_to_human: true,
          assigned_to_user_id: user.id,
          status: "waiting_human",
        })
        .eq("id", selectedConversation.id);

      if (error) throw error;

      toast({
        title: "✅ Conversa transferida!",
        description: "Agora você está atendendo este cliente.",
      });

      fetchConversations();
      setSelectedConversation({
        ...selectedConversation,
        assigned_to_human: true,
        assigned_to_user_id: user.id,
        status: "waiting_human",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao transferir conversa",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      active: { label: "Ativa", variant: "default" },
      waiting_response: { label: "Aguardando", variant: "secondary" },
      waiting_human: { label: "Atendimento Humano", variant: "outline" },
      resolved: { label: "Resolvida", variant: "secondary" },
      abandoned: { label: "Abandonada", variant: "destructive" },
    };

    const status_info = statusMap[status] || { label: status, variant: "outline" };
    return <Badge variant={status_info.variant}>{status_info.label}</Badge>;
  };

  const getFilteredConversations = () => {
    return conversations.filter((conv) => {
      const matchesStatus =
        statusFilter === "all" || conv.status === statusFilter;

      const matchesSearch =
        !searchTerm ||
        conv.whatsapp_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.whatsapp_phone.includes(searchTerm) ||
        conv.customers?.name?.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesStatus && matchesSearch;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const filteredConversations = getFilteredConversations();

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Conversas WhatsApp</h1>
          <p className="text-muted-foreground">
            Acompanhe e responda conversas com clientes via WhatsApp
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={whatsappConnected ? "default" : "secondary"} className="gap-1">
            {whatsappConnected ? (
              <>
                <Wifi className="h-3 w-3" />
                Conectado
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3" />
                Desconectado
              </>
            )}
          </Badge>
          <Button onClick={() => setConnectionDialogOpen(true)}>
            <QrCode className="mr-2 h-4 w-4" />
            Conectar WhatsApp
          </Button>
        </div>
      </div>

      <WhatsAppConnectionDialog
        open={connectionDialogOpen}
        onOpenChange={setConnectionDialogOpen}
        onConnectionChange={setWhatsappConnected}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Lista de Conversas */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Conversas</CardTitle>
            <CardDescription>{filteredConversations.length} conversa(s)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou telefone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="active">Ativas</SelectItem>
                  <SelectItem value="waiting_response">Aguardando</SelectItem>
                  <SelectItem value="waiting_human">Atendimento Humano</SelectItem>
                  <SelectItem value="resolved">Resolvidas</SelectItem>
                  <SelectItem value="abandoned">Abandonadas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Conversations List */}
            <ScrollArea className="h-[calc(100vh-420px)]">
              <div className="space-y-2">
                {filteredConversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedConversation?.id === conv.id
                        ? "bg-primary/10 border-primary"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => setSelectedConversation(conv)}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar>
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium truncate">
                            {conv.customers?.name || conv.whatsapp_name || "Sem nome"}
                          </p>
                          {getStatusBadge(conv.status)}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {conv.whatsapp_phone}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(conv.last_message_at), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </p>
                        </div>
                        {conv.message_count > 0 && (
                          <Badge variant="secondary" className="mt-1 text-xs">
                            {conv.message_count} mensagens
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {filteredConversations.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma conversa encontrada</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="lg:col-span-2 flex flex-col">
          {selectedConversation ? (
            <>
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">
                        {selectedConversation.customers?.name ||
                          selectedConversation.whatsapp_name ||
                          "Sem nome"}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <PhoneCall className="h-3 w-3" />
                        {selectedConversation.whatsapp_phone}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(selectedConversation.status)}
                    {!selectedConversation.assigned_to_human && (
                      <Button size="sm" variant="outline" onClick={handleTransferToHuman}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Assumir Atendimento
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col p-4">
                {/* Messages */}
                <ScrollArea className="flex-1 pr-4">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${
                            msg.direction === "outbound" ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                              msg.direction === "outbound"
                                ? "bg-green-500 text-white"
                                : "bg-muted"
                            }`}
                          >
                            {msg.message_type === "text" && msg.content && (
                              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                            )}
                            {msg.message_type === "image" && msg.media_url && (
                              <img
                                src={msg.media_url}
                                alt="Imagem"
                                className="max-w-full rounded"
                              />
                            )}
                            <p
                              className={`text-xs mt-1 ${
                                msg.direction === "outbound"
                                  ? "text-green-100"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {new Date(msg.sent_at).toLocaleTimeString("pt-BR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                              {msg.direction === "outbound" && msg.status && (
                                <> • {msg.status}</>
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                {/* Input Area */}
                <div className="mt-4 flex gap-2">
                  <Input
                    placeholder="Digite sua mensagem..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={sending}
                  />
                  <Button onClick={handleSendMessage} disabled={sending || !newMessage.trim()}>
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Selecione uma conversa para começar</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ConversasWhatsApp;
