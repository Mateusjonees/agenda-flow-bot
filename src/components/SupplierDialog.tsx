import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search } from "lucide-react";

interface SupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  supplier?: {
    id: string;
    name: string;
    document: string;
    document_type: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    postal_code: string;
    notes: string;
  } | null;
}

export const SupplierDialog = ({
  open,
  onOpenChange,
  onSuccess,
  supplier,
}: SupplierDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [searchingCnpj, setSearchingCnpj] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    document: "",
    document_type: "cnpj",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postal_code: "",
    notes: "",
  });

  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name || "",
        document: supplier.document || "",
        document_type: supplier.document_type || "cnpj",
        email: supplier.email || "",
        phone: supplier.phone || "",
        address: supplier.address || "",
        city: supplier.city || "",
        state: supplier.state || "",
        postal_code: supplier.postal_code || "",
        notes: supplier.notes || "",
      });
    } else {
      resetForm();
    }
  }, [supplier, open]);

  const resetForm = () => {
    setFormData({
      name: "",
      document: "",
      document_type: "cnpj",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      postal_code: "",
      notes: "",
    });
  };

  // Buscar dados do CNPJ via BrasilAPI (gratuita)
  const searchCnpj = async () => {
    const cnpj = formData.document.replace(/\D/g, "");
    if (cnpj.length !== 14) {
      toast({
        title: "CNPJ inválido",
        description: "Digite um CNPJ válido com 14 dígitos.",
        variant: "destructive",
      });
      return;
    }

    setSearchingCnpj(true);
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
      
      if (!response.ok) {
        throw new Error("CNPJ não encontrado");
      }

      const data = await response.json();
      
      setFormData(prev => ({
        ...prev,
        name: data.razao_social || data.nome_fantasia || prev.name,
        address: `${data.logradouro || ""}, ${data.numero || ""}`,
        city: data.municipio || "",
        state: data.uf || "",
        postal_code: data.cep || "",
        email: data.email || prev.email,
        phone: data.ddd_telefone_1 || prev.phone,
      }));

      toast({
        title: "Dados encontrados!",
        description: "As informações do CNPJ foram preenchidas automaticamente.",
      });
    } catch (error) {
      toast({
        title: "Erro ao buscar CNPJ",
        description: "Não foi possível encontrar os dados. Verifique o CNPJ digitado.",
        variant: "destructive",
      });
    } finally {
      setSearchingCnpj(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "O nome do fornecedor é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const supplierData = {
      user_id: user.id,
      name: formData.name.trim(),
      document: formData.document || null,
      document_type: formData.document_type || null,
      email: formData.email || null,
      phone: formData.phone || null,
      address: formData.address || null,
      city: formData.city || null,
      state: formData.state || null,
      postal_code: formData.postal_code || null,
      notes: formData.notes || null,
    };

    let error;

    if (supplier?.id) {
      const result = await supabase
        .from("suppliers")
        .update(supplierData)
        .eq("id", supplier.id);
      error = result.error;
    } else {
      const result = await supabase
        .from("suppliers")
        .insert(supplierData);
      error = result.error;
    }

    setLoading(false);

    if (error) {
      console.error("Error saving supplier:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o fornecedor.",
        variant: "destructive",
      });
    } else {
      toast({
        title: supplier?.id ? "Fornecedor atualizado!" : "Fornecedor criado!",
      });
      onSuccess();
      onOpenChange(false);
      resetForm();
    }
  };

  const states = [
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
    "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
    "RS", "RO", "RR", "SC", "SP", "SE", "TO"
  ];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{supplier?.id ? "Editar Fornecedor" : "Novo Fornecedor"}</DialogTitle>
          <DialogDescription>
            Cadastre um fornecedor para vincular às suas despesas
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>Nome / Razão Social *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nome do fornecedor"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Tipo</Label>
              <Select
                value={formData.document_type}
                onValueChange={(value) => setFormData({ ...formData, document_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cnpj">CNPJ</SelectItem>
                  <SelectItem value="cpf">CPF</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>{formData.document_type.toUpperCase()}</Label>
              <div className="flex gap-2">
                <Input
                  value={formData.document}
                  onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                  placeholder={formData.document_type === "cnpj" ? "00.000.000/0000-00" : "000.000.000-00"}
                />
                {formData.document_type === "cnpj" && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon"
                    onClick={searchCnpj}
                    disabled={searchingCnpj}
                  >
                    {searchingCnpj ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@fornecedor.com"
              />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          <div>
            <Label>Endereço</Label>
            <Input
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Rua, número, complemento"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Cidade</Label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Cidade"
              />
            </div>
            <div>
              <Label>Estado</Label>
              <Select
                value={formData.state}
                onValueChange={(value) => setFormData({ ...formData, state: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="UF" />
                </SelectTrigger>
                <SelectContent>
                  {states.map((uf) => (
                    <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>CEP</Label>
              <Input
                value={formData.postal_code}
                onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                placeholder="00000-000"
              />
            </div>
          </div>

          <div>
            <Label>Observações</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Informações adicionais..."
              rows={2}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {supplier?.id ? "Salvar" : "Criar Fornecedor"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
