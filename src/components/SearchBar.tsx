import { useState, useEffect, useRef } from "react";
import { Search, Calendar, Users, FileText, DollarSign, CheckSquare, Package, CreditCard, Mic, MicOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Command,
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export function SearchBar() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const navigate = useNavigate();

  // Adicionar atalho Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        e.stopPropagation();
        setOpen(true);
      }
    };

    document.addEventListener("keydown", down, true);
    return () => document.removeEventListener("keydown", down, true);
  }, []);

  const ensureMicrophonePermission = async () => {
    if (!navigator.mediaDevices?.getUserMedia) return;

    // Já tem permissão/stream ativo
    if (micStreamRef.current) return;

    try {
      micStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Não precisamos do áudio em si; é só para disparar o prompt de permissão.
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    } catch (err: any) {
      console.error("[SearchBar] mic permission error", err);
      toast.error("Permissão de microfone negada. Libere o microfone no navegador.");
      throw err;
    }
  };

  // Voice search functions
  const startVoiceSearch = async () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      toast.error("Seu navegador não suporta busca por voz");
      return;
    }

    // Garante que o navegador peça permissão (em alguns devices o SpeechRecognition não dispara prompt)
    await ensureMicrophonePermission();

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = "pt-BR";
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;

    recognitionRef.current.onstart = () => {
      console.log("[SearchBar] speech recognition started");
      setIsListening(true);
      toast.info("Ouvindo... Fale agora");
    };

    recognitionRef.current.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript ?? "";
      console.log("[SearchBar] transcript", transcript);
      setSearch(transcript);
      setIsListening(false);
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error("[SearchBar] speech recognition error", event);
      setIsListening(false);
      const code = event?.error ? ` (${event.error})` : "";
      toast.error(`Erro ao usar microfone${code}`);
    };

    recognitionRef.current.onend = () => {
      console.log("[SearchBar] speech recognition ended");
      setIsListening(false);
    };

    try {
      recognitionRef.current.start();
    } catch (err) {
      console.error("[SearchBar] start() failed", err);
      setIsListening(false);
      toast.error("Não foi possível iniciar a busca por voz");
    }
  };

  const stopVoiceSearch = () => {
    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    } catch {
      // ignore
    } finally {
      setIsListening(false);
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
        micStreamRef.current = null;
      }
    }
  };

  // Limpar busca quando o dialog fecha
  useEffect(() => {
    if (!open) {
      stopVoiceSearch();
      setSearch("");
    }
  }, [open]);

  const { data: results, isLoading } = useQuery({
    queryKey: ["search", search],
    queryFn: async () => {
      const empty = {
        appointments: [],
        customers: [],
        proposals: [],
        transactions: [],
        tasks: [],
        inventory: [],
        subscriptions: [],
      };

      try {
        const term = search.trim();
        if (!term || term.length < 2) return empty;

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) return empty;

        const searchPattern = `%${term}%`;

        const [
          appointmentsRes,
          customersRes,
          proposalsRes,
          transactionsRes,
          tasksRes,
          inventoryRes,
          subscriptionsRes,
        ] = await Promise.all([
          supabase
            .from("appointments")
            .select("id, title, start_time, description, customer_id, customers(name)")
            .eq("user_id", user.id)
            .or(`title.ilike.${searchPattern},description.ilike.${searchPattern}`)
            .order("start_time", { ascending: false })
            .limit(10),
          supabase
            .from("customers")
            .select("id, name, phone, email, notes")
            .eq("user_id", user.id)
            .or(
              `name.ilike.${searchPattern},phone.ilike.${searchPattern},email.ilike.${searchPattern},notes.ilike.${searchPattern}`,
            )
            .order("created_at", { ascending: false })
            .limit(10),
          supabase
            .from("proposals")
            .select("id, title, status, description, customer_id, customers(name)")
            .eq("user_id", user.id)
            .or(`title.ilike.${searchPattern},description.ilike.${searchPattern}`)
            .order("created_at", { ascending: false })
            .limit(10),
          supabase
            .from("financial_transactions")
            .select("id, description, amount, type, payment_method")
            .eq("user_id", user.id)
            .or(`description.ilike.${searchPattern},payment_method.ilike.${searchPattern}`)
            .order("transaction_date", { ascending: false })
            .limit(10),
          supabase
            .from("tasks")
            .select("id, title, description, status, priority")
            .eq("user_id", user.id)
            .or(`title.ilike.${searchPattern},description.ilike.${searchPattern}`)
            .order("created_at", { ascending: false })
            .limit(10),
          supabase
            .from("inventory_items")
            .select("id, name, description, category")
            .eq("user_id", user.id)
            .or(`name.ilike.${searchPattern},description.ilike.${searchPattern},category.ilike.${searchPattern}`)
            .order("created_at", { ascending: false })
            .limit(10),
          supabase
            .from("subscriptions")
            .select("id, status, customer_id, plan_id")
            .eq("user_id", user.id)
            .eq("type", "client")
            .order("created_at", { ascending: false })
            .limit(10),
        ]);

        if (appointmentsRes.error) console.error("[SearchBar] appointments", appointmentsRes.error);
        if (customersRes.error) console.error("[SearchBar] customers", customersRes.error);
        if (proposalsRes.error) console.error("[SearchBar] proposals", proposalsRes.error);
        if (transactionsRes.error) console.error("[SearchBar] transactions", transactionsRes.error);
        if (tasksRes.error) console.error("[SearchBar] tasks", tasksRes.error);
        if (inventoryRes.error) console.error("[SearchBar] inventory", inventoryRes.error);
        if (subscriptionsRes.error) console.error("[SearchBar] subscriptions", subscriptionsRes.error);

        const appointments: any[] = appointmentsRes.data ?? [];
        const customers: any[] = customersRes.data ?? [];
        const proposals: any[] = proposalsRes.data ?? [];
        const transactions: any[] = transactionsRes.data ?? [];
        const tasks: any[] = tasksRes.data ?? [];
        const inventory: any[] = inventoryRes.data ?? [];
        const subscriptionsRaw: any[] = subscriptionsRes.data ?? [];

        // Buscar informações complementares se houver assinaturas
        let subscriptions: any[] = [];
        if (subscriptionsRaw.length > 0) {
          const customerIds = [...new Set(subscriptionsRaw.map((s) => s.customer_id).filter(Boolean))];
          const planIds = [...new Set(subscriptionsRaw.map((s) => s.plan_id).filter(Boolean))];

          const [customersData, plansData] = await Promise.all([
            customerIds.length
              ? supabase.from("customers").select("id, name").in("id", customerIds)
              : Promise.resolve({ data: [], error: null } as any),
            planIds.length
              ? supabase.from("subscription_plans").select("id, name").in("id", planIds)
              : Promise.resolve({ data: [], error: null } as any),
          ]);

          subscriptions = subscriptionsRaw.map((sub) => ({
            ...sub,
            customer_name: customersData.data?.find((c: any) => c.id === sub.customer_id)?.name,
            plan_name: plansData.data?.find((p: any) => p.id === sub.plan_id)?.name,
          }));
        }

        const termLower = term.toLowerCase();

        // Filtrar agendamentos e propostas também pelo nome do cliente
        const filteredAppointments = appointments.filter(
          (apt) =>
            apt.title?.toLowerCase().includes(termLower) ||
            apt.description?.toLowerCase().includes(termLower) ||
            apt.customers?.name?.toLowerCase().includes(termLower),
        );

        const filteredProposals = proposals.filter(
          (prop) =>
            prop.title?.toLowerCase().includes(termLower) ||
            prop.description?.toLowerCase().includes(termLower) ||
            prop.customers?.name?.toLowerCase().includes(termLower),
        );

        const filteredSubscriptions = subscriptions.filter(
          (sub) =>
            sub.customer_name?.toLowerCase().includes(termLower) ||
            sub.plan_name?.toLowerCase().includes(termLower) ||
            sub.status?.toLowerCase().includes(termLower),
        );

        return {
          appointments: filteredAppointments,
          customers,
          proposals: filteredProposals,
          transactions,
          tasks,
          inventory,
          subscriptions: filteredSubscriptions,
        };
      } catch (err) {
        console.error("[SearchBar] search error", err);
        return empty;
      }
    },
    enabled: search.trim().length >= 2,
  });

  const hasAnyResults = Boolean(
    results &&
      ((results.customers?.length ?? 0) > 0 ||
        (results.appointments?.length ?? 0) > 0 ||
        (results.proposals?.length ?? 0) > 0 ||
        (results.transactions?.length ?? 0) > 0 ||
        (results.tasks?.length ?? 0) > 0 ||
        (results.inventory?.length ?? 0) > 0 ||
        (results.subscriptions?.length ?? 0) > 0),
  );

  const handleSelect = (type: string, id: string) => {
    setOpen(false);
    setSearch("");
    
    switch (type) {
      case "appointment":
        navigate("/agendamentos");
        break;
      case "customer":
        navigate("/clientes");
        break;
      case "proposal":
        navigate("/propostas");
        break;
      case "transaction":
        navigate("/financeiro");
        break;
      case "task":
        navigate("/tarefas");
        break;
      case "inventory":
        navigate("/estoque");
        break;
      case "subscription":
        navigate("/assinaturas");
        break;
    }
  };

  return (
    <>
      <div className="relative w-full max-w-md flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar em todo o sistema..."
            className="w-full h-9 pl-9 pr-20 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
            onClick={() => setOpen(true)}
            readOnly
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>
        <Button
          variant={isListening ? "destructive" : "outline"}
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={() => {
            setOpen(true);
            if (isListening) {
              stopVoiceSearch();
            } else {
              startVoiceSearch();
            }
          }}
          title={isListening ? "Parar busca por voz" : "Busca por voz"}
        >
          {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </Button>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen} commandProps={{ shouldFilter: false }}>
        <div className="relative">
          <CommandInput
            placeholder="Buscar em todo o sistema..."
            value={search}
            onValueChange={setSearch}
            className="pr-12"
          />
          <Button
            variant={isListening ? "destructive" : "ghost"}
            size="icon"
            className="absolute right-2 top-2 h-8 w-8"
            onClick={() => {
              if (isListening) {
                stopVoiceSearch();
              } else {
                startVoiceSearch();
              }
            }}
            title={isListening ? "Parar busca por voz" : "Busca por voz"}
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
        </div>
        <CommandList>
          {isLoading && search.trim().length >= 2 && (
            <div className="p-4 text-sm text-center text-muted-foreground">
              Buscando...
            </div>
          )}

          {!isLoading && search.trim().length >= 2 && (
            <>
                <CommandGroup heading="Clientes">
                  {results.customers.map((customer: any) => (
                    <CommandItem
                      key={customer.id}
                      value={`${customer.name ?? ""} ${customer.phone ?? ""} ${customer.email ?? ""}`}
                      onSelect={() => handleSelect("customer", customer.id)}
                      className="cursor-pointer"
                    >
                      <Users className="mr-2 h-4 w-4" />
                      <div className="flex-1">
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {customer.phone || customer.email}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {results?.appointments && results.appointments.length > 0 && (
                <CommandGroup heading="Atendimentos">
                  {results.appointments.map((apt: any) => (
                    <CommandItem
                      key={apt.id}
                      value={`${apt.title ?? ""} ${apt.description ?? ""} ${apt.customers?.name ?? ""}`}
                      onSelect={() => handleSelect("appointment", apt.id)}
                      className="cursor-pointer"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      <div className="flex-1">
                        <div className="font-medium">{apt.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {apt.customers?.name}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {results?.proposals && results.proposals.length > 0 && (
                <CommandGroup heading="Propostas">
                  {results.proposals.map((proposal: any) => (
                    <CommandItem
                      key={proposal.id}
                      value={`${proposal.title ?? ""} ${proposal.description ?? ""} ${proposal.customers?.name ?? ""} ${proposal.status ?? ""}`}
                      onSelect={() => handleSelect("proposal", proposal.id)}
                      className="cursor-pointer"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      <div className="flex-1">
                        <div className="font-medium">{proposal.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {proposal.customers?.name} • {proposal.status}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {results?.transactions && results.transactions.length > 0 && (
                <CommandGroup heading="Transações">
                  {results.transactions.map((transaction: any) => (
                    <CommandItem
                      key={transaction.id}
                      value={`${transaction.description ?? ""} ${transaction.payment_method ?? ""} ${transaction.type ?? ""} ${transaction.amount ?? ""}`}
                      onSelect={() => handleSelect("transaction", transaction.id)}
                      className="cursor-pointer"
                    >
                      <DollarSign className="mr-2 h-4 w-4" />
                      <div className="flex-1">
                        <div className="font-medium">{transaction.description}</div>
                        <div className="text-xs text-muted-foreground">
                          R$ {transaction.amount} • {transaction.type === "income" ? "Receita" : "Despesa"}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {results?.tasks && results.tasks.length > 0 && (
                <CommandGroup heading="Tarefas">
                  {results.tasks.map((task: any) => (
                    <CommandItem
                      key={task.id}
                      value={`${task.title ?? ""} ${task.description ?? ""} ${task.status ?? ""} ${task.priority ?? ""}`}
                      onSelect={() => handleSelect("task", task.id)}
                      className="cursor-pointer"
                    >
                      <CheckSquare className="mr-2 h-4 w-4" />
                      <div className="flex-1">
                        <div className="font-medium">{task.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {task.status} • {task.priority}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {results?.inventory && results.inventory.length > 0 && (
                <CommandGroup heading="Estoque">
                  {results.inventory.map((item: any) => (
                    <CommandItem
                      key={item.id}
                      value={`${item.name ?? ""} ${item.description ?? ""} ${item.category ?? ""}`}
                      onSelect={() => handleSelect("inventory", item.id)}
                      className="cursor-pointer"
                    >
                      <Package className="mr-2 h-4 w-4" />
                      <div className="flex-1">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.category} {item.sku ? `• SKU: ${item.sku}` : ''}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {results?.subscriptions && results.subscriptions.length > 0 && (
                <CommandGroup heading="Assinaturas">
                  {results.subscriptions.map((sub: any) => (
                    <CommandItem
                      key={sub.id}
                      value={`${sub.customer_name ?? ""} ${sub.plan_name ?? ""} ${sub.status ?? ""}`}
                      onSelect={() => handleSelect("subscription", sub.id)}
                      className="cursor-pointer"
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      <div className="flex-1">
                        <div className="font-medium">{sub.customer_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {sub.plan_name} • {sub.status}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </>
          )}

          {search.trim().length < 2 && (
            <div className="p-4 text-sm text-center text-muted-foreground">
              Digite pelo menos 2 caracteres para buscar
            </div>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
