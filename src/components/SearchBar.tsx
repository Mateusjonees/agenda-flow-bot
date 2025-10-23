import { useState } from "react";
import { Search, X, Calendar, Users, FileText, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export function SearchBar() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const { data: results, isLoading } = useQuery({
    queryKey: ["search", search],
    queryFn: async () => {
      if (!search || search.length < 2) return { appointments: [], customers: [], proposals: [], transactions: [] };

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { appointments: [], customers: [], proposals: [], transactions: [] };

      const searchPattern = `%${search}%`;

      // Buscar agendamentos
      const { data: appointments } = await supabase
        .from("appointments")
        .select("id, title, start_time, customers(name)")
        .eq("user_id", user.id)
        .ilike("title", searchPattern)
        .limit(5);

      // Buscar clientes
      const { data: customers } = await supabase
        .from("customers")
        .select("id, name, phone, email")
        .eq("user_id", user.id)
        .or(`name.ilike.${searchPattern},phone.ilike.${searchPattern},email.ilike.${searchPattern}`)
        .limit(5);

      // Buscar propostas
      const { data: proposals } = await supabase
        .from("proposals")
        .select("id, title, status, customers(name)")
        .eq("user_id", user.id)
        .ilike("title", searchPattern)
        .limit(5);

      // Buscar transações
      const { data: transactions } = await supabase
        .from("financial_transactions")
        .select("id, description, amount, type")
        .eq("user_id", user.id)
        .ilike("description", searchPattern)
        .limit(5);

      return {
        appointments: appointments || [],
        customers: customers || [],
        proposals: proposals || [],
        transactions: transactions || [],
      };
    },
    enabled: search.length >= 2,
  });

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
    }
  };

  return (
    <>
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar clientes, agendamentos..."
          className="w-full h-9 pl-9 pr-4 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          onClick={() => setOpen(true)}
          readOnly
        />
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Buscar clientes, agendamentos..." 
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          {isLoading && search.length >= 2 && (
            <div className="p-4 text-sm text-center text-muted-foreground">
              Buscando...
            </div>
          )}
          
          {!isLoading && search.length >= 2 && (
            <>
              <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>

              {results?.customers && results.customers.length > 0 && (
                <CommandGroup heading="Clientes">
                  {results.customers.map((customer: any) => (
                    <CommandItem
                      key={customer.id}
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
                <CommandGroup heading="Agendamentos">
                  {results.appointments.map((apt: any) => (
                    <CommandItem
                      key={apt.id}
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
            </>
          )}

          {search.length < 2 && (
            <div className="p-4 text-sm text-center text-muted-foreground">
              Digite pelo menos 2 caracteres para buscar
            </div>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
