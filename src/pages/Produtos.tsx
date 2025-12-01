import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useReadOnly } from "@/components/SubscriptionGuard";
import { Plus, Search, Pencil, Trash2, Package, Tag, DollarSign, Archive, Loader2, Image as ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Product {
  id: string;
  user_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  short_description: string | null;
  sku: string | null;
  price: number;
  compare_at_price: number | null;
  cost_price: number | null;
  track_inventory: boolean;
  stock_quantity: number;
  low_stock_threshold: number;
  allow_backorder: boolean;
  tags: string[] | null;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  product_categories?: {
    name: string;
  };
}

interface ProductCategory {
  id: string;
  name: string;
}

const Produtos = () => {
  const { toast } = useToast();
  const { isReadOnly } = useReadOnly();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    short_description: "",
    sku: "",
    price: "",
    compare_at_price: "",
    cost_price: "",
    category_id: "",
    track_inventory: true,
    stock_quantity: "0",
    low_stock_threshold: "5",
    allow_backorder: false,
    tags: "",
    is_active: true,
    is_featured: false,
  });

  const [editProduct, setEditProduct] = useState<any>(null);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          product_categories (
            name
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar produtos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("product_categories")
        .select("id, name")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleCreateProduct = async () => {
    if (isReadOnly) {
      toast({
        title: "Ação bloqueada",
        description: "Seu plano atual não permite criar produtos.",
        variant: "destructive",
      });
      return;
    }

    if (!newProduct.name || !newProduct.price) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha nome e preço do produto.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const tagsArray = newProduct.tags
        ? newProduct.tags.split(",").map((t) => t.trim()).filter((t) => t)
        : null;

      const { error } = await supabase.from("products").insert({
        user_id: user.id,
        name: newProduct.name,
        description: newProduct.description || null,
        short_description: newProduct.short_description || null,
        sku: newProduct.sku || null,
        price: parseFloat(newProduct.price),
        compare_at_price: newProduct.compare_at_price ? parseFloat(newProduct.compare_at_price) : null,
        cost_price: newProduct.cost_price ? parseFloat(newProduct.cost_price) : null,
        category_id: newProduct.category_id || null,
        track_inventory: newProduct.track_inventory,
        stock_quantity: parseInt(newProduct.stock_quantity),
        low_stock_threshold: parseInt(newProduct.low_stock_threshold),
        allow_backorder: newProduct.allow_backorder,
        tags: tagsArray,
        is_active: newProduct.is_active,
        is_featured: newProduct.is_featured,
      });

      if (error) throw error;

      toast({
        title: "✅ Produto criado!",
        description: `${newProduct.name} foi adicionado ao catálogo.`,
      });

      setDialogOpen(false);
      setNewProduct({
        name: "",
        description: "",
        short_description: "",
        sku: "",
        price: "",
        compare_at_price: "",
        cost_price: "",
        category_id: "",
        track_inventory: true,
        stock_quantity: "0",
        low_stock_threshold: "5",
        allow_backorder: false,
        tags: "",
        is_active: true,
        is_featured: false,
      });
      fetchProducts();
    } catch (error: any) {
      toast({
        title: "Erro ao criar produto",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditProduct = async () => {
    if (isReadOnly) {
      toast({
        title: "Ação bloqueada",
        description: "Seu plano atual não permite editar produtos.",
        variant: "destructive",
      });
      return;
    }

    if (!editProduct.name || !editProduct.price) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha nome e preço do produto.",
        variant: "destructive",
      });
      return;
    }

    try {
      const tagsArray = editProduct.tags
        ? (typeof editProduct.tags === "string"
            ? editProduct.tags.split(",").map((t: string) => t.trim()).filter((t: string) => t)
            : editProduct.tags)
        : null;

      const { error } = await supabase
        .from("products")
        .update({
          name: editProduct.name,
          description: editProduct.description || null,
          short_description: editProduct.short_description || null,
          sku: editProduct.sku || null,
          price: parseFloat(editProduct.price),
          compare_at_price: editProduct.compare_at_price ? parseFloat(editProduct.compare_at_price) : null,
          cost_price: editProduct.cost_price ? parseFloat(editProduct.cost_price) : null,
          category_id: editProduct.category_id || null,
          track_inventory: editProduct.track_inventory,
          stock_quantity: parseInt(editProduct.stock_quantity),
          low_stock_threshold: parseInt(editProduct.low_stock_threshold),
          allow_backorder: editProduct.allow_backorder,
          tags: tagsArray,
          is_active: editProduct.is_active,
          is_featured: editProduct.is_featured,
        })
        .eq("id", editProduct.id);

      if (error) throw error;

      toast({
        title: "✅ Produto atualizado!",
        description: `${editProduct.name} foi atualizado.`,
      });

      setEditDialogOpen(false);
      setEditProduct(null);
      fetchProducts();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar produto",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteProduct = async () => {
    if (isReadOnly || !productToDelete) return;

    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productToDelete.id);

      if (error) throw error;

      toast({
        title: "✅ Produto excluído!",
        description: `${productToDelete.name} foi removido do catálogo.`,
      });

      setDeleteDialogOpen(false);
      setProductToDelete(null);
      fetchProducts();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir produto",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (product: Product) => {
    setEditProduct({
      ...product,
      price: product.price.toString(),
      compare_at_price: product.compare_at_price?.toString() || "",
      cost_price: product.cost_price?.toString() || "",
      stock_quantity: product.stock_quantity.toString(),
      low_stock_threshold: product.low_stock_threshold.toString(),
      tags: product.tags ? product.tags.join(", ") : "",
      category_id: product.category_id || "",
    });
    setEditDialogOpen(true);
  };

  const getFilteredProducts = () => {
    return products.filter((product) => {
      const matchesSearch =
        !searchTerm ||
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.tags?.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory =
        categoryFilter === "all" || product.category_id === categoryFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && product.is_active) ||
        (statusFilter === "inactive" && !product.is_active) ||
        (statusFilter === "featured" && product.is_featured);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const filteredProducts = getFilteredProducts();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Produtos</h1>
          <p className="text-muted-foreground">
            Gerencie o catálogo de produtos vendáveis via WhatsApp
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={isReadOnly}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Produto</DialogTitle>
              <DialogDescription>
                Adicione um novo produto ao catálogo de vendas
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="name">Nome do Produto *</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Creme Hidratante Premium"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    placeholder="Ex: CREME-001"
                    value={newProduct.sku}
                    onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select
                    value={newProduct.category_id}
                    onValueChange={(value) => setNewProduct({ ...newProduct, category_id: value === 'none' ? '' : value })}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Selecionar categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem categoria</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="short_description">Descrição Curta (WhatsApp)</Label>
                  <Textarea
                    id="short_description"
                    rows={2}
                    placeholder="Descrição breve para mensagens WhatsApp"
                    value={newProduct.short_description}
                    onChange={(e) => setNewProduct({ ...newProduct, short_description: e.target.value })}
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="description">Descrição Completa</Label>
                  <Textarea
                    id="description"
                    rows={3}
                    placeholder="Descrição detalhada do produto"
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Preço de Venda * (R$)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="compare_at_price">Preço "De" (R$)</Label>
                  <Input
                    id="compare_at_price"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newProduct.compare_at_price}
                    onChange={(e) => setNewProduct({ ...newProduct, compare_at_price: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cost_price">Custo (R$)</Label>
                  <Input
                    id="cost_price"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newProduct.cost_price}
                    onChange={(e) => setNewProduct({ ...newProduct, cost_price: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
                  <Input
                    id="tags"
                    placeholder="Ex: hidratante, pele seca, premium"
                    value={newProduct.tags}
                    onChange={(e) => setNewProduct({ ...newProduct, tags: e.target.value })}
                  />
                </div>

                <div className="col-span-2 flex items-center justify-between p-3 border rounded-lg">
                  <Label htmlFor="track_inventory">Controlar Estoque</Label>
                  <Switch
                    id="track_inventory"
                    checked={newProduct.track_inventory}
                    onCheckedChange={(checked) => setNewProduct({ ...newProduct, track_inventory: checked })}
                  />
                </div>

                {newProduct.track_inventory && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="stock_quantity">Quantidade em Estoque</Label>
                      <Input
                        id="stock_quantity"
                        type="number"
                        value={newProduct.stock_quantity}
                        onChange={(e) => setNewProduct({ ...newProduct, stock_quantity: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="low_stock_threshold">Alerta Estoque Baixo</Label>
                      <Input
                        id="low_stock_threshold"
                        type="number"
                        value={newProduct.low_stock_threshold}
                        onChange={(e) => setNewProduct({ ...newProduct, low_stock_threshold: e.target.value })}
                      />
                    </div>

                    <div className="col-span-2 flex items-center justify-between p-3 border rounded-lg">
                      <Label htmlFor="allow_backorder">Permitir venda sem estoque</Label>
                      <Switch
                        id="allow_backorder"
                        checked={newProduct.allow_backorder}
                        onCheckedChange={(checked) => setNewProduct({ ...newProduct, allow_backorder: checked })}
                      />
                    </div>
                  </>
                )}

                <div className="col-span-2 flex items-center justify-between p-3 border rounded-lg">
                  <Label htmlFor="is_active">Produto Ativo (visível no catálogo)</Label>
                  <Switch
                    id="is_active"
                    checked={newProduct.is_active}
                    onCheckedChange={(checked) => setNewProduct({ ...newProduct, is_active: checked })}
                  />
                </div>

                <div className="col-span-2 flex items-center justify-between p-3 border rounded-lg">
                  <Label htmlFor="is_featured">Produto em Destaque</Label>
                  <Switch
                    id="is_featured"
                    checked={newProduct.is_featured}
                    onCheckedChange={(checked) => setNewProduct({ ...newProduct, is_featured: checked })}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateProduct}>Criar Produto</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nome, SKU ou tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category_filter">Categoria</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger id="category_filter">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status_filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status_filter">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                  <SelectItem value="featured">Em Destaque</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((product) => (
          <Card key={product.id} className={!product.is_active ? "opacity-60" : ""}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {product.name}
                    {product.is_featured && (
                      <Badge variant="secondary" className="text-xs">Destaque</Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-sm mt-1">
                    {product.product_categories?.name || "Sem categoria"}
                  </CardDescription>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => openEditDialog(product)}
                    disabled={isReadOnly}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setProductToDelete(product);
                      setDeleteDialogOpen(true);
                    }}
                    disabled={isReadOnly}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {product.sku && (
                <div className="text-sm text-muted-foreground">
                  SKU: <code className="bg-muted px-1 py-0.5 rounded">{product.sku}</code>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">
                    R$ {product.price.toFixed(2)}
                  </div>
                  {product.compare_at_price && product.compare_at_price > product.price && (
                    <div className="text-sm text-muted-foreground line-through">
                      R$ {product.compare_at_price.toFixed(2)}
                    </div>
                  )}
                </div>
                <Badge variant={product.is_active ? "default" : "secondary"}>
                  {product.is_active ? "Ativo" : "Inativo"}
                </Badge>
              </div>

              {product.track_inventory && (
                <div className="flex items-center gap-2 text-sm">
                  <Archive className="h-4 w-4" />
                  <span>Estoque: {product.stock_quantity} un</span>
                  {product.stock_quantity <= product.low_stock_threshold && (
                    <Badge variant="destructive" className="text-xs">Baixo</Badge>
                  )}
                </div>
              )}

              {product.tags && product.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {product.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {product.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{product.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {filteredProducts.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum produto encontrado</p>
            <p className="text-sm">Ajuste os filtros ou crie um novo produto</p>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Produto</DialogTitle>
            <DialogDescription>Altere as informações do produto</DialogDescription>
          </DialogHeader>
          {editProduct && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="edit_name">Nome do Produto *</Label>
                  <Input
                    id="edit_name"
                    value={editProduct.name}
                    onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_sku">SKU</Label>
                  <Input
                    id="edit_sku"
                    value={editProduct.sku || ""}
                    onChange={(e) => setEditProduct({ ...editProduct, sku: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_category">Categoria</Label>
                  <Select
                    value={editProduct.category_id || "none"}
                    onValueChange={(value) => setEditProduct({ ...editProduct, category_id: value === 'none' ? '' : value })}
                  >
                    <SelectTrigger id="edit_category">
                      <SelectValue placeholder="Selecionar categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem categoria</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="edit_short_description">Descrição Curta (WhatsApp)</Label>
                  <Textarea
                    id="edit_short_description"
                    rows={2}
                    value={editProduct.short_description || ""}
                    onChange={(e) => setEditProduct({ ...editProduct, short_description: e.target.value })}
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="edit_description">Descrição Completa</Label>
                  <Textarea
                    id="edit_description"
                    rows={3}
                    value={editProduct.description || ""}
                    onChange={(e) => setEditProduct({ ...editProduct, description: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_price">Preço de Venda * (R$)</Label>
                  <Input
                    id="edit_price"
                    type="number"
                    step="0.01"
                    value={editProduct.price}
                    onChange={(e) => setEditProduct({ ...editProduct, price: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_compare_at_price">Preço "De" (R$)</Label>
                  <Input
                    id="edit_compare_at_price"
                    type="number"
                    step="0.01"
                    value={editProduct.compare_at_price || ""}
                    onChange={(e) => setEditProduct({ ...editProduct, compare_at_price: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_cost_price">Custo (R$)</Label>
                  <Input
                    id="edit_cost_price"
                    type="number"
                    step="0.01"
                    value={editProduct.cost_price || ""}
                    onChange={(e) => setEditProduct({ ...editProduct, cost_price: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_tags">Tags (separadas por vírgula)</Label>
                  <Input
                    id="edit_tags"
                    value={editProduct.tags || ""}
                    onChange={(e) => setEditProduct({ ...editProduct, tags: e.target.value })}
                  />
                </div>

                <div className="col-span-2 flex items-center justify-between p-3 border rounded-lg">
                  <Label htmlFor="edit_track_inventory">Controlar Estoque</Label>
                  <Switch
                    id="edit_track_inventory"
                    checked={editProduct.track_inventory}
                    onCheckedChange={(checked) => setEditProduct({ ...editProduct, track_inventory: checked })}
                  />
                </div>

                {editProduct.track_inventory && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="edit_stock_quantity">Quantidade em Estoque</Label>
                      <Input
                        id="edit_stock_quantity"
                        type="number"
                        value={editProduct.stock_quantity}
                        onChange={(e) => setEditProduct({ ...editProduct, stock_quantity: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit_low_stock_threshold">Alerta Estoque Baixo</Label>
                      <Input
                        id="edit_low_stock_threshold"
                        type="number"
                        value={editProduct.low_stock_threshold}
                        onChange={(e) => setEditProduct({ ...editProduct, low_stock_threshold: e.target.value })}
                      />
                    </div>

                    <div className="col-span-2 flex items-center justify-between p-3 border rounded-lg">
                      <Label htmlFor="edit_allow_backorder">Permitir venda sem estoque</Label>
                      <Switch
                        id="edit_allow_backorder"
                        checked={editProduct.allow_backorder}
                        onCheckedChange={(checked) => setEditProduct({ ...editProduct, allow_backorder: checked })}
                      />
                    </div>
                  </>
                )}

                <div className="col-span-2 flex items-center justify-between p-3 border rounded-lg">
                  <Label htmlFor="edit_is_active">Produto Ativo (visível no catálogo)</Label>
                  <Switch
                    id="edit_is_active"
                    checked={editProduct.is_active}
                    onCheckedChange={(checked) => setEditProduct({ ...editProduct, is_active: checked })}
                  />
                </div>

                <div className="col-span-2 flex items-center justify-between p-3 border rounded-lg">
                  <Label htmlFor="edit_is_featured">Produto em Destaque</Label>
                  <Switch
                    id="edit_is_featured"
                    checked={editProduct.is_featured}
                    onCheckedChange={(checked) => setEditProduct({ ...editProduct, is_featured: checked })}
                  />
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditProduct}>Salvar Alterações</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Produto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{productToDelete?.name}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProduct} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Produtos;
