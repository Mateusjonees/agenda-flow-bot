import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Phone, Mail, User, CalendarPlus, ListTodo, Search, Filter, Pencil, Trash2, Maximize2, Minimize2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { CustomerSubscriptions } from "@/components/CustomerSubscriptions";
import { CustomerHistory } from "@/components/CustomerHistory";
import { CustomerDocuments } from "@/components/CustomerDocuments";
import { CustomerLoyalty } from "@/components/CustomerLoyalty";
import { useReadOnly, ReadOnlyWrapper } from "@/components/SubscriptionGuard";
import { ProposalEditDialog } from "@/components/ProposalEditDialog";
import { FileText, CreditCard } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  cpf: string | null;
  notes: string | null;
  source: string | null;
  created_at: string;
}

const Clientes = () => {
  const [searchParams] = useSearchParams();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>("info");
  const [isModalExpanded, setIsModalExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    cpf: "",
    notes: "",
    source: "",
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const [proposalDialogOpen, setProposalDialogOpen] = useState(false);
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState<any[]>([]);
  const [editCustomer, setEditCustomer] = useState({
    id: "",
    name: "",
    phone: "",
    email: "",
    cpf: "",
    notes: "",
    source: "",
  });
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    due_date: "",
    priority: "medium" as "low" | "medium" | "high",
    status: "pending" as "pending" | "completed" | "cancelled",
  });
  const [appointmentForm, setAppointmentForm] = useState({
    service: "",
    date: "",
    time: "",
    duration: "60",
    notes: "",
  });
  const [subscriptionForm, setSubscriptionForm] = useState({
    plan_id: "",
    payment_method: "pix",
  });
  const { toast } = useToast();
  const { isReadOnly } = useReadOnly();

  useEffect(() => {
    fetchCustomers();
    fetchSubscriptionPlans();
    
    // Verificar se há parâmetros de URL para abrir cliente específico
    const customerId = searchParams.get('customer');
    const tab = searchParams.get('tab');
    
    if (customerId && tab) {
      // Buscar o cliente específico e abrir o dialog
      const fetchSpecificCustomer = async () => {
        const { data } = await supabase
          .from("customers")
          .select("*")
          .eq("id", customerId)
          .single();
        
        if (data) {
          setSelectedCustomer(data);
          setSelectedTab(tab);
          setDetailsOpen(true);
        }
      };
      
      fetchSpecificCustomer();
    }
  }, [searchParams]);

  const fetchSubscriptionPlans = async () => {
    const { data } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("is_active", true)
      .order("name");
    setSubscriptionPlans(data || []);
  };

  // Aplicar filtro quando searchTerm mudar
  useEffect(() => {
    console.log('🔍 ========== INICIANDO PESQUISA ==========');
    console.log('🔍 Termo pesquisado:', searchTerm);
    console.log('📋 Total de clientes no sistema:', customers.length);
    console.log('📋 Lista de todos os clientes:', customers.map(c => ({ id: c.id, name: c.name })));
    
    if (!searchTerm || searchTerm.trim() === "") {
      console.log('✅ Sem filtro - mostrando todos os clientes');
      setFilteredCustomers(customers);
      return;
    }

    const searchLower = searchTerm.toLowerCase().trim();
    const searchClean = searchTerm.replace(/\D/g, '');
    
    console.log('🔍 Termo normalizado (minúsculas):', searchLower);
    console.log('🔍 Termo sem formatação (apenas números):', searchClean);
    
    const filtered = customers.filter((customer, index) => {
      console.log(`\n--- Verificando cliente ${index + 1}/${customers.length} ---`);
      console.log('ID:', customer.id);
      console.log('Nome:', customer.name);
      console.log('Telefone:', customer.phone);
      console.log('Email:', customer.email);
      console.log('CPF:', customer.cpf);
      
      // Buscar no nome
      if (customer.name && customer.name.toLowerCase().includes(searchLower)) {
        console.log('✅ MATCH no nome!');
        return true;
      }
      
      // Buscar no telefone (com e sem formatação)
      if (customer.phone) {
        if (customer.phone.includes(searchTerm)) {
          console.log('✅ MATCH no telefone (com formatação)!');
          return true;
        }
        const phoneClean = customer.phone.replace(/\D/g, '');
        if (phoneClean.includes(searchClean)) {
          console.log('✅ MATCH no telefone (sem formatação)!');
          return true;
        }
      }
      
      // Buscar no email
      if (customer.email && customer.email.toLowerCase().includes(searchLower)) {
        console.log('✅ MATCH no email!');
        return true;
      }
      
      // Buscar no CPF (com e sem formatação)
      if (customer.cpf) {
        if (customer.cpf.includes(searchTerm)) {
          console.log('✅ MATCH no CPF (com formatação)!');
          return true;
        }
        const cpfClean = customer.cpf.replace(/\D/g, '');
        if (cpfClean.includes(searchClean)) {
          console.log('✅ MATCH no CPF (sem formatação)!');
          return true;
        }
      }
      
      console.log('❌ SEM MATCH - cliente não passou no filtro');
      return false;
    });

    console.log('\n🎯 ========== RESULTADO DO FILTRO ==========');
    console.log('🎯 Total de clientes filtrados:', filtered.length);
    console.log('🎯 IDs e nomes dos clientes filtrados:');
    filtered.forEach((c, i) => {
      console.log(`  ${i + 1}. ID: ${c.id} | Nome: ${c.name}`);
    });
    console.log('🎯 ==========================================\n');
    
    setFilteredCustomers(filtered);
  }, [customers, searchTerm]);

  const fetchCustomers = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    console.log('📥 Clientes carregados:', data?.length || 0);
    
    if (!error && data) {
      setCustomers(data);
      setFilteredCustomers(data);
    } else {
      console.error("Erro ao buscar clientes:", error);
      setCustomers([]);
      setFilteredCustomers([]);
    }
    
    setLoading(false);
  };

  const handleAddCustomer = async () => {
    if (!newCustomer.name || !newCustomer.phone) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome e telefone são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    // Validar formato do CPF se fornecido
    if (newCustomer.cpf && newCustomer.cpf.trim()) {
      const cpfClean = newCustomer.cpf.replace(/\D/g, '');
      if (cpfClean.length !== 11) {
        toast({
          title: "CPF inválido",
          description: "O CPF deve ter 11 dígitos.",
          variant: "destructive",
        });
        return;
      }
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("customers").insert({
      user_id: user.id,
      name: newCustomer.name,
      phone: newCustomer.phone,
      email: newCustomer.email || null,
      cpf: newCustomer.cpf || null,
      notes: newCustomer.notes || null,
      source: newCustomer.source || null,
    });

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o cliente.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Cliente adicionado!",
        description: "O cliente foi cadastrado com sucesso.",
      });
      setDialogOpen(false);
      setNewCustomer({ name: "", phone: "", email: "", cpf: "", notes: "", source: "" });
      await fetchCustomers();
    }
  };

  const handleAddTask = async () => {
    if (!selectedCustomer || !taskForm.title || !taskForm.due_date) {
      toast({
        title: "Campos obrigatórios",
        description: "Título e data de vencimento são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("tasks").insert({
      user_id: user.id,
      customer_id: selectedCustomer.id,
      title: taskForm.title,
      description: taskForm.description || null,
      type: "manual",
      due_date: taskForm.due_date,
      priority: taskForm.priority,
      status: taskForm.status,
    });

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível criar a tarefa.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Tarefa criada!",
        description: "A tarefa foi adicionada com sucesso.",
      });
      setTaskDialogOpen(false);
      setTaskForm({
        title: "",
        description: "",
        due_date: "",
        priority: "medium",
        status: "pending",
      });
    }
  };

  const handleAddAppointment = async () => {
    if (!selectedCustomer || !appointmentForm.service || !appointmentForm.date || !appointmentForm.time) {
      toast({
        title: "Campos obrigatórios",
        description: "Serviço, data e horário são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const startDateTime = new Date(`${appointmentForm.date}T${appointmentForm.time}`);
    const endDateTime = new Date(startDateTime.getTime() + parseInt(appointmentForm.duration) * 60000);

    const { error } = await supabase.from("appointments").insert({
      customer_id: selectedCustomer.id,
      user_id: user.id,
      title: appointmentForm.service,
      description: appointmentForm.notes || "",
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      notes: appointmentForm.notes || "",
      status: "scheduled",
    });

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível criar o agendamento.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Agendamento criado!",
        description: "O agendamento foi adicionado com sucesso.",
      });
      setAppointmentDialogOpen(false);
      setAppointmentForm({
        service: "",
        date: "",
        time: "",
        duration: "60",
        notes: "",
      });
    }
  };

  const handleAddSubscription = async () => {
    if (!selectedCustomer || !subscriptionForm.plan_id) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, selecione um plano",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const selectedPlan = subscriptionPlans.find(p => p.id === subscriptionForm.plan_id);
      if (!selectedPlan) throw new Error("Plano não encontrado");

      // Calcular próxima data de cobrança
      const nextBillingDate = new Date();
      if (selectedPlan.billing_frequency === "monthly") {
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
      } else if (selectedPlan.billing_frequency === "quarterly") {
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 3);
      } else if (selectedPlan.billing_frequency === "semiannual") {
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 6);
      } else if (selectedPlan.billing_frequency === "annual") {
        nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
      }

      const { error } = await supabase.from("subscriptions").insert({
        user_id: user.id,
        customer_id: selectedCustomer.id,
        plan_id: subscriptionForm.plan_id,
        status: "active",
        next_billing_date: nextBillingDate.toISOString(),
        start_date: new Date().toISOString(),
      });

      if (error) throw error;

      toast({
        title: "Assinatura criada",
        description: "A assinatura foi criada com sucesso",
      });

      setSubscriptionDialogOpen(false);
      setSubscriptionForm({ plan_id: "", payment_method: "pix" });
      
      // Atualizar tab para mostrar a nova assinatura
      setSelectedTab("subscriptions");
    } catch (error: any) {
      toast({
        title: "Erro ao criar assinatura",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditCustomer = async () => {
    if (!editCustomer.name || !editCustomer.phone) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome e telefone são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    // Validar formato do CPF se fornecido
    if (editCustomer.cpf && editCustomer.cpf.trim()) {
      const cpfClean = editCustomer.cpf.replace(/\D/g, '');
      if (cpfClean.length !== 11) {
        toast({
          title: "CPF inválido",
          description: "O CPF deve ter 11 dígitos.",
          variant: "destructive",
        });
        return;
      }
    }

    const { error } = await supabase
      .from("customers")
      .update({
        name: editCustomer.name,
        phone: editCustomer.phone,
        email: editCustomer.email || null,
        cpf: editCustomer.cpf || null,
        notes: editCustomer.notes || null,
        source: editCustomer.source || null,
      })
      .eq("id", editCustomer.id);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o cliente.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Cliente atualizado!",
        description: "As informações foram atualizadas com sucesso.",
      });
      setEditDialogOpen(false);
      await fetchCustomers();
      // Atualizar selectedCustomer se for o mesmo
      if (selectedCustomer && selectedCustomer.id === editCustomer.id) {
        setSelectedCustomer({
          ...selectedCustomer,
          name: editCustomer.name,
          phone: editCustomer.phone,
          email: editCustomer.email || null,
          cpf: editCustomer.cpf || null,
          notes: editCustomer.notes || null,
          source: editCustomer.source || null,
        });
      }
    }
  };

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;

    const { error } = await supabase
      .from("customers")
      .delete()
      .eq("id", customerToDelete.id);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o cliente.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Cliente excluído!",
        description: "O cliente foi removido com sucesso.",
      });
      setDeleteDialogOpen(false);
      setDetailsOpen(false);
      setCustomerToDelete(null);
      await fetchCustomers();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-1 sm:mb-2">Clientes</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Gerencie sua base de clientes, fidelidade e cupons</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 w-full sm:w-auto flex-shrink-0" disabled={isReadOnly}>
              <Plus className="w-4 h-4" />
              <span>Novo Cliente</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Novo Cliente</DialogTitle>
              <DialogDescription>
                Cadastre um novo cliente na sua base
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  placeholder="Nome completo"
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefone *</Label>
                <Input
                  id="phone"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div>
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  value={newCustomer.cpf}
                  onChange={(e) => {
                    // Formatar CPF automaticamente enquanto digita
                    let value = e.target.value.replace(/\D/g, '');
                    if (value.length <= 11) {
                      value = value.replace(/(\d{3})(\d)/, '$1.$2');
                      value = value.replace(/(\d{3})(\d)/, '$1.$2');
                      value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
                      setNewCustomer({ ...newCustomer, cpf: value });
                    }
                  }}
                  placeholder="000.000.000-00"
                  maxLength={14}
                />
              </div>
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div>
                <Label htmlFor="source">De onde veio o cliente?</Label>
                <Select value={newCustomer.source} onValueChange={(value) => setNewCustomer({ ...newCustomer, source: value })}>
                  <SelectTrigger id="source">
                    <SelectValue placeholder="Selecione a origem" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="indicacao">Indicação</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="google">Google</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="site">Site</SelectItem>
                    <SelectItem value="outdoor">Outdoor/Placa</SelectItem>
                    <SelectItem value="panfleto">Panfleto</SelectItem>
                    <SelectItem value="radio">Rádio</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={newCustomer.notes}
                  onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })}
                  placeholder="Notas sobre o cliente..."
                  rows={3}
                />
              </div>
              <Button onClick={handleAddCustomer} className="w-full" disabled={isReadOnly}>
                Adicionar Cliente
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Barra de pesquisa */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, telefone, email ou CPF..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-10 sm:h-11 text-sm sm:text-base"
        />
      </div>

      {loading ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Carregando clientes...</p>
          </CardContent>
        </Card>
      ) : filteredCustomers.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Lista de Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <p>{searchTerm ? "Nenhum cliente encontrado com esse termo." : "Nenhum cliente cadastrado. Adicione seu primeiro cliente!"}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCustomers.map((customer) => (
            <Card 
              key={customer.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => {
                setSelectedCustomer(customer);
                setDetailsOpen(true);
              }}
            >
              <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                  <span className="truncate">{customer.name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5 sm:space-y-2 p-3 sm:p-4 pt-0">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="truncate">{customer.phone}</span>
                </div>
                {customer.email && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="truncate">{customer.email}</span>
                  </div>
                )}
                {customer.notes && (
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mt-2 sm:mt-3">
                    {customer.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de detalhes do cliente */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent 
          className={`${isModalExpanded ? 'max-w-[95vw] h-[95vh]' : 'max-w-4xl h-[90vh]'} p-3 sm:p-4 overflow-hidden flex flex-col transition-all duration-300`}
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          {selectedCustomer && (
            <>
              <DialogHeader className="space-y-1 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                    <span className="truncate">{selectedCustomer.name}</span>
                  </DialogTitle>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsModalExpanded(false)}
                      className="h-7 w-7 p-0 flex-shrink-0"
                      title="Minimizar"
                      disabled={!isModalExpanded}
                    >
                      <Minimize2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsModalExpanded(true)}
                      className="h-7 w-7 p-0 flex-shrink-0"
                      title="Maximizar"
                      disabled={isModalExpanded}
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDetailsOpen(false)}
                      className="h-7 w-7 p-0 flex-shrink-0"
                      title="Fechar"
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <DialogDescription className="text-xs">
                  Informações completas do cliente
                </DialogDescription>
              </DialogHeader>

              <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mt-1.5 flex-1 flex flex-col min-h-0">
                <TabsList className="grid w-full grid-cols-4 h-8 flex-shrink-0">
                  <TabsTrigger value="info" className="text-xs py-1 px-1.5">Info</TabsTrigger>
                  <TabsTrigger value="history" className="text-xs py-1 px-1.5">Histórico</TabsTrigger>
                  <TabsTrigger value="subscriptions" className="text-xs py-1 px-1.5">Assinaturas</TabsTrigger>
                  <TabsTrigger value="loyalty" className="text-xs py-1 px-1.5">Fidelidade</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-2 flex-1 overflow-y-auto mt-2 pr-1 pb-0">
                  {/* Botões de ação rápida */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1 gap-2 h-9 sm:h-10 text-xs sm:text-sm"
                      onClick={() => {
                        setEditCustomer({
                          id: selectedCustomer.id,
                          name: selectedCustomer.name,
                          phone: selectedCustomer.phone,
                          email: selectedCustomer.email || "",
                          cpf: selectedCustomer.cpf || "",
                          notes: selectedCustomer.notes || "",
                          source: selectedCustomer.source || "",
                        });
                        setEditDialogOpen(true);
                      }}
                      disabled={isReadOnly}
                    >
                      <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      Editar Cliente
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 gap-2 h-9 sm:h-10 text-xs sm:text-sm text-destructive hover:text-destructive"
                      onClick={() => {
                        setCustomerToDelete(selectedCustomer);
                        setDeleteDialogOpen(true);
                      }}
                      disabled={isReadOnly}
                    >
                      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      Excluir Cliente
                    </Button>
                <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="flex-1 gap-2 h-9 sm:h-10 text-xs sm:text-sm" disabled={isReadOnly}>
                      <ListTodo className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      Nova Tarefa
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nova Tarefa para {selectedCustomer.name}</DialogTitle>
                      <DialogDescription>
                        Crie uma tarefa relacionada a este cliente
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="task-title">Título *</Label>
                        <Input
                          id="task-title"
                          value={taskForm.title}
                          onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                          placeholder="Ex: Ligar para confirmar agendamento"
                        />
                      </div>
                      <div>
                        <Label htmlFor="task-description">Descrição</Label>
                        <Textarea
                          id="task-description"
                          value={taskForm.description}
                          onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                          placeholder="Detalhes da tarefa..."
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="task-due-date">Data de Vencimento *</Label>
                        <Input
                          id="task-due-date"
                          type="date"
                          value={taskForm.due_date}
                          onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="task-priority">Prioridade</Label>
                        <Select value={taskForm.priority} onValueChange={(value: any) => setTaskForm({ ...taskForm, priority: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Baixa</SelectItem>
                            <SelectItem value="medium">Média</SelectItem>
                            <SelectItem value="high">Alta</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="task-status">Status</Label>
                        <Select value={taskForm.status} onValueChange={(value: any) => setTaskForm({ ...taskForm, status: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pendente</SelectItem>
                            <SelectItem value="completed">Concluída</SelectItem>
                            <SelectItem value="cancelled">Cancelada</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={handleAddTask} className="w-full" disabled={isReadOnly}>
                        Criar Tarefa
                      </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={appointmentDialogOpen} onOpenChange={setAppointmentDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="flex-1 gap-2 h-9 sm:h-10 text-xs sm:text-sm" disabled={isReadOnly}>
                        <CalendarPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Novo Agendamento
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Novo Agendamento para {selectedCustomer.name}</DialogTitle>
                        <DialogDescription>
                          Crie um agendamento relacionado a este cliente
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="appointment-service">Serviço *</Label>
                          <Input
                            id="appointment-service"
                            value={appointmentForm.service}
                            onChange={(e) => setAppointmentForm({ ...appointmentForm, service: e.target.value })}
                            placeholder="Ex: Corte de cabelo"
                          />
                        </div>
                        <div>
                          <Label htmlFor="appointment-date">Data *</Label>
                          <Input
                            id="appointment-date"
                            type="date"
                            value={appointmentForm.date}
                            onChange={(e) => setAppointmentForm({ ...appointmentForm, date: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="appointment-time">Horário *</Label>
                          <Input
                            id="appointment-time"
                            type="time"
                            value={appointmentForm.time}
                            onChange={(e) => setAppointmentForm({ ...appointmentForm, time: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="appointment-duration">Duração</Label>
                          <Select value={appointmentForm.duration} onValueChange={(value) => setAppointmentForm({ ...appointmentForm, duration: value })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="30">30 minutos</SelectItem>
                              <SelectItem value="60">1 hora</SelectItem>
                              <SelectItem value="90">1h 30min</SelectItem>
                              <SelectItem value="120">2 horas</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="appointment-notes">Observações</Label>
                          <Textarea
                            id="appointment-notes"
                            value={appointmentForm.notes}
                            onChange={(e) => setAppointmentForm({ ...appointmentForm, notes: e.target.value })}
                            placeholder="Detalhes do agendamento..."
                            rows={3}
                          />
                        </div>
                        <Button onClick={handleAddAppointment} className="w-full" disabled={isReadOnly}>
                          Criar Agendamento
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={proposalDialogOpen} onOpenChange={setProposalDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="flex-1 gap-2 h-9 sm:h-10 text-xs sm:text-sm" disabled={isReadOnly}>
                        <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Nova Proposta
                      </Button>
                    </DialogTrigger>
                  </Dialog>

                  <Dialog open={subscriptionDialogOpen} onOpenChange={setSubscriptionDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="flex-1 gap-2 h-9 sm:h-10 text-xs sm:text-sm" disabled={isReadOnly}>
                        <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Nova Assinatura
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Nova Assinatura para {selectedCustomer.name}</DialogTitle>
                        <DialogDescription>
                          Crie uma assinatura para este cliente
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="subscription-plan">Plano *</Label>
                          <Select value={subscriptionForm.plan_id} onValueChange={(value) => setSubscriptionForm({ ...subscriptionForm, plan_id: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um plano" />
                            </SelectTrigger>
                            <SelectContent>
                              {subscriptionPlans.map((plan) => (
                                <SelectItem key={plan.id} value={plan.id}>
                                  {plan.name} - R$ {Number(plan.price).toFixed(2)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="subscription-payment">Método de Pagamento</Label>
                          <Select value={subscriptionForm.payment_method} onValueChange={(value) => setSubscriptionForm({ ...subscriptionForm, payment_method: value })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pix">PIX</SelectItem>
                              <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                              <SelectItem value="boleto">Boleto</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button onClick={handleAddSubscription} className="w-full" disabled={isReadOnly}>
                          Criar Assinatura
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                
                <div className="space-y-3 sm:space-y-4">
                  {/* Informações básicas */}
                  <Card>
                    <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
                      <CardTitle className="text-sm sm:text-base">Informações de Contato</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 p-3 sm:p-4 pt-0">
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                        <span className="break-all">{selectedCustomer.phone}</span>
                      </div>
                      {selectedCustomer.cpf && (
                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                          <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                          <span className="break-all">CPF: {selectedCustomer.cpf}</span>
                        </div>
                      )}
                      {selectedCustomer.email && (
                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                          <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                          <span className="break-all">{selectedCustomer.email}</span>
                        </div>
                      )}
                      {selectedCustomer.source && (
                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                          <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                          <span>
                            Origem: <span className="font-medium">
                              {selectedCustomer.source === 'indicacao' && 'Indicação'}
                              {selectedCustomer.source === 'facebook' && 'Facebook'}
                              {selectedCustomer.source === 'instagram' && 'Instagram'}
                              {selectedCustomer.source === 'google' && 'Google'}
                              {selectedCustomer.source === 'whatsapp' && 'WhatsApp'}
                              {selectedCustomer.source === 'site' && 'Site'}
                              {selectedCustomer.source === 'outdoor' && 'Outdoor/Placa'}
                              {selectedCustomer.source === 'panfleto' && 'Panfleto'}
                              {selectedCustomer.source === 'radio' && 'Rádio'}
                              {selectedCustomer.source === 'outro' && 'Outro'}
                            </span>
                          </span>
                        </div>
                      )}
                      {selectedCustomer.notes && (
                        <div className="pt-2 border-t">
                          <p className="text-xs sm:text-sm text-muted-foreground">{selectedCustomer.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Documentos anexados */}
                  <CustomerDocuments customerId={selectedCustomer.id} />
                </div>
                </TabsContent>

                <TabsContent value="history" className="flex-1 overflow-y-auto mt-2 pr-1 pb-0">
                  <CustomerHistory customerId={selectedCustomer.id} />
                </TabsContent>

                <TabsContent value="subscriptions" className="flex-1 overflow-y-auto mt-2 pr-1 pb-0">
                  <CustomerSubscriptions customerId={selectedCustomer.id} />
                </TabsContent>

                <TabsContent value="loyalty" className="flex-1 overflow-y-auto mt-2 pr-1 pb-0">
                  <CustomerLoyalty customerId={selectedCustomer.id} />
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de edição de cliente */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>
              Atualize as informações do cliente
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nome *</Label>
              <Input
                id="edit-name"
                value={editCustomer.name}
                onChange={(e) => setEditCustomer({ ...editCustomer, name: e.target.value })}
                placeholder="Nome completo"
              />
            </div>
            <div>
              <Label htmlFor="edit-phone">Telefone *</Label>
              <Input
                id="edit-phone"
                value={editCustomer.phone}
                onChange={(e) => setEditCustomer({ ...editCustomer, phone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>
            <div>
              <Label htmlFor="edit-cpf">CPF</Label>
              <Input
                id="edit-cpf"
                value={editCustomer.cpf}
                onChange={(e) => {
                  // Formatar CPF automaticamente enquanto digita
                  let value = e.target.value.replace(/\D/g, '');
                  if (value.length <= 11) {
                    value = value.replace(/(\d{3})(\d)/, '$1.$2');
                    value = value.replace(/(\d{3})(\d)/, '$1.$2');
                    value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
                    setEditCustomer({ ...editCustomer, cpf: value });
                  }
                }}
                placeholder="000.000.000-00"
                maxLength={14}
              />
            </div>
            <div>
              <Label htmlFor="edit-email">E-mail</Label>
              <Input
                id="edit-email"
                type="email"
                value={editCustomer.email}
                onChange={(e) => setEditCustomer({ ...editCustomer, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>
            <div>
              <Label htmlFor="edit-source">De onde veio o cliente?</Label>
              <Select value={editCustomer.source} onValueChange={(value) => setEditCustomer({ ...editCustomer, source: value })}>
                <SelectTrigger id="edit-source">
                  <SelectValue placeholder="Selecione a origem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="indicacao">Indicação</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="google">Google</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="site">Site</SelectItem>
                  <SelectItem value="outdoor">Outdoor/Placa</SelectItem>
                  <SelectItem value="panfleto">Panfleto</SelectItem>
                  <SelectItem value="radio">Rádio</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-notes">Observações</Label>
              <Textarea
                id="edit-notes"
                value={editCustomer.notes}
                onChange={(e) => setEditCustomer({ ...editCustomer, notes: e.target.value })}
                placeholder="Notas sobre o cliente..."
                rows={3}
              />
            </div>
            <Button onClick={handleEditCustomer} className="w-full" disabled={isReadOnly}>
              Salvar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja excluir?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O cliente <strong>{customerToDelete?.name}</strong> será permanentemente removido do sistema, incluindo todo o histórico, fidelidade e cupons associados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCustomerToDelete(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCustomer}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir Cliente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ProposalEditDialog
        proposal={null}
        open={proposalDialogOpen}
        onOpenChange={setProposalDialogOpen}
        onSuccess={() => {
          fetchCustomers();
          setProposalDialogOpen(false);
          toast({
            title: "Proposta criada",
            description: "A proposta foi criada com sucesso",
          });
        }}
        customers={customers}
        defaultCustomerId={selectedCustomer?.id}
      />
    </div>
  );
};

export default Clientes;