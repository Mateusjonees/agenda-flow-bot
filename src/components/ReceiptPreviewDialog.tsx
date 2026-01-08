import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Receipt, Printer, User, Building2, DollarSign, Loader2, Eye, Edit3, Calendar } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ReceiptPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: any;
  plan: any;
  customer: any;
  businessSettings: any;
}

export function ReceiptPreviewDialog({
  open,
  onOpenChange,
  subscription,
  plan,
  customer,
  businessSettings
}: ReceiptPreviewDialogProps) {
  const [activeTab, setActiveTab] = useState("dados");
  const [isGenerating, setIsGenerating] = useState(false);

  const [receiptData, setReceiptData] = useState({
    // Business data
    businessName: "",
    businessCpfCnpj: "",
    businessAddress: "",
    businessPhone: "",
    // Customer data
    customerName: "",
    customerCpf: "",
    customerPhone: "",
    // Payment data
    planName: "",
    amount: 0,
    paymentDate: "",
    paymentMethod: "",
    referenceMonth: "",
    // Additional
    notes: "",
    additionalClauses: ""
  });

  useEffect(() => {
    if (open && subscription && plan && customer) {
      const now = new Date();
      setReceiptData({
        businessName: businessSettings?.business_name || "",
        businessCpfCnpj: businessSettings?.cpf_cnpj || "",
        businessAddress: businessSettings?.address || "",
        businessPhone: businessSettings?.whatsapp_number || "",
        customerName: customer?.name || "",
        customerCpf: customer?.cpf || "",
        customerPhone: customer?.phone || "",
        planName: plan?.name || "",
        amount: plan?.price || subscription?.price || 0,
        paymentDate: format(now, "yyyy-MM-dd"),
        paymentMethod: subscription?.payment_method || "pix",
        referenceMonth: format(now, "MMMM 'de' yyyy", { locale: ptBR }),
        notes: "",
        additionalClauses: ""
      });
      setActiveTab("dados");
    }
  }, [open, subscription, plan, customer, businessSettings]);

  const handleInputChange = (field: string, value: string | number) => {
    setReceiptData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateAndPrint = async () => {
    setIsGenerating(true);
    try {
      // Generate receipt HTML
      const receiptHtml = generateReceiptHtml();
      
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(receiptHtml);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }
      toast.success("Comprovante gerado com sucesso!");
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error generating receipt:", error);
      toast.error("Erro ao gerar comprovante: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateReceiptHtml = () => {
    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL"
      }).format(value);
    };

    const formatDate = (dateStr: string) => {
      try {
        if (!dateStr) return "[Não informada]";
        const date = new Date(dateStr + "T12:00:00");
        if (isNaN(date.getTime())) return "[Data inválida]";
        return format(date, "dd/MM/yyyy", { locale: ptBR });
      } catch {
        return "[Data inválida]";
      }
    };

    const paymentMethodLabels: Record<string, string> = {
      pix: "PIX",
      credit_card: "Cartão de Crédito",
      debit_card: "Cartão de Débito",
      boleto: "Boleto",
      cash: "Dinheiro",
      transfer: "Transferência Bancária"
    };

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Comprovante de Pagamento</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1a1a1a; max-width: 800px; margin: 0 auto; }
    .header { text-align: center; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { font-size: 24px; color: #1a1a1a; margin-bottom: 8px; }
    .header p { color: #6b7280; font-size: 14px; }
    .section { margin-bottom: 24px; }
    .section-title { font-size: 14px; font-weight: 600; color: #4f46e5; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .info-item { }
    .info-label { font-size: 12px; color: #6b7280; margin-bottom: 2px; }
    .info-value { font-size: 14px; font-weight: 500; }
    .amount-box { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; padding: 24px; border-radius: 12px; text-align: center; margin: 24px 0; }
    .amount-label { font-size: 14px; opacity: 0.9; margin-bottom: 8px; }
    .amount-value { font-size: 32px; font-weight: 700; }
    .divider { border: none; border-top: 1px solid #e5e7eb; margin: 24px 0; }
    .notes { background: #f9fafb; padding: 16px; border-radius: 8px; margin-top: 20px; }
    .notes-title { font-size: 12px; font-weight: 600; color: #6b7280; margin-bottom: 8px; }
    .notes-content { font-size: 14px; white-space: pre-wrap; }
    .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
    .footer p { font-size: 12px; color: #9ca3af; }
    .signature-area { margin-top: 60px; display: grid; grid-template-columns: 1fr 1fr; gap: 60px; }
    .signature-line { border-top: 1px solid #1a1a1a; padding-top: 8px; text-align: center; }
    .signature-name { font-size: 14px; font-weight: 500; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>COMPROVANTE DE PAGAMENTO</h1>
    <p>${receiptData.businessName || "[Nome da Empresa]"}</p>
  </div>

  <div class="section">
    <div class="section-title">Dados do Prestador</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Razão Social</div>
        <div class="info-value">${receiptData.businessName || "[Não informado]"}</div>
      </div>
      <div class="info-item">
        <div class="info-label">CPF/CNPJ</div>
        <div class="info-value">${receiptData.businessCpfCnpj || "[Não informado]"}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Endereço</div>
        <div class="info-value">${receiptData.businessAddress || "[Não informado]"}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Telefone</div>
        <div class="info-value">${receiptData.businessPhone || "[Não informado]"}</div>
      </div>
    </div>
  </div>

  <hr class="divider">

  <div class="section">
    <div class="section-title">Dados do Cliente</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Nome</div>
        <div class="info-value">${receiptData.customerName || "[Não informado]"}</div>
      </div>
      <div class="info-item">
        <div class="info-label">CPF</div>
        <div class="info-value">${receiptData.customerCpf || "[Não informado]"}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Telefone</div>
        <div class="info-value">${receiptData.customerPhone || "[Não informado]"}</div>
      </div>
    </div>
  </div>

  <div class="amount-box">
    <div class="amount-label">Valor Pago</div>
    <div class="amount-value">${formatCurrency(receiptData.amount)}</div>
  </div>

  <div class="section">
    <div class="section-title">Detalhes do Pagamento</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Serviço</div>
        <div class="info-value">${receiptData.planName || "[Não informado]"}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Referência</div>
        <div class="info-value">${receiptData.referenceMonth || "[Não informado]"}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Data do Pagamento</div>
        <div class="info-value">${formatDate(receiptData.paymentDate)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Forma de Pagamento</div>
        <div class="info-value">${paymentMethodLabels[receiptData.paymentMethod] || receiptData.paymentMethod || "[Não informado]"}</div>
      </div>
    </div>
  </div>

  ${receiptData.notes ? `
  <div class="notes">
    <div class="notes-title">Observações</div>
    <div class="notes-content">${receiptData.notes}</div>
  </div>
  ` : ""}

  ${receiptData.additionalClauses ? `
  <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 8px; margin-top: 16px;">
    <div style="font-size: 12px; font-weight: 600; color: #92400e; margin-bottom: 8px; text-transform: uppercase;">Cláusulas Adicionais</div>
    <div style="font-size: 14px; color: #78350f; white-space: pre-wrap;">${receiptData.additionalClauses}</div>
  </div>
  ` : ""}

  <div class="signature-area">
    <div class="signature-line">
      <div class="signature-name">${receiptData.businessName || "Prestador"}</div>
    </div>
    <div class="signature-line">
      <div class="signature-name">${receiptData.customerName || "Cliente"}</div>
    </div>
  </div>

  <div class="footer">
    <p>Documento gerado em ${format(new Date(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}</p>
  </div>
</body>
</html>
    `;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value);
  };

  const paymentMethodOptions = [
    { value: "pix", label: "PIX" },
    { value: "credit_card", label: "Cartão de Crédito" },
    { value: "debit_card", label: "Cartão de Débito" },
    { value: "boleto", label: "Boleto" },
    { value: "cash", label: "Dinheiro" },
    { value: "transfer", label: "Transferência Bancária" }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl">Comprovante de Pagamento</span>
              <p className="text-sm font-normal text-muted-foreground">
                Edite os dados antes de gerar o PDF
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
            {/* Prestador (Business) */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-500" />
                  Dados do Prestador
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome da Empresa</Label>
                  <Input
                    value={receiptData.businessName}
                    onChange={(e) => handleInputChange("businessName", e.target.value)}
                    placeholder="Nome da empresa"
                  />
                </div>
                <div className="space-y-2">
                  <Label>CPF/CNPJ</Label>
                  <Input
                    value={receiptData.businessCpfCnpj}
                    onChange={(e) => handleInputChange("businessCpfCnpj", e.target.value)}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Endereço</Label>
                  <Input
                    value={receiptData.businessAddress}
                    onChange={(e) => handleInputChange("businessAddress", e.target.value)}
                    placeholder="Endereço completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    value={receiptData.businessPhone}
                    onChange={(e) => handleInputChange("businessPhone", e.target.value)}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Cliente */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-500" />
                  Dados do Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome Completo</Label>
                  <Input
                    value={receiptData.customerName}
                    onChange={(e) => handleInputChange("customerName", e.target.value)}
                    placeholder="Nome do cliente"
                  />
                </div>
                <div className="space-y-2">
                  <Label>CPF</Label>
                  <Input
                    value={receiptData.customerCpf}
                    onChange={(e) => handleInputChange("customerCpf", e.target.value)}
                    placeholder="000.000.000-00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    value={receiptData.customerPhone}
                    onChange={(e) => handleInputChange("customerPhone", e.target.value)}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Pagamento */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                  Detalhes do Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Serviço/Plano</Label>
                  <Input
                    value={receiptData.planName}
                    onChange={(e) => handleInputChange("planName", e.target.value)}
                    placeholder="Nome do serviço"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valor (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={receiptData.amount}
                    onChange={(e) => handleInputChange("amount", parseFloat(e.target.value) || 0)}
                    placeholder="0,00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data do Pagamento</Label>
                  <Input
                    type="date"
                    value={receiptData.paymentDate}
                    onChange={(e) => handleInputChange("paymentDate", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Forma de Pagamento</Label>
                  <select
                    value={receiptData.paymentMethod}
                    onChange={(e) => handleInputChange("paymentMethod", e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {paymentMethodOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label>Mês de Referência</Label>
                  <Input
                    value={receiptData.referenceMonth}
                    onChange={(e) => handleInputChange("referenceMonth", e.target.value)}
                    placeholder="Ex: Janeiro de 2025"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Observações */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-500" />
                  Observações (Opcional)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={receiptData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  placeholder="Adicione observações que serão incluídas no comprovante..."
                  rows={3}
                  className="resize-none"
                />
              </CardContent>
            </Card>

            {/* Cláusulas Adicionais */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-500" />
                  Cláusulas Adicionais (Opcional)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={receiptData.additionalClauses}
                  onChange={(e) => handleInputChange("additionalClauses", e.target.value)}
                  placeholder="Adicione cláusulas personalizadas que serão incluídas no comprovante..."
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
                  <h2 className="text-xl font-bold">COMPROVANTE DE PAGAMENTO</h2>
                  <p className="text-muted-foreground mt-1">
                    {receiptData.businessName || "[Nome da Empresa]"}
                  </p>
                </div>

                {/* Prestador */}
                <div>
                  <h3 className="font-semibold text-emerald-600 mb-2">DADOS DO PRESTADOR:</h3>
                  <p><strong>{receiptData.businessName || "[Nome da Empresa]"}</strong></p>
                  <p>CPF/CNPJ: {receiptData.businessCpfCnpj || "[Não informado]"}</p>
                  <p>Endereço: {receiptData.businessAddress || "[Não informado]"}</p>
                  <p>Telefone: {receiptData.businessPhone || "[Não informado]"}</p>
                </div>

                <Separator />

                {/* Cliente */}
                <div>
                  <h3 className="font-semibold text-emerald-600 mb-2">DADOS DO CLIENTE:</h3>
                  <p><strong>{receiptData.customerName || "[Nome do Cliente]"}</strong></p>
                  <p>CPF: {receiptData.customerCpf || "[Não informado]"}</p>
                  <p>Telefone: {receiptData.customerPhone || "[Não informado]"}</p>
                </div>

                <Separator />

                {/* Valor */}
                <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-6 rounded-xl text-center">
                  <p className="text-sm opacity-90 mb-2">Valor Pago</p>
                  <p className="text-3xl font-bold">{formatCurrency(receiptData.amount)}</p>
                </div>

                {/* Detalhes */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Serviço</p>
                    <p className="font-medium">{receiptData.planName || "[Não informado]"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Referência</p>
                    <p className="font-medium">{receiptData.referenceMonth || "[Não informado]"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Data do Pagamento</p>
                    <p className="font-medium">
                      {receiptData.paymentDate ? (() => {
                        try {
                          const date = new Date(receiptData.paymentDate + "T12:00:00");
                          if (isNaN(date.getTime())) return "[Data inválida]";
                          return format(date, "dd/MM/yyyy", { locale: ptBR });
                        } catch {
                          return "[Data inválida]";
                        }
                      })() : "[Não informada]"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Forma de Pagamento</p>
                    <p className="font-medium">
                      {paymentMethodOptions.find(p => p.value === receiptData.paymentMethod)?.label || receiptData.paymentMethod}
                    </p>
                  </div>
                </div>

                {/* Notes */}
                {receiptData.notes && (
                  <>
                    <Separator />
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <h3 className="font-semibold text-sm mb-2">OBSERVAÇÕES:</h3>
                      <p className="whitespace-pre-wrap text-sm">{receiptData.notes}</p>
                    </div>
                  </>
                )}

                {/* Additional Clauses */}
                {receiptData.additionalClauses && (
                  <>
                    <Separator />
                    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-lg dark:bg-amber-900/20">
                      <h3 className="font-semibold text-sm mb-2 text-amber-800 dark:text-amber-300">CLÁUSULAS ADICIONAIS:</h3>
                      <p className="whitespace-pre-wrap text-sm text-amber-900 dark:text-amber-200">{receiptData.additionalClauses}</p>
                    </div>
                  </>
                )}

                {/* Signatures */}
                <div className="mt-8 pt-8 border-t">
                  <div className="grid grid-cols-2 gap-8 text-center">
                    <div>
                      <div className="border-t border-foreground/50 pt-2 mt-12">
                        <p className="font-medium">{receiptData.businessName || "Prestador"}</p>
                      </div>
                    </div>
                    <div>
                      <div className="border-t border-foreground/50 pt-2 mt-12">
                        <p className="font-medium">{receiptData.customerName || "Cliente"}</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-center text-muted-foreground mt-6 text-xs">
                    {format(new Date(), "'Documento gerado em 'dd' de 'MMMM' de 'yyyy", { locale: ptBR })}
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
            onClick={generateAndPrint}
            disabled={isGenerating}
            className="gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
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
