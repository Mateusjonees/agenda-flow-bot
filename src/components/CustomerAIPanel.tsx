import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Send, Bot, User, Sparkles } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface Message {
  role: "user" | "assistant";
  content: string;
  pdfHtml?: string;
}

interface CustomerAIPanelProps {
  customerId: string;
  customerName: string;
  onClose: () => void;
}

export default function CustomerAIPanel({ customerId, customerName, onClose }: CustomerAIPanelProps) {
  const queryClient = useQueryClient();
  
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Olá! 👋 Estou analisando **${customerName}**.\n\nPosso ajudar com:\n\n• 📊 Histórico de compras\n• 📅 Agendamentos\n• 💡 Sugestões de retenção\n• 📝 Tarefas de follow-up\n• 💰 Relatório financeiro\n\nO que você precisa saber?`
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const getUser = async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const refreshData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["customers"] });
    queryClient.invalidateQueries({ queryKey: ["appointments"] });
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
    queryClient.invalidateQueries({ queryKey: ["financial-transactions"] });
  }, [queryClient]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    if (!userId) {
      toast.error("Carregando sessão... aguarde.");
      return;
    }

    const userMessage: Message = { role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { supabase } = await import("@/integrations/supabase/client");
      
      const apiMessages = [...messages.slice(1), userMessage].map(m => ({
        role: m.role,
        content: m.content
      }));

      const { data, error } = await supabase.functions.invoke("ai-agent-assistant", {
        body: {
          messages: apiMessages,
          user_id: userId,
          customer_context: { id: customerId, name: customerName }
        }
      });

      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.error);

      const assistantMessage: Message = {
        role: "assistant",
        content: data.content || "Desculpe, não consegui processar.",
        pdfHtml: data.pdf_html
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (data.data_changed) {
        refreshData();
        if (data.import_count) {
          toast.success(`✅ ${data.import_count} registros importados!`);
        }
      }

      if (data.pdf_html) {
        toast.success("📄 Relatório gerado!");
      }

    } catch (error) {
      console.error("Error:", error);
      toast.error("Erro ao processar mensagem.");
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "❌ Erro ao processar. Tente novamente."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickActions = [
    { label: "📊 Histórico", message: `Mostre o histórico completo do cliente ${customerName}` },
    { label: "💡 Sugestões", message: `Sugira ações para ${customerName}` },
    { label: "📄 Relatório 90 dias", message: `Gere relatório financeiro dos últimos 90 dias de ${customerName}` }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex flex-col h-full bg-background border-l"
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm">Assistente IA</h3>
          <p className="text-xs text-white/80 truncate">{customerName}</p>
        </div>
        <button
          onClick={onClose}
          className="rounded-full p-1 hover:bg-white/20 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3"
        style={{ display: 'flex', flexDirection: 'column' }}
      >
        <div className="flex-1" />
        <div className="space-y-3">
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-2 ${message.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300"
                }`}
              >
                {message.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {message.role === "assistant" ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none text-xs">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                    {message.pdfHtml && (
                      <Button
                        size="sm"
                        className="mt-2 h-7 text-xs bg-gradient-to-r from-purple-600 to-indigo-600"
                        onClick={() => {
                          const printWindow = window.open('', '_blank');
                          if (printWindow) {
                            printWindow.document.write(message.pdfHtml!);
                            printWindow.document.close();
                            setTimeout(() => printWindow.print(), 500);
                          }
                        }}
                      >
                        📄 Baixar PDF
                      </Button>
                    )}
                  </div>
                ) : (
                  <p className="text-xs">{message.content}</p>
                )}
              </div>
            </motion.div>
          ))}
          
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-2"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-1 rounded-2xl bg-muted px-3 py-2">
                <motion.span
                  className="h-1.5 w-1.5 rounded-full bg-purple-500"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                />
                <motion.span
                  className="h-1.5 w-1.5 rounded-full bg-purple-500"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                />
                <motion.span
                  className="h-1.5 w-1.5 rounded-full bg-purple-500"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                />
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      {messages.length <= 2 && (
        <div className="border-t px-3 py-2">
          <p className="mb-1.5 text-[10px] text-muted-foreground">Ações rápidas:</p>
          <div className="flex flex-wrap gap-1">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => {
                  if (!userId) return;
                  setInput(action.message);
                  setTimeout(() => sendMessage(), 100);
                }}
                className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] text-purple-700 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-300 transition-colors"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t p-3">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={userId ? "Pergunte algo..." : "Carregando..."}
            disabled={isLoading || !userId}
            className="flex-1 h-9 text-sm"
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading || !userId}
            size="icon"
            className="bg-gradient-to-r from-purple-600 to-indigo-600 h-9 w-9"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
