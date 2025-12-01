import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Package, Search, Eye, Truck, Loader2, MapPin, Calendar, DollarSign, User } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useReadOnly } from "@/components/SubscriptionGuard";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Separator } from "@/components/ui/separator";

interface Order {
  id: string;
  user_id: string;
  customer_id: string;
  order_number: string;
  status: string;
  subtotal: number;
  discount: number;
  shipping_cost: number;
  total: number;
  shipping_address: any;
  tracking_code: string | null;
  payment_method: string | null;
  created_at: string;
  customers?: {
    name: string;
    phone: string;
  };
}

interface OrderItem {
  id: string;
  product_name: string;
  product_sku: string | null;
  variant_name: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

const PedidosWhatsApp = () => {
  const { toast } = useToast();
  const { isReadOnly } = useReadOnly();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [trackingCode, setTrackingCode] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          customers (
            name,
            phone
          )
        `)
        .eq("user_id", user.id)
        .not("conversation_id", "is", null) // Apenas pedidos do WhatsApp
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar pedidos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderItems = async (orderId: string) => {
    setLoadingItems(true);
    try {
      const { data, error } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId);

      if (error) throw error;
      setOrderItems(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar itens",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingItems(false);
    }
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setTrackingCode(order.tracking_code || "");
    fetchOrderItems(order.id);
    setDetailsOpen(true);
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedOrder || isReadOnly) return;

    setUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", selectedOrder.id);

      if (error) throw error;

      toast({
        title: "✅ Status atualizado!",
        description: `Pedido ${selectedOrder.order_number} agora está ${getStatusLabel(newStatus)}.`,
      });

      fetchOrders();
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleUpdateTracking = async () => {
    if (!selectedOrder || isReadOnly) return;

    try {
      const { error } = await supabase
        .from("orders")
        .update({ tracking_code: trackingCode || null })
        .eq("id", selectedOrder.id);

      if (error) throw error;

      toast({
        title: "✅ Código de rastreamento salvo!",
      });

      fetchOrders();
      setSelectedOrder({ ...selectedOrder, tracking_code: trackingCode });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar código",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      draft: "Rascunho",
      pending_payment: "Aguardando Pagamento",
      payment_confirmed: "Pagamento Confirmado",
      processing: "Em Separação",
      shipped: "Enviado",
      delivered: "Entregue",
      cancelled: "Cancelado",
      refunded: "Reembolsado",
    };
    return labels[status] || status;
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending_payment: { variant: "secondary" },
      payment_confirmed: { variant: "default" },
      processing: { variant: "default" },
      shipped: { variant: "default" },
      delivered: { variant: "outline" },
      cancelled: { variant: "destructive" },
      refunded: { variant: "destructive" },
    };

    const config = statusMap[status] || { variant: "outline" };
    return <Badge variant={config.variant}>{getStatusLabel(status)}</Badge>;
  };

  const getFilteredOrders = () => {
    return orders.filter((order) => {
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;

      const matchesSearch =
        !searchTerm ||
        order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customers?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customers?.phone.includes(searchTerm);

      return matchesStatus && matchesSearch;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const filteredOrders = getFilteredOrders();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Pedidos WhatsApp</h1>
        <p className="text-muted-foreground">
          Gerencie pedidos recebidos via WhatsApp
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Número do pedido, cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status_filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status_filter">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending_payment">Aguardando Pagamento</SelectItem>
                  <SelectItem value="payment_confirmed">Pagamento Confirmado</SelectItem>
                  <SelectItem value="processing">Em Separação</SelectItem>
                  <SelectItem value="shipped">Enviado</SelectItem>
                  <SelectItem value="delivered">Entregue</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredOrders.map((order) => (
          <Card key={order.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Pedido #{order.order_number}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {order.customers?.name || "Cliente sem nome"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDistanceToNow(new Date(order.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </span>
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(order.status)}
                  <Button size="sm" variant="outline" onClick={() => handleViewDetails(order)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Detalhes
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Subtotal</p>
                  <p className="font-medium">R$ {order.subtotal.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Frete</p>
                  <p className="font-medium">R$ {order.shipping_cost.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Desconto</p>
                  <p className="font-medium">R$ {order.discount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-xl font-bold text-primary">R$ {order.total.toFixed(2)}</p>
                </div>
              </div>
              {order.tracking_code && (
                <div className="mt-3 flex items-center gap-2 text-sm">
                  <Truck className="h-4 w-4" />
                  <span className="text-muted-foreground">Rastreamento:</span>
                  <code className="bg-muted px-2 py-0.5 rounded">{order.tracking_code}</code>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {filteredOrders.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum pedido encontrado</p>
            <p className="text-sm">Ajuste os filtros ou aguarde novos pedidos</p>
          </div>
        )}
      </div>

      {/* Order Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido #{selectedOrder?.order_number}</DialogTitle>
            <DialogDescription>
              Gerencie o status e rastreamento do pedido
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Cliente
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Nome:</span>{" "}
                    {selectedOrder.customers?.name}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Telefone:</span>{" "}
                    {selectedOrder.customers?.phone}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Shipping Address */}
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Endereço de Entrega
                </h3>
                <div className="text-sm space-y-1">
                  <p>
                    {selectedOrder.shipping_address?.street}, {selectedOrder.shipping_address?.number}
                  </p>
                  {selectedOrder.shipping_address?.complement && (
                    <p>{selectedOrder.shipping_address.complement}</p>
                  )}
                  <p>
                    {selectedOrder.shipping_address?.neighborhood} - {selectedOrder.shipping_address?.city}/{selectedOrder.shipping_address?.state}
                  </p>
                  <p>CEP: {selectedOrder.shipping_address?.postal_code}</p>
                </div>
              </div>

              <Separator />

              {/* Order Items */}
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Itens do Pedido
                </h3>
                {loadingItems ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {orderItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-start p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{item.product_name}</p>
                          {item.variant_name && (
                            <p className="text-sm text-muted-foreground">{item.variant_name}</p>
                          )}
                          {item.product_sku && (
                            <p className="text-xs text-muted-foreground">SKU: {item.product_sku}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium">R$ {item.subtotal.toFixed(2)}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.quantity}x R$ {item.unit_price.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Totals */}
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Valores
                </h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span>R$ {selectedOrder.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Frete:</span>
                    <span>R$ {selectedOrder.shipping_cost.toFixed(2)}</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Desconto:</span>
                      <span>- R$ {selectedOrder.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>R$ {selectedOrder.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Status Update */}
              <div className="space-y-2">
                <Label htmlFor="order_status">Atualizar Status</Label>
                <Select
                  value={selectedOrder.status}
                  onValueChange={handleUpdateStatus}
                  disabled={updatingStatus || isReadOnly}
                >
                  <SelectTrigger id="order_status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending_payment">Aguardando Pagamento</SelectItem>
                    <SelectItem value="payment_confirmed">Pagamento Confirmado</SelectItem>
                    <SelectItem value="processing">Em Separação</SelectItem>
                    <SelectItem value="shipped">Enviado</SelectItem>
                    <SelectItem value="delivered">Entregue</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tracking Code */}
              <div className="space-y-2">
                <Label htmlFor="tracking_code">Código de Rastreamento</Label>
                <div className="flex gap-2">
                  <Input
                    id="tracking_code"
                    placeholder="Ex: AA123456789BR"
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value)}
                    disabled={isReadOnly}
                  />
                  <Button onClick={handleUpdateTracking} disabled={isReadOnly}>
                    Salvar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PedidosWhatsApp;
