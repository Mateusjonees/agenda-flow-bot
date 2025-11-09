import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useReadOnly } from "@/components/SubscriptionGuard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Clock, DollarSign, Package, Copy, History, Search, Filter, Layers } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { ServiceStats } from "@/components/ServiceStats";
import { ServicePackageDialog } from "@/components/ServicePackageDialog";
import { PriceHistoryDialog } from "@/components/PriceHistoryDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  duration: number;
  price: number;
  color: string;
  is_active: boolean;
}

const Servicos = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isReadOnly } = useReadOnly();
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isPackageDialogOpen, setIsPackageDialogOpen] = useState(false);
  const [priceHistoryDialog, setPriceHistoryDialog] = useState<{ open: boolean; serviceId: string; serviceName: string }>({
    open: false,
    serviceId: "",
    serviceName: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    duration: "60",
    price: "",
    color: "#3B82F6",
    is_active: true,
  });

  useEffect(() => {
    checkAuth();
    fetchServices();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchServices = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("user_id", user.id)
      .order("name");

    if (error) {
      toast({
        title: "Erro ao carregar serviços",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setServices(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      toast({
        title: "Erro",
        description: "Preencha o nome do serviço",
        variant: "destructive",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const serviceData = {
      user_id: user.id,
      name: formData.name,
      description: formData.description,
      category: formData.category,
      duration: parseInt(formData.duration) || 60,
      price: parseFloat(formData.price) || 0,
      color: formData.color,
      is_active: formData.is_active,
    };

    if (editingService) {
      // Check if price changed
      const newPrice = parseFloat(formData.price) || 0;
      if (editingService.price !== newPrice) {
        await supabase.from("service_price_history" as any).insert({
          service_id: editingService.id,
          old_price: editingService.price,
          new_price: newPrice,
        });
      }

      const { error } = await supabase
        .from("services")
        .update(serviceData)
        .eq("id", editingService.id);

      if (error) {
        toast({
          title: "Erro ao atualizar serviço",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Serviço atualizado!",
        });
        handleCloseDialog();
        fetchServices();
      }
    } else {
      const { data: newService, error } = await supabase
        .from("services")
        .insert([serviceData])
        .select()
        .single();

      if (error) {
        toast({
          title: "Erro ao criar serviço",
          description: error.message,
          variant: "destructive",
        });
      } else {
        // Record initial price
        if (newService) {
          await supabase.from("service_price_history" as any).insert({
            service_id: newService.id,
            old_price: null,
            new_price: parseFloat(formData.price) || 0,
          });
        }
        toast({
          title: "Serviço criado com sucesso!",
        });
        handleCloseDialog();
        fetchServices();
      }
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || "",
      category: service.category || "",
      duration: service.duration.toString(),
      price: service.price.toString(),
      color: service.color,
      is_active: service.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleDuplicate = async (service: Service) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("services").insert({
      user_id: user.id,
      name: `${service.name} (Cópia)`,
      description: service.description,
      category: service.category,
      duration: service.duration,
      price: service.price,
      color: service.color,
      is_active: service.is_active,
    });

    if (error) {
      toast({
        title: "Erro ao duplicar serviço",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Serviço duplicado com sucesso!",
      });
      fetchServices();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este serviço?")) return;

    const { error } = await supabase
      .from("services")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Erro ao deletar serviço",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Serviço deletado!",
      });
      fetchServices();
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingService(null);
    setFormData({
      name: "",
      description: "",
      category: "",
      duration: "60",
      price: "",
      color: "#3B82F6",
      is_active: true,
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const uniqueCategories = Array.from(new Set(services.map(s => s.category).filter(Boolean)));

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          service.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || service.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Catálogo de Serviços</h1>
          <p className="text-muted-foreground">Gerencie os serviços oferecidos pelo seu negócio</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsPackageDialogOpen(true)} disabled={isReadOnly}>
            <Layers className="mr-2 h-4 w-4" />
            Criar Pacote
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingService(null)} disabled={isReadOnly}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Serviço
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingService ? "Editar Serviço" : "Criar Novo Serviço"}
              </DialogTitle>
              <DialogDescription>
                Preencha as informações do serviço
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome do Serviço *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Corte de Cabelo"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Ex: Cabelo"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição detalhada do serviço"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="duration">Duração (minutos)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    min="15"
                    step="15"
                  />
                </div>
                <div>
                  <Label htmlFor="price">Preço (R$)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <Label htmlFor="color">Cor na Agenda</Label>
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="h-10 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <Label htmlFor="is_active" className="cursor-pointer">Serviço Ativo</Label>
                  <p className="text-sm text-muted-foreground">
                    Desative para ocultar temporariamente
                  </p>
                </div>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>

              <Button onClick={handleSubmit} className="w-full" disabled={isReadOnly}>
                {editingService ? "Atualizar Serviço" : "Criar Serviço"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar serviços por nome ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {uniqueCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Serviços</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{services.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Serviços Ativos</CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {services.filter(s => s.is_active).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(services.reduce((acc, s) => acc + s.price, 0) / services.length || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {services.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Nenhum serviço cadastrado</p>
            <Button onClick={() => setIsDialogOpen(true)} disabled={isReadOnly}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeiro Serviço
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredServices.map((service) => (
            <Card key={service.id} className={!service.is_active ? "opacity-60" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: service.color }}
                      />
                      <CardTitle className="text-base">{service.name}</CardTitle>
                    </div>
                    {service.category && (
                      <Badge variant="outline" className="text-xs">
                        {service.category}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setPriceHistoryDialog({ open: true, serviceId: service.id, serviceName: service.name })}
                      title="Histórico de preços"
                    >
                      <History className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDuplicate(service)}
                      title="Duplicar serviço"
                      disabled={isReadOnly}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEdit(service)}
                      disabled={isReadOnly}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(service.id)}
                      disabled={isReadOnly}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {service.description && (
                  <CardDescription className="line-clamp-2">
                    {service.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      Duração
                    </div>
                    <span className="font-medium">{service.duration} min</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      Preço
                    </div>
                    <span className="font-bold text-green-600">
                      {formatCurrency(service.price)}
                    </span>
                  </div>
                  {!service.is_active && (
                    <Badge variant="destructive" className="w-full justify-center">
                      Inativo
                    </Badge>
                  )}
                  <ServiceStats serviceId={service.id} serviceName={service.name} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ServicePackageDialog 
        open={isPackageDialogOpen} 
        onOpenChange={setIsPackageDialogOpen}
        onSuccess={fetchServices}
      />

      <PriceHistoryDialog
        open={priceHistoryDialog.open}
        onOpenChange={(open) => setPriceHistoryDialog({ ...priceHistoryDialog, open })}
        serviceId={priceHistoryDialog.serviceId}
        serviceName={priceHistoryDialog.serviceName}
      />
    </div>
  );
};

export default Servicos;
