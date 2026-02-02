import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useQueryClient } from "@tanstack/react-query";

const SendIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const BotIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
    <rect x="3" y="11" width="18" height="10" rx="2" />
    <circle cx="12" cy="5" r="2" />
    <path d="M12 7v4" />
    <line x1="8" y1="16" x2="8" y2="16" />
    <line x1="16" y1="16" x2="16" y2="16" />
  </svg>
);

const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AIAssistantChatProps {
  onClose: () => void;
  context?: {
    type: "customer";
    customerId: string;
    customerName: string;
  };
}

export default function AIAssistantChat({ onClose, context }: AIAssistantChatProps) {
  const queryClient = useQueryClient();
  
  const getInitialMessage = () => {
    if (context?.type === "customer") {
      return {
        role: "assistant" as const,
        content: `Olá! 👋 Estou analisando o cliente **${context.customerName}**.\n\nPosso ajudar você a:\n\n• 📊 Analisar histórico de compras\n• 📅 Ver agendamentos\n• 💡 Sugerir ações de retenção\n• 📝 Criar tarefas de follow-up\n• 💰 Ver situação financeira\n\nO que você gostaria de saber sobre este cliente?`
      };
    }
    
    return {
      role: "assistant" as const,
      content: "Olá! 👋 Sou seu assistente de IA. Posso ajudar você a:\n\n• 📅 Gerenciar agendamentos\n• 👥 Buscar e cadastrar clientes\n• 💰 Consultar finanças\n• 📦 Verificar estoque\n• ✅ Criar tarefas\n• 📥 Importar dados em massa\n• 📄 Gerar PDFs\n\nComo posso ajudar?"
    };
  };

  const [messages, setMessages] = useState<Message[]>([getInitialMessage()]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);
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

  // Invalidar queries quando a IA faz operações
  const refreshData = useCallback(() => {
    // Invalidar todas as queries relacionadas
    queryClient.invalidateQueries({ queryKey: ["customers"] });
    queryClient.invalidateQueries({ queryKey: ["appointments"] });
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
    queryClient.invalidateQueries({ queryKey: ["inventory"] });
    queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
    queryClient.invalidateQueries({ queryKey: ["financial-transactions"] });
    queryClient.invalidateQueries({ queryKey: ["financial-categories"] });
  }, [queryClient]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !userId) return;

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

      // Adicionar contexto do cliente se existir
      const contextData = context ? {
        customer_context: {
          id: context.customerId,
          name: context.customerName
        }
      } : {};

      const { data, error } = await supabase.functions.invoke("ai-agent-assistant", {
        body: {
          messages: apiMessages,
          user_id: userId,
          ...contextData
        }
      });

      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.error);

      const assistantMessage: Message = {
        role: "assistant",
        content: data.content || "Desculpe, não consegui processar sua solicitação."
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Atualizar dados automaticamente após operações
      if (data.data_changed) {
        refreshData();
        
        // Se importou dados, mostrar progresso
        if (data.import_count) {
          toast.success(`✅ ${data.import_count} registros importados com sucesso!`);
        }
      }

      // Se gerou PDF, abrir em nova aba
      if (data.pdf_url) {
        window.open(data.pdf_url, "_blank");
        toast.success("PDF gerado com sucesso!");
      }

    } catch (error) {
      console.error("Error sending message:", error);
      
      let errorMessage = "Erro ao processar sua mensagem. Tente novamente.";
      if (error instanceof Error) {
        if (error.message.includes("429")) {
          errorMessage = "Muitas requisições. Aguarde alguns segundos e tente novamente.";
        } else if (error.message.includes("402")) {
          errorMessage = "Créditos de IA esgotados. Entre em contato com o suporte.";
        }
      }
      
      toast.error(errorMessage);
      
      setMessages(prev => [...prev, {
        role: "assistant",
        content: `❌ ${errorMessage}`
      }]);
    } finally {
      setIsLoading(false);
      setImportProgress(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickActions = context?.type === "customer" 
    ? [
        { label: "📊 Histórico do cliente", message: `Mostre o histórico completo do cliente ${context.customerName}` },
        { label: "💡 Sugestões de ações", message: `Sugira ações para melhorar o relacionamento com ${context.customerName}` },
        { label: "📅 Agendar follow-up", message: `Crie uma tarefa de follow-up para ${context.customerName}` }
      ]
    : [
        { label: "📅 Agendamentos de hoje", message: "Quais são meus agendamentos de hoje?" },
        { label: "💰 Resumo financeiro", message: "Como está meu financeiro esta semana?" },
        { label: "📥 Importar clientes", message: "Quero importar uma lista de clientes" },
        { label: "📄 Gerar relatório PDF", message: "Gere um relatório PDF do meu dia" }
      ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="fixed bottom-24 right-6 z-[9998] flex h-[500px] w-[380px] flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl sm:h-[550px] sm:w-[400px]"
      style={{ position: 'fixed' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 border-b bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 text-white">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
          <BotIcon />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold">Assistente IA</h3>
          <p className="text-xs text-white/80">
            {context?.type === "customer" ? `Analisando: ${context.customerName}` : "Pronto para ajudar"}
          </p>
        </div>
        <button
          onClick={onClose}
          className="rounded-full p-1 hover:bg-white/20 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4"
        style={{ display: 'flex', flexDirection: 'column' }}
      >
        <div className="flex-1" />
        <div className="space-y-4">
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300"
                }`}
              >
                {message.role === "user" ? <UserIcon /> : <BotIcon />}
              </div>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {message.role === "assistant" ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm">{message.content}</p>
                )}
              </div>
            </motion.div>
          ))}
          
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300">
                <BotIcon />
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1 rounded-2xl bg-muted px-4 py-3">
                  <motion.span
                    className="h-2 w-2 rounded-full bg-purple-500"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                  />
                  <motion.span
                    className="h-2 w-2 rounded-full bg-purple-500"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                  />
                  <motion.span
                    className="h-2 w-2 rounded-full bg-purple-500"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                  />
                </div>
                {importProgress && (
                  <div className="text-xs text-muted-foreground px-2">
                    Importando: {importProgress.current}/{importProgress.total}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      {messages.length <= 2 && (
        <div className="border-t px-4 py-2">
          <p className="mb-2 text-xs text-muted-foreground">Ações rápidas:</p>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => {
                  setInput(action.message);
                  setTimeout(() => sendMessage(), 100);
                }}
                className="rounded-full bg-purple-100 px-3 py-1 text-xs text-purple-700 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-300 dark:hover:bg-purple-800 transition-colors"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua mensagem..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          >
            <SendIcon />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
