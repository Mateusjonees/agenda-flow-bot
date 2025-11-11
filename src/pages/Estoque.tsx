import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useReadOnly } from "@/components/SubscriptionGuard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Package, AlertTriangle, TrendingDown, TrendingUp, History, DollarSign, Minus, Pencil, Trash2, Search } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface InventoryItem {
  id: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  current_stock: number;
  min_quantity: number;
  unit_price: number;
  cost_price: number;
}

interface StockMovement {
  id: string;
  type: string;
  quantity: number;
  reason: string;
  previous_stock: number;
  new_stock: number;
  created_at: string;
  inventory_items: { name: string };
}

const Estoque = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isReadOnly } = useReadOnly();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMovementDialogOpen, setIsMovementDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string>("");
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    category: "",
    unit: "un",
    current_stock: "0",
    min_quantity: "0",
    cost_price: "",
    unit_price: "",
  });

  const [movement, setMovement] = useState({
    type: "in",
    quantity: "",
    reason: "",
    totalCost: "",
  });

  useEffect(() => {
    checkAuth();
    fetchItems();
    fetchMovements();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from("inventory_items")
      .select("*")
      .order("name");

    if (error) {
      toast({
        title: "Erro ao carregar itens",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  const fetchMovements = async () => {
    const { data, error } = await supabase
      .from("stock_movements")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      toast({
        title: "Erro ao carregar movimentações",
        description: error.message,
        variant: "destructive",
      });
    } else {
      // Fetch item names separately
      const movementsWithNames = await Promise.all(
        (data || []).map(async (mov) => {
          const { data: item } = await supabase
            .from("inventory_items")
            .select("name")
            .eq("id", mov.item_id)
            .single();
          return {
            ...mov,
            inventory_items: item || { name: "Item removido" },
          };
        })
      );
      setMovements(movementsWithNames as any);
    }
  };

  const handleCreateItem = async () => {
    if (!newItem.name) {
      toast({
        title: "Erro",
        description: "Preencha o nome do item",
        variant: "destructive",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const currentStock = parseFloat(newItem.current_stock) || 0;
    const costPrice = newItem.cost_price ? parseFloat(newItem.cost_price) : 0;
    const totalCost = currentStock * costPrice;

    const { error } = await supabase.from("inventory_items").insert([{
      user_id: user.id,
      name: newItem.name,
      description: newItem.description,
      category: newItem.category,
      unit: newItem.unit,
      current_stock: currentStock,
      min_quantity: parseFloat(newItem.min_quantity) || 0,
      cost_price: costPrice,
      unit_price: newItem.unit_price ? parseFloat(newItem.unit_price) : 0,
    }]);

    if (error) {
      toast({
        title: "Erro ao criar item",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    // Se tiver estoque inicial e custo, registrar despesa no financeiro
    if (currentStock > 0 && costPrice > 0) {
      const { error: transactionError } = await supabase
        .from("financial_transactions")
        .insert({
          user_id: user.id,
          type: "expense",
          amount: totalCost,
          description: `Compra de estoque inicial: ${newItem.name} (${currentStock} ${newItem.unit})`,
          payment_method: "cash",
          status: "completed",
          transaction_date: new Date().toISOString(),
        });

      if (transactionError) {
        toast({
          title: "Item criado",
          description: "Mas não foi possível registrar a despesa no financeiro.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "✅ Item e despesa criados!",
          description: `Despesa de ${formatCurrency(totalCost)} registrada no financeiro.`,
        });
      }
    } else {
      toast({
        title: "Item criado com sucesso!",
        description: currentStock > 0 ? "💡 Dica: Informe o custo de compra para registrar automaticamente no financeiro." : undefined,
      });
    }

    setIsDialogOpen(false);
    setNewItem({
      name: "",
      description: "",
      category: "",
      unit: "un",
      current_stock: "0",
      min_quantity: "0",
      cost_price: "",
      unit_price: "",
    });
    fetchItems();
  };

  const handleStockMovement = async () => {
    if (!selectedItem || !movement.quantity) {
      toast({
        title: "Erro",
        description: "Selecione um item e informe a quantidade",
        variant: "destructive",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.rpc("update_inventory_stock", {
      p_item_id: selectedItem,
      p_quantity: parseFloat(movement.quantity),
      p_type: movement.type,
      p_reason: movement.reason,
      p_reference_type: "manual",
    });

    if (error) {
      toast({
        title: "Erro ao movimentar estoque",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    // Se for entrada de estoque E tiver custo informado, criar despesa no financeiro
    console.log("🔍 Verificando criação de despesa:", {
      type: movement.type,
      totalCost: movement.totalCost,
      parsedCost: parseFloat(movement.totalCost || "0")
    });
    
    if (movement.type === "in" && movement.totalCost && parseFloat(movement.totalCost) > 0) {
      console.log("✅ Criando despesa no financeiro...");
      const selectedItemData = items.find(i => i.id === selectedItem);
      
      const { data: transactionData, error: transactionError } = await supabase
        .from("financial_transactions")
        .insert({
          user_id: user.id,
          type: "expense",
          amount: parseFloat(movement.totalCost),
          description: `Compra de estoque: ${selectedItemData?.name} (${movement.quantity} ${selectedItemData?.unit})`,
          payment_method: "cash",
          status: "completed",
          transaction_date: new Date().toISOString(),
        })
        .select();

      console.log("📊 Resultado da criação da despesa:", { 
        success: !transactionError,
        transactionId: transactionData?.[0]?.id,
        error: transactionError 
      });

      if (transactionError) {
        console.error("❌ Erro ao criar transação financeira:", transactionError);
        toast({
          title: "Estoque atualizado",
          description: "Mas não foi possível registrar a despesa no financeiro. Verifique suas permissões.",
          variant: "destructive",
        });
      } else {
        console.log("✅ Despesa criada com sucesso! ID:", transactionData?.[0]?.id);
        toast({
          title: "✅ Estoque e financeiro atualizados!",
          description: `Entrada registrada e despesa de ${formatCurrency(parseFloat(movement.totalCost))} adicionada ao financeiro.`,
        });
      }
    } else {
      const reason = !movement.totalCost || parseFloat(movement.totalCost) === 0 
        ? "Custo não informado" 
        : "Tipo de movimentação não é entrada";
      console.log("ℹ️ Não criando despesa -", reason);
      toast({
        title: "Estoque atualizado!",
        description: movement.type === "in" 
          ? "💡 Dica: Informe o custo total para registrar automaticamente no financeiro."
          : undefined,
      });
    }

    setIsMovementDialogOpen(false);
    setMovement({ type: "in", quantity: "", reason: "", totalCost: "" });
    setSelectedItem("");
    fetchItems();
    fetchMovements();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const isLowStock = (item: InventoryItem) => {
    return item.current_stock <= item.min_quantity && item.min_quantity > 0;
  };

  // Filtrar itens
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.description?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  // Obter categorias únicas
  const categories = Array.from(new Set(items.map(item => item.category).filter(Boolean)));

  const quickAddStock = async (item: InventoryItem, amount: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.rpc("update_inventory_stock", {
      p_item_id: item.id,
      p_quantity: amount,
      p_type: "in",
      p_reason: "Adição rápida",
      p_reference_type: "manual",
    });

    if (error) {
      toast({
        title: "Erro ao atualizar estoque",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Estoque atualizado!",
        description: `${amount > 0 ? '+' : ''}${amount} ${item.unit} adicionado(s)`,
      });
      fetchItems();
    }
  };

  const quickRemoveStock = async (item: InventoryItem, amount: number) => {
    if (item.current_stock < amount) {
      toast({
        title: "Estoque insuficiente",
        description: "Não há estoque suficiente para remover essa quantidade.",
        variant: "destructive",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.rpc("update_inventory_stock", {
      p_item_id: item.id,
      p_quantity: amount,
      p_type: "out",
      p_reason: "Remoção rápida",
      p_reference_type: "manual",
    });

    if (error) {
      toast({
        title: "Erro ao atualizar estoque",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Estoque atualizado!",
        description: `-${amount} ${item.unit} removido(s)`,
      });
      fetchItems();
    }
  };

  const handleEditItem = (item: InventoryItem) => {
    setNewItem({
      name: item.name,
      description: item.description || "",
      category: item.category || "",
      unit: item.unit,
      current_stock: item.current_stock.toString(),
      min_quantity: item.min_quantity.toString(),
      cost_price: item.cost_price ? item.cost_price.toString() : "",
      unit_price: item.unit_price ? item.unit_price.toString() : "",
    });
    setSelectedItem(item.id);
    setIsEditDialogOpen(true);
  };

  const handleUpdateItem = async () => {
    if (!newItem.name) {
      toast({
        title: "Erro",
        description: "Preencha o nome do item",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("inventory_items")
      .update({
        name: newItem.name,
        description: newItem.description,
        category: newItem.category,
        unit: newItem.unit,
        min_quantity: parseFloat(newItem.min_quantity) || 0,
        cost_price: newItem.cost_price ? parseFloat(newItem.cost_price) : 0,
        unit_price: newItem.unit_price ? parseFloat(newItem.unit_price) : 0,
      })
      .eq("id", selectedItem);

    if (error) {
      toast({
        title: "Erro ao atualizar item",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Item atualizado com sucesso!",
      });
      setIsEditDialogOpen(false);
      setSelectedItem("");
      setNewItem({
        name: "",
        description: "",
        category: "",
        unit: "un",
        current_stock: "0",
        min_quantity: "0",
        cost_price: "",
        unit_price: "",
      });
      fetchItems();
    }
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;

    const { error } = await supabase
      .from("inventory_items")
      .delete()
      .eq("id", itemToDelete.id);

    if (error) {
      toast({
        title: "Erro ao excluir item",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Item excluído com sucesso!",
      });
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
      fetchItems();
    }
  };

  const stats = {
    total: items.length,
    lowStock: items.filter(isLowStock).length,
    totalValue: items.reduce((sum, item) => sum + (item.current_stock * (item.unit_price || 0)), 0),
  };

  if (loading) {
    return <div className="p-8">Carregando...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Estoque</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seus itens, kits e movimentações
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isMovementDialogOpen} onOpenChange={setIsMovementDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={isReadOnly}>
                <History className="mr-2 h-4 w-4" />
                Movimentar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Movimentar Estoque</DialogTitle>
                <DialogDescription>
                  Registre entrada, saída ou ajuste de estoque
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="item">Item *</Label>
                  <Select value={selectedItem} onValueChange={setSelectedItem}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um item" />
                    </SelectTrigger>
                    <SelectContent>
                      {items.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} (Estoque: {item.current_stock})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="type">Tipo de Movimentação</Label>
                  <Select value={movement.type} onValueChange={(value) => setMovement({ ...movement, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in">Entrada</SelectItem>
                      <SelectItem value="out">Saída</SelectItem>
                      <SelectItem value="adjustment">Ajuste</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="quantity">Quantidade *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.01"
                    value={movement.quantity}
                    onChange={(e) => setMovement({ ...movement, quantity: e.target.value })}
                  />
                </div>
                {movement.type === "in" && (
                  <div className="space-y-2">
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-start gap-2">
                        <DollarSign className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-sm text-blue-900 dark:text-blue-100">
                            💡 Registrar despesa no financeiro
                          </p>
                          <p className="text-xs text-blue-700 dark:text-blue-300">
                            Informe o custo total da compra para que seja automaticamente registrado como despesa
                          </p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="totalCost" className="flex items-center gap-2">
                        Custo Total da Compra (R$)
                        <span className="text-xs text-muted-foreground">(Recomendado)</span>
                      </Label>
                      <Input
                        id="totalCost"
                        type="number"
                        step="0.01"
                        min="0"
                        value={movement.totalCost}
                        onChange={(e) => setMovement({ ...movement, totalCost: e.target.value })}
                        placeholder="Ex: 150,00"
                        className="mt-1"
                      />
                    </div>
                  </div>
                )}
                <div>
                  <Label htmlFor="reason">Motivo</Label>
                  <Textarea
                    id="reason"
                    value={movement.reason}
                    onChange={(e) => setMovement({ ...movement, reason: e.target.value })}
                    placeholder="Descreva o motivo da movimentação"
                  />
                </div>
                <Button onClick={handleStockMovement} className="w-full" disabled={isReadOnly}>
                  Confirmar Movimentação
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={isReadOnly}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Novo Item</DialogTitle>
                <DialogDescription>
                  Adicione um novo item ao estoque
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome *</Label>
                    <Input
                      id="name"
                      value={newItem.name}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Categoria</Label>
                    <Input
                      id="category"
                      value={newItem.category}
                      onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="unit">Unidade</Label>
                    <Select value={newItem.unit} onValueChange={(value) => setNewItem({ ...newItem, unit: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="un">Unidade</SelectItem>
                        <SelectItem value="kg">Quilograma (kg)</SelectItem>
                        <SelectItem value="l">Litro (L)</SelectItem>
                        <SelectItem value="m">Metro (m)</SelectItem>
                        <SelectItem value="cx">Caixa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="cost_price">Custo de Compra (R$)</Label>
                    <Input
                      id="cost_price"
                      type="number"
                      step="0.01"
                      placeholder="Quanto custou para comprar"
                      value={newItem.cost_price}
                      onChange={(e) => setNewItem({ ...newItem, cost_price: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="unit_price">Preço de Venda (R$)</Label>
                    <Input
                      id="unit_price"
                      type="number"
                      step="0.01"
                      placeholder="Preço que vai sair por unidade"
                      value={newItem.unit_price}
                      onChange={(e) => setNewItem({ ...newItem, unit_price: e.target.value })}
                    />
                  </div>
                  <div className="flex items-end">
                    {newItem.cost_price && newItem.unit_price && (
                      <div className="text-sm text-muted-foreground">
                        Margem: {(((parseFloat(newItem.unit_price) - parseFloat(newItem.cost_price)) / parseFloat(newItem.cost_price)) * 100).toFixed(1)}%
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="current_stock">Estoque Inicial</Label>
                    <Input
                      id="current_stock"
                      type="number"
                      step="0.01"
                      value={newItem.current_stock}
                      onChange={(e) => setNewItem({ ...newItem, current_stock: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="min_quantity">Estoque Mínimo</Label>
                    <Input
                      id="min_quantity"
                      type="number"
                      step="0.01"
                      value={newItem.min_quantity}
                      onChange={(e) => setNewItem({ ...newItem, min_quantity: e.target.value })}
                    />
                  </div>
                </div>
                <Button onClick={handleCreateItem} className="w-full">
                  Criar Item
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Itens</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Itens com Estoque Baixo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.lowStock}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total em Estoque</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="items" className="space-y-4">
        <TabsList>
          <TabsTrigger value="items">Todos os Itens</TabsTrigger>
          <TabsTrigger value="low-stock">Estoque Baixo</TabsTrigger>
          <TabsTrigger value="movements">Movimentações</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-4">
          {/* Barra de busca e filtros */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category || ""}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filteredItems.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <p className="text-muted-foreground mb-4">
                  {searchTerm || categoryFilter !== "all" 
                    ? "Nenhum item encontrado com esses filtros" 
                    : "Nenhum item cadastrado"}
                </p>
                {!searchTerm && categoryFilter === "all" && (
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Primeiro Item
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((item) => (
                <Card key={item.id} className={isLowStock(item) ? "border-destructive" : ""}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{item.name}</CardTitle>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditItem(item);
                          }}
                          disabled={isReadOnly}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setItemToDelete(item);
                            setIsDeleteDialogOpen(true);
                          }}
                          disabled={isReadOnly}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    {item.category && (
                      <CardDescription>{item.category}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Estoque:</span>
                        <span className={`font-bold ${isLowStock(item) ? "text-destructive" : ""}`}>
                          {item.current_stock} {item.unit}
                        </span>
                      </div>

                      {/* Botões de ajuste rápido */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 gap-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            quickRemoveStock(item, 1);
                          }}
                          disabled={isReadOnly || item.current_stock < 1}
                        >
                          <Minus className="h-3.5 w-3.5" />
                          Remover
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 gap-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            quickAddStock(item, 1);
                          }}
                          disabled={isReadOnly}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Adicionar
                        </Button>
                      </div>

                      {item.min_quantity > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Mínimo:</span>
                          <span>{item.min_quantity} {item.unit}</span>
                        </div>
                      )}
                      {item.cost_price > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Custo:</span>
                          <span className="text-orange-600">{formatCurrency(item.cost_price)}</span>
                        </div>
                      )}
                      {item.unit_price > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Venda:</span>
                          <span className="text-green-600 font-medium">{formatCurrency(item.unit_price)}</span>
                        </div>
                      )}
                      {item.cost_price > 0 && item.unit_price > 0 && (
                        <div className="flex justify-between text-sm border-t pt-2">
                          <span className="text-muted-foreground font-medium">Margem:</span>
                          <span className="font-bold text-primary">
                            {(((item.unit_price - item.cost_price) / item.cost_price) * 100).toFixed(1)}%
                          </span>
                        </div>
                      )}
                      {isLowStock(item) && (
                        <Badge variant="destructive" className="w-full justify-center">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Estoque Baixo
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="low-stock" className="space-y-4">
          {items.filter(isLowStock).length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <Package className="w-16 h-16 text-green-500 mb-4" />
                <p className="text-lg font-semibold mb-2">Tudo certo!</p>
                <p className="text-muted-foreground">Nenhum item com estoque baixo</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Itens com Estoque Baixo</h3>
                  <p className="text-sm text-muted-foreground">
                    {items.filter(isLowStock).length} {items.filter(isLowStock).length === 1 ? 'item precisa' : 'itens precisam'} de atenção
                  </p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {items.filter(isLowStock).map((item) => (
                  <Card key={item.id} className="border-destructive">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{item.name}</CardTitle>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditItem(item);
                            }}
                            disabled={isReadOnly}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setItemToDelete(item);
                              setIsDeleteDialogOpen(true);
                            }}
                            disabled={isReadOnly}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      {item.category && (
                        <CardDescription>{item.category}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <Badge variant="destructive" className="w-full justify-center mb-2">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Estoque Baixo
                        </Badge>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Estoque:</span>
                          <span className="font-bold text-destructive">
                            {item.current_stock} {item.unit}
                          </span>
                        </div>

                        {/* Botões de ajuste rápido */}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 gap-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              quickRemoveStock(item, 1);
                            }}
                            disabled={isReadOnly || item.current_stock < 1}
                          >
                            <Minus className="h-3.5 w-3.5" />
                            Remover
                          </Button>
                          <Button
                            size="sm"
                            variant="default"
                            className="flex-1 gap-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              quickAddStock(item, 1);
                            }}
                            disabled={isReadOnly}
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Adicionar
                          </Button>
                        </div>

                        {item.min_quantity > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Mínimo:</span>
                            <span>{item.min_quantity} {item.unit}</span>
                          </div>
                        )}
                        {item.cost_price > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Custo:</span>
                            <span className="text-orange-600">{formatCurrency(item.cost_price)}</span>
                          </div>
                        )}
                        {item.unit_price > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Venda:</span>
                            <span className="text-green-600 font-medium">{formatCurrency(item.unit_price)}</span>
                          </div>
                        )}
                        {item.cost_price > 0 && item.unit_price > 0 && (
                          <div className="flex justify-between text-sm border-t pt-2">
                            <span className="text-muted-foreground font-medium">Margem:</span>
                            <span className="font-bold text-primary">
                              {(((item.unit_price - item.cost_price) / item.cost_price) * 100).toFixed(1)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="movements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Movimentações</CardTitle>
              <CardDescription>Últimas 50 movimentações de estoque</CardDescription>
            </CardHeader>
            <CardContent>
              {movements.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhuma movimentação registrada
                </p>
              ) : (
                <div className="space-y-3">
                  {movements.map((mov) => (
                    <div key={mov.id} className="flex items-center justify-between border-b pb-3">
                      <div className="flex items-center gap-3">
                        {mov.type === "in" ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                        <div>
                          <p className="font-medium">{mov.inventory_items?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {mov.reason || (mov.type === "in" ? "Entrada" : mov.type === "out" ? "Saída" : "Ajuste")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">
                          {mov.type === "out" ? "-" : "+"}{mov.quantity}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(mov.created_at).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Item</DialogTitle>
            <DialogDescription>
              Atualize as informações do item
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Nome *</Label>
                <Input
                  id="edit-name"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-category">Categoria</Label>
                <Input
                  id="edit-category"
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-description">Descrição</Label>
              <Textarea
                id="edit-description"
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-unit">Unidade</Label>
                <Select value={newItem.unit} onValueChange={(value) => setNewItem({ ...newItem, unit: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="un">Unidade</SelectItem>
                    <SelectItem value="kg">Quilograma (kg)</SelectItem>
                    <SelectItem value="l">Litro (L)</SelectItem>
                    <SelectItem value="m">Metro (m)</SelectItem>
                    <SelectItem value="cx">Caixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-cost_price">Custo de Compra (R$)</Label>
                <Input
                  id="edit-cost_price"
                  type="number"
                  step="0.01"
                  value={newItem.cost_price}
                  onChange={(e) => setNewItem({ ...newItem, cost_price: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-unit_price">Preço de Venda (R$)</Label>
                <Input
                  id="edit-unit_price"
                  type="number"
                  step="0.01"
                  value={newItem.unit_price}
                  onChange={(e) => setNewItem({ ...newItem, unit_price: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-min_quantity">Estoque Mínimo</Label>
                <Input
                  id="edit-min_quantity"
                  type="number"
                  step="0.01"
                  value={newItem.min_quantity}
                  onChange={(e) => setNewItem({ ...newItem, min_quantity: e.target.value })}
                />
              </div>
            </div>
            {newItem.cost_price && newItem.unit_price && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">
                  Margem: {(((parseFloat(newItem.unit_price) - parseFloat(newItem.cost_price)) / parseFloat(newItem.cost_price)) * 100).toFixed(1)}%
                </p>
              </div>
            )}
            <Button onClick={handleUpdateItem} className="w-full">
              Salvar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Item</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{itemToDelete?.name}"? Esta ação não pode ser desfeita e todo o histórico de movimentações deste item será mantido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteItem} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Estoque;
