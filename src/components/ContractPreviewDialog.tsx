import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  Printer, 
  Mail, 
  User, 
  Building2, 
  Calendar,
  DollarSign,
  Loader2,
  Eye,
  Edit3
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ContractPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: any;
  plan: any;
  customer: any;
  businessSettings: any;
}

export function ContractPreviewDialog({
  open,
  onOpenChange,
  subscription,
  plan,
  customer,
  businessSettings,
}: ContractPreviewDialogProps) {
  const [activeTab, setActiveTab] = useState("dados");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  // Editable data
  const [contractData, setContractData] = useState({
    // Business data
    businessName: "",
    businessCpfCnpj: "",
    businessAddress: "",
    businessEmail: "",
    businessPhone: "",
    // Customer data
    customerName: "",
    customerCpf: "",
    customerAddress: "",
    customerEmail: "",
    customerPhone: "",
    // Plan data
    planName: "",
    planPrice: 0,
    billingDay: 1,
    startDate: "",
    // Custom clauses
    customClauses: "",
  });

  useEffect(() => {
    if (open && subscription && plan && customer) {
      setContractData({
        businessName: businessSettings?.business_name || "",
        businessCpfCnpj: businessSettings?.cpf_cnpj || "",
        businessAddress: businessSettings?.address || "",
        businessEmail: businessSettings?.email || "",
        businessPhone: businessSettings?.whatsapp_number || "",
        customerName: customer?.name || "",
        customerCpf: customer?.cpf || "",
        customerAddress: customer?.address || "",
        customerEmail: customer?.email || "",
        customerPhone: customer?.phone || "",
        planName: plan?.name || "",
        planPrice: plan?.price || subscription?.price || 0,
        billingDay: subscription?.billing_day || 1,
        startDate: subscription?.start_date || new Date().toISOString().split("T")[0],
        customClauses: "",
      });
      setActiveTab("dados");
    }
  }, [open, subscription, plan, customer, businessSettings]);

  const handleInputChange = (field: string, value: string | number) => {
    setContractData(prev => ({ ...prev, [field]: value }));
  };

  const generateAndPrint = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-subscription-document", {
        body: {
          subscriptionId: subscription.id,
          customData: contractData,
        },
      });

      if (error) throw error;

      // Open print window
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(data.html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }

      toast.success("Contrato gerado com sucesso!");
    } catch (error: any) {
      console.error("Error generating contract:", error);
      toast.error("Erro ao gerar contrato: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const sendByEmail = async () => {
    if (!contractData.customerEmail) {
      toast.error("Email do cliente não informado");
      return;
    }

    setIsSending(true);
    try {
      const { error } = await supabase.functions.invoke("send-subscription-document", {
        body: {
          subscriptionId: subscription.id,
          customData: contractData,
        },
      });

      if (error) throw error;

      toast.success("Contrato enviado por email!");
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error sending contract:", error);
      if (error.message?.includes("RESEND_API_KEY")) {
        toast.error("Configure a chave RESEND_API_KEY nas configurações do servidor");
      } else {
        toast.error("Erro ao enviar contrato: " + error.message);
      }
    } finally {
      setIsSending(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl">Contrato de Serviço</span>
              <p className="text-sm font-normal text-muted-foreground">
                Edite os dados antes de imprimir ou enviar
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dados" className="gap-2">
              <Edit3 className="w-4 h-4" />
              Editar Dados
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-2">
              <Eye className="w-4 h-4" />
              Visualizar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dados" className="space-y-6 mt-6">
            {/* Contratante (Business) */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  Dados do Contratante (Sua Empresa)
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome da Empresa</Label>
                  <Input
                    value={contractData.businessName}
                    onChange={(e) => handleInputChange("businessName", e.target.value)}
                    placeholder="Nome da empresa"
                  />
                </div>
                <div className="space-y-2">
                  <Label>CPF/CNPJ</Label>
                  <Input
                    value={contractData.businessCpfCnpj}
                    onChange={(e) => handleInputChange("businessCpfCnpj", e.target.value)}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label>Endereço</Label>
                  <Input
                    value={contractData.businessAddress}
                    onChange={(e) => handleInputChange("businessAddress", e.target.value)}
                    placeholder="Endereço completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={contractData.businessEmail}
                    onChange={(e) => handleInputChange("businessEmail", e.target.value)}
                    placeholder="email@empresa.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone/WhatsApp</Label>
                  <Input
                    value={contractData.businessPhone}
                    onChange={(e) => handleInputChange("businessPhone", e.target.value)}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Contratado (Customer) */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  Dados do Contratado (Cliente)
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome Completo</Label>
                  <Input
                    value={contractData.customerName}
                    onChange={(e) => handleInputChange("customerName", e.target.value)}
                    placeholder="Nome do cliente"
                  />
                </div>
                <div className="space-y-2">
                  <Label>CPF</Label>
                  <Input
                    value={contractData.customerCpf}
                    onChange={(e) => handleInputChange("customerCpf", e.target.value)}
                    placeholder="000.000.000-00"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label>Endereço</Label>
                  <Input
                    value={contractData.customerAddress}
                    onChange={(e) => handleInputChange("customerAddress", e.target.value)}
                    placeholder="Endereço completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={contractData.customerEmail}
                    onChange={(e) => handleInputChange("customerEmail", e.target.value)}
                    placeholder="email@cliente.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    value={contractData.customerPhone}
                    onChange={(e) => handleInputChange("customerPhone", e.target.value)}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Plan/Service Details */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" />
                  Detalhes do Plano/Serviço
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Nome do Plano</Label>
                  <Input
                    value={contractData.planName}
                    onChange={(e) => handleInputChange("planName", e.target.value)}
                    placeholder="Nome do plano"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valor Mensal (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={contractData.planPrice}
                    onChange={(e) => handleInputChange("planPrice", parseFloat(e.target.value) || 0)}
                    placeholder="0,00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Dia do Vencimento</Label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={contractData.billingDay}
                    onChange={(e) => handleInputChange("billingDay", parseInt(e.target.value) || 1)}
                    placeholder="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data de Início</Label>
                  <Input
                    type="date"
                    value={contractData.startDate}
                    onChange={(e) => handleInputChange("startDate", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Custom Clauses */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Cláusulas Adicionais (Opcional)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={contractData.customClauses}
                  onChange={(e) => handleInputChange("customClauses", e.target.value)}
                  placeholder="Adicione cláusulas personalizadas que serão incluídas no contrato..."
                  rows={4}
                  className="resize-none"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview" className="mt-6">
            <Card className="p-6 bg-white dark:bg-zinc-900">
              <div className="space-y-6 text-sm">
                {/* Header */}
                <div className="text-center border-b pb-4">
                  <h2 className="text-xl font-bold">CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h2>
                  <p className="text-muted-foreground mt-1">
                    Plano: {contractData.planName}
                  </p>
                </div>

                {/* Parties */}
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-primary mb-2">CONTRATANTE:</h3>
                    <p><strong>{contractData.businessName || "[Nome da Empresa]"}</strong></p>
                    <p>CPF/CNPJ: {contractData.businessCpfCnpj || "[Não informado]"}</p>
                    <p>Endereço: {contractData.businessAddress || "[Não informado]"}</p>
                    <p>Email: {contractData.businessEmail || "[Não informado]"}</p>
                    <p>Telefone: {contractData.businessPhone || "[Não informado]"}</p>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold text-primary mb-2">CONTRATADO:</h3>
                    <p><strong>{contractData.customerName || "[Nome do Cliente]"}</strong></p>
                    <p>CPF: {contractData.customerCpf || "[Não informado]"}</p>
                    <p>Endereço: {contractData.customerAddress || "[Não informado]"}</p>
                    <p>Email: {contractData.customerEmail || "[Não informado]"}</p>
                    <p>Telefone: {contractData.customerPhone || "[Não informado]"}</p>
                  </div>
                </div>

                <Separator />

                {/* Service Details */}
                <div>
                  <h3 className="font-semibold text-primary mb-2">OBJETO DO CONTRATO:</h3>
                  <p>
                    O presente contrato tem por objeto a prestação de serviços referentes ao plano{" "}
                    <strong>{contractData.planName}</strong>, pelo valor mensal de{" "}
                    <strong>{formatCurrency(contractData.planPrice)}</strong>.
                  </p>
                  <p className="mt-2">
                    Data de início: <strong>{(() => {
                      try {
                        if (!contractData.startDate) return "[Não definida]";
                        const date = new Date(contractData.startDate + "T12:00:00");
                        if (isNaN(date.getTime())) return "[Data inválida]";
                        return format(date, "dd/MM/yyyy", { locale: ptBR });
                      } catch {
                        return "[Data inválida]";
                      }
                    })()}</strong>
                  </p>
                  <p>
                    Dia de vencimento: <strong>Todo dia {contractData.billingDay}</strong>
                  </p>
                </div>

                {/* Custom Clauses */}
                {contractData.customClauses && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold text-primary mb-2">CLÁUSULAS ADICIONAIS:</h3>
                      <p className="whitespace-pre-wrap">{contractData.customClauses}</p>
                    </div>
                  </>
                )}

                {/* Signatures */}
                <div className="mt-8 pt-8 border-t">
                  <div className="grid grid-cols-2 gap-8 text-center">
                    <div>
                      <div className="border-t border-foreground/50 pt-2 mt-12">
                        <p className="font-medium">{contractData.businessName || "CONTRATANTE"}</p>
                      </div>
                    </div>
                    <div>
                      <div className="border-t border-foreground/50 pt-2 mt-12">
                        <p className="font-medium">{contractData.customerName || "CONTRATADO"}</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-center text-muted-foreground mt-6">
                    {format(new Date(), "'Data: 'dd' de 'MMMM' de 'yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            variant="outline"
            onClick={sendByEmail}
            disabled={isSending || !contractData.customerEmail}
            className="gap-2"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Mail className="w-4 h-4" />
            )}
            Enviar por Email
          </Button>
          <Button
            onClick={generateAndPrint}
            disabled={isGenerating}
            className="gap-2 bg-gradient-to-r from-primary to-primary/80"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Printer className="w-4 h-4" />
            )}
            Visualizar e Imprimir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
