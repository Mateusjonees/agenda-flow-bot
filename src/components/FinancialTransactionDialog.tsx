import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ChevronDown, ChevronUp, Building2, Calculator, Folder } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface FinancialTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface Category {
  id: string;
  name: string;
  type: string;
}

interface CostCenter {
  id: string;
  name: string;
}

interface Supplier {
  id: string;
  name: string;
}

interface AccountingAccount {
  id: string;
  code: string;
  name: string;
  type: string;
  parent_id: string | null;
}

export const FinancialTransactionDialog = ({
  open,
  onOpenChange,
  onSuccess,
}: FinancialTransactionDialogProps) => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [accounts, setAccounts] = useState<AccountingAccount[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [formData, setFormData] = useState({
    type: "income",
    amount: "",
    description: "",
    payment_method: "pix",
    category_id: "",
    transaction_date: new Date().toISOString().split("T")[0],
    status: "completed",
    // Novos campos contábeis
    due_date: "",
    recurrence: "once",
    supplier_id: "",
    document_number: "",
    cost_center_id: "",
    account_id: "",
  });

  useEffect(() => {
    if (open) {
      fetchCategories();
      fetchCostCenters();
      fetchSuppliers();
      fetchAccounts();
    }
  }, [open]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("financial_categories")
      .select("*")
      .order("name");
    setCategories(data || []);
  };

  const fetchCostCenters = async () => {
    const { data } = await supabase
      .from("cost_centers")
      .select("*")
      .eq("is_active", true)
      .order("name");
    setCostCenters(data || []);
  };

  const fetchSuppliers = async () => {
    const { data } = await supabase
      .from("suppliers")
      .select("*")
      .eq("is_active", true)
      .order("name");
    setSuppliers(data || []);
  };

  const fetchAccounts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Primeiro, tentar criar plano de contas padrão se não existir
    await supabase.rpc("create_default_accounting_accounts", { p_user_id: user.id });

    const { data } = await supabase
      .from("accounting_accounts")
      .select("*")
      .eq("is_active", true)
      .order("code");
    setAccounts(data || []);
  };

  const resetForm = () => {
    setFormData({
      type: "income",
      amount: "",
      description: "",
      payment_method: "pix",
      category_id: "",
      transaction_date: new Date().toISOString().split("T")[0],
      status: "completed",
      due_date: "",
      recurrence: "once",
      supplier_id: "",
      document_number: "",
      cost_center_id: "",
      account_id: "",
    });
    setShowAdvanced(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.amount || !formData.description) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos necessários.",
        variant: "destructive",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const transactionData: Record<string, any> = {
      user_id: user.id,
      type: formData.type,
      amount: parseFloat(formData.amount),
      description: formData.description,
      payment_method: formData.payment_method,
      category_id: formData.category_id || null,
      transaction_date: new Date(formData.transaction_date).toISOString(),
      status: formData.status,
      recurrence: formData.recurrence || null,
      document_number: formData.document_number || null,
    };

    // Adicionar campos opcionais apenas se preenchidos
    if (formData.due_date) {
      transactionData.due_date = new Date(formData.due_date).toISOString();
    }
    if (formData.supplier_id) {
      transactionData.supplier_id = formData.supplier_id;
    }
    if (formData.cost_center_id) {
      transactionData.cost_center_id = formData.cost_center_id;
    }
    if (formData.account_id) {
      transactionData.account_id = formData.account_id;
    }

    const { error } = await supabase.from("financial_transactions").insert(transactionData as any);

    if (error) {
      console.error("Error creating transaction:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a transação.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Transação criada!",
      });
      onSuccess();
      onOpenChange(false);
      resetForm();
    }
  };

  // Filtrar contas contábeis pelo tipo da transação
  const filteredAccounts = accounts.filter(acc => {
    if (formData.type === "income") return acc.type === "receita";
    if (formData.type === "expense") return acc.type === "despesa" || acc.type === "custo";
    return true;
  });

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Transação</DialogTitle>
          <DialogDescription>Adicione uma receita ou despesa</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Campos principais */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo *</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value, account_id: "" })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Receita</SelectItem>
                  <SelectItem value="expense">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Valor (R$) *</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <Label>Descrição *</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva a transação..."
              required
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Forma de Pagamento</Label>
              <Select
                value={formData.payment_method}
                onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">Pix</SelectItem>
                  <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                  <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                  <SelectItem value="cash">Dinheiro</SelectItem>
                  <SelectItem value="bank_transfer">Transferência Bancária</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Data *</Label>
              <Input
                type="date"
                value={formData.transaction_date}
                onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label>Categoria</Label>
            <Select
              value={formData.category_id}
              onValueChange={(value) => setFormData({ ...formData, category_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Campos contábeis avançados */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <Button type="button" variant="ghost" className="w-full justify-between text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Calculator className="w-4 h-4" />
                  Campos Contábeis (Opcional)
                </span>
                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 mt-3 p-3 bg-muted/30 rounded-lg">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="flex items-center gap-1">
                    <Folder className="w-3 h-3" />
                    Conta Contábil
                  </Label>
                  <Select
                    value={formData.account_id}
                    onValueChange={(value) => setFormData({ ...formData, account_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredAccounts.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.code} - {acc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Centro de Custo</Label>
                  <Select
                    value={formData.cost_center_id}
                    onValueChange={(value) => setFormData({ ...formData, cost_center_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {costCenters.map((cc) => (
                        <SelectItem key={cc.id} value={cc.id}>
                          {cc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Data de Vencimento</Label>
                  <Input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Recorrência</Label>
                  <Select
                    value={formData.recurrence}
                    onValueChange={(value) => setFormData({ ...formData, recurrence: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="once">Única</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="yearly">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.type === "expense" && (
                <div>
                  <Label className="flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    Fornecedor
                  </Label>
                  <Select
                    value={formData.supplier_id}
                    onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um fornecedor..." />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((sup) => (
                        <SelectItem key={sup.id} value={sup.id}>
                          {sup.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label>Número do Documento (NF, Recibo, etc.)</Label>
                <Input
                  value={formData.document_number}
                  onChange={(e) => setFormData({ ...formData, document_number: e.target.value })}
                  placeholder="Ex: NF-001234"
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              Criar Transação
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
