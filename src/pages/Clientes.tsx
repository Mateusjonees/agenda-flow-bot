import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Phone, Mail, User, Gift, Ticket } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LoyaltyCard } from "@/components/LoyaltyCard";
import { CustomerCoupons } from "@/components/CustomerCoupons";

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  created_at: string;
}

const Clientes = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    notes: "",
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setCustomers(data);
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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("customers").insert({
      user_id: user.id,
      name: newCustomer.name,
      phone: newCustomer.phone,
      email: newCustomer.email || null,
      notes: newCustomer.notes || null,
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
      setNewCustomer({ name: "", phone: "", email: "", notes: "" });
      fetchCustomers();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Clientes</h1>
          <p className="text-muted-foreground">Gerencie sua base de clientes, fidelidade e cupons</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Cliente
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
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={newCustomer.notes}
                  onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })}
                  placeholder="Notas sobre o cliente..."
                  rows={3}
                />
              </div>
              <Button onClick={handleAddCustomer} className="w-full">
                Adicionar Cliente
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Carregando clientes...</p>
          </CardContent>
        </Card>
      ) : customers.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Lista de Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <p>Nenhum cliente cadastrado. Adicione seu primeiro cliente!</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {customers.map((customer) => (
            <Card 
              key={customer.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => {
                setSelectedCustomer(customer);
                setDetailsOpen(true);
              }}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="w-5 h-5 text-primary" />
                  {customer.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  {customer.phone}
                </div>
                {customer.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    {customer.email}
                  </div>
                )}
                {customer.notes && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-3">
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedCustomer && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <User className="w-6 h-6 text-primary" />
                  {selectedCustomer.name}
                </DialogTitle>
                <DialogDescription>
                  Informações do cliente, fidelidade e cupons disponíveis
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* Informações básicas */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Informações de Contato</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedCustomer.phone}</span>
                    </div>
                    {selectedCustomer.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span>{selectedCustomer.email}</span>
                      </div>
                    )}
                    {selectedCustomer.notes && (
                      <div className="pt-2 border-t">
                        <p className="text-sm text-muted-foreground">{selectedCustomer.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Cartão Fidelidade */}
                <LoyaltyCard customerId={selectedCustomer.id} />

                {/* Cupons */}
                <CustomerCoupons customerId={selectedCustomer.id} />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Clientes;