import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Package, AlertTriangle, TrendingDown, TrendingUp, History, DollarSign } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

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
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMovementDialogOpen, setIsMovementDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string>("");
  
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

    const { error } = await supabase.from("inventory_items").insert([{
      user_id: user.id,
      name: newItem.name,
      description: newItem.description,
      category: newItem.category,
      unit: newItem.unit,
      current_stock: parseFloat(newItem.current_stock) || 0,
      min_quantity: parseFloat(newItem.min_quantity) || 0,
      cost_price: newItem.cost_price ? parseFloat(newItem.cost_price) : 0,
      unit_price: newItem.unit_price ? parseFloat(newItem.unit_price) : 0,
    }]);

    if (error) {
      toast({
        title: "Erro ao criar item",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Item criado com sucesso!",
      });
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
    }
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
              <Button variant="outline">
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
                <Button onClick={handleStockMovement} className="w-full">
                  Confirmar Movimentação
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
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
          <TabsTrigger value="items">Itens</TabsTrigger>
          <TabsTrigger value="movements">Movimentações</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-4">
          {items.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <p className="text-muted-foreground mb-4">Nenhum item cadastrado</p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeiro Item
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <Card key={item.id} className={isLowStock(item) ? "border-destructive" : ""}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{item.name}</CardTitle>
                    </div>
                    {item.category && (
                      <CardDescription>{item.category}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Estoque:</span>
                        <span className={`font-bold ${isLowStock(item) ? "text-destructive" : ""}`}>
                          {item.current_stock} {item.unit}
                        </span>
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
    </div>
  );
};

export default Estoque;
