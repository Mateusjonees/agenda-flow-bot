import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt, Printer, User, Building2, DollarSign, Loader2, Eye, Edit3, Plus, Trash2, ChevronUp, ChevronDown, Download } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { downloadPdfFromHtml, printHtml } from "@/lib/pdf";
import { toDateInputValue, formatShortPtBr } from "@/lib/date";

interface Clause {
  id: string;
  title: string;
  text: string;
}

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
    businessName: "",
    businessCpfCnpj: "",
    businessAddress: "",
    businessPhone: "",
    customerName: "",
    customerCpf: "",
    customerPhone: "",
    planName: "",
    amount: 0,
    paymentDate: "",
    paymentMethod: "",
    referenceMonth: "",
    notes: "",
  });

  const [clauses, setClauses] = useState<Clause[]>([]);

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
        paymentDate: toDateInputValue(now),
        paymentMethod: subscription?.payment_method || "pix",
        referenceMonth: format(now, "MMMM 'de' yyyy", { locale: ptBR }),
        notes: "",
      });
      setClauses([]);
      setActiveTab("dados");
    }
  }, [open, subscription, plan, customer, businessSettings]);

  const handleInputChange = (field: string, value: string | number) => {
    setReceiptData(prev => ({ ...prev, [field]: value }));
  };

  const handleClauseChange = (id: string, field: "title" | "text", value: string) => {
    setClauses(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const addClause = () => {
    const newId = Date.now().toString();
    setClauses(prev => [...prev, { id: newId, title: "Termo Adicional", text: "" }]);
  };

  const removeClause = (id: string) => {
    setClauses(prev => prev.filter(c => c.id !== id));
  };

  const moveClause = (id: string, direction: "up" | "down") => {
    setClauses(prev => {
      const index = prev.findIndex(c => c.id === id);
      if (index === -1) return prev;
      if (direction === "up" && index === 0) return prev;
      if (direction === "down" && index === prev.length - 1) return prev;

      const newClauses = [...prev];
      const swapIndex = direction === "up" ? index - 1 : index + 1;
      [newClauses[index], newClauses[swapIndex]] = [newClauses[swapIndex], newClauses[index]];
      return newClauses;
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const paymentMethodLabels: Record<string, string> = {
    pix: "PIX",
    credit_card: "Cartão de Crédito",
    debit_card: "Cartão de Débito",
    boleto: "Boleto",
    cash: "Dinheiro",
    transfer: "Transferência Bancária"
  };

  const paymentMethodOptions = [
    { value: "pix", label: "PIX" },
    { value: "credit_card", label: "Cartão de Crédito" },
    { value: "debit_card", label: "Cartão de Débito" },
    { value: "boleto", label: "Boleto" },
    { value: "cash", label: "Dinheiro" },
    { value: "transfer", label: "Transferência Bancária" }
  ];

  const generateReceiptHtml = () => {
    const clausesHtml = clauses.length > 0 ? `
      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 8px; margin-top: 16px;">
        <div style="font-size: 12px; font-weight: 600; color: #92400e; margin-bottom: 8px; text-transform: uppercase;">Termos Adicionais</div>
        ${clauses.map(c => `
          <div style="margin-bottom: 12px;">
            <div style="font-weight: 600; color: #78350f; margin-bottom: 4px;">${c.title}</div>
            <div style="font-size: 14px; color: #78350f; white-space: pre-wrap;">${c.text}</div>
          </div>
        `).join("")}
      </div>
    ` : "";

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Comprovante de Pagamento</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1a1a1a; max-width: 800px; margin: 0 auto; background: white; }
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
        <div class="info-value">${formatShortPtBr(receiptData.paymentDate)}</div>
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

  ${clausesHtml}

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

  const handleDownloadPdf = async () => {
    setIsGenerating(true);
    try {
      const html = generateReceiptHtml();
      const filename = `Comprovante - ${receiptData.customerName || "Cliente"} - ${format(new Date(), "yyyy-MM-dd")}.pdf`;
      await downloadPdfFromHtml(html, filename);
      toast.success("PDF baixado com sucesso!");
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error generating PDF:", error);
      toast.error("Erro ao gerar PDF: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    const html = generateReceiptHtml();
    printHtml(html);
  };

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
            {/* Prestador */}
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
                  <Input value={receiptData.businessName} onChange={e => handleInputChange("businessName", e.target.value)} placeholder="Nome da empresa" />
                </div>
                <div className="space-y-2">
                  <Label>CPF/CNPJ</Label>
                  <Input value={receiptData.businessCpfCnpj} onChange={e => handleInputChange("businessCpfCnpj", e.target.value)} placeholder="00.000.000/0000-00" />
                </div>
                <div className="space-y-2">
                  <Label>Endereço</Label>
                  <Input value={receiptData.businessAddress} onChange={e => handleInputChange("businessAddress", e.target.value)} placeholder="Endereço completo" />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input value={receiptData.businessPhone} onChange={e => handleInputChange("businessPhone", e.target.value)} placeholder="(00) 00000-0000" />
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
                  <Input value={receiptData.customerName} onChange={e => handleInputChange("customerName", e.target.value)} placeholder="Nome do cliente" />
                </div>
                <div className="space-y-2">
                  <Label>CPF</Label>
                  <Input value={receiptData.customerCpf} onChange={e => handleInputChange("customerCpf", e.target.value)} placeholder="000.000.000-00" />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input value={receiptData.customerPhone} onChange={e => handleInputChange("customerPhone", e.target.value)} placeholder="(00) 00000-0000" />
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
                  <Input value={receiptData.planName} onChange={e => handleInputChange("planName", e.target.value)} placeholder="Nome do serviço" />
                </div>
                <div className="space-y-2">
                  <Label>Valor (R$)</Label>
                  <Input type="number" step="0.01" value={receiptData.amount} onChange={e => handleInputChange("amount", parseFloat(e.target.value) || 0)} placeholder="0,00" />
                </div>
                <div className="space-y-2">
                  <Label>Data do Pagamento</Label>
                  <Input type="date" value={receiptData.paymentDate} onChange={e => handleInputChange("paymentDate", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Forma de Pagamento</Label>
                  <select
                    value={receiptData.paymentMethod}
                    onChange={e => handleInputChange("paymentMethod", e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {paymentMethodOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Mês de Referência</Label>
                  <Input value={receiptData.referenceMonth} onChange={e => handleInputChange("referenceMonth", e.target.value)} placeholder="Janeiro de 2024" />
                </div>
              </CardContent>
            </Card>

            {/* Observações */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea value={receiptData.notes} onChange={e => handleInputChange("notes", e.target.value)} placeholder="Observações adicionais..." rows={3} />
              </CardContent>
            </Card>

            {/* Termos Adicionais */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Termos Adicionais</CardTitle>
                  <Button onClick={addClause} size="sm" variant="outline" className="gap-1">
                    <Plus className="w-4 h-4" />
                    Adicionar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {clauses.map((clause, index) => (
                  <div key={clause.id} className="border rounded-lg p-4 space-y-3 bg-muted/30">
                    <div className="flex items-center gap-2">
                      <Input value={clause.title} onChange={e => handleClauseChange(clause.id, "title", e.target.value)} placeholder="Título" className="font-medium" />
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveClause(clause.id, "up")} disabled={index === 0}>
                          <ChevronUp className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveClause(clause.id, "down")} disabled={index === clauses.length - 1}>
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => removeClause(clause.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <Textarea value={clause.text} onChange={e => handleClauseChange(clause.id, "text", e.target.value)} placeholder="Texto do termo..." rows={2} />
                  </div>
                ))}
                {clauses.length === 0 && (
                  <p className="text-muted-foreground text-sm text-center py-4">
                    Nenhum termo adicional. Clique em "Adicionar" para criar.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview" className="mt-6">
            <div className="bg-muted/30 border rounded-xl p-6 space-y-6">
              <div className="text-center border-b pb-4">
                <h2 className="text-xl font-bold">COMPROVANTE DE PAGAMENTO</h2>
                <p className="text-muted-foreground text-sm">{receiptData.businessName || "[Nome da Empresa]"}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-2">PRESTADOR</h3>
                  <p className="font-medium">{receiptData.businessName || "[Não informado]"}</p>
                  <p className="text-sm text-muted-foreground">{receiptData.businessCpfCnpj || "[CPF/CNPJ]"}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-2">CLIENTE</h3>
                  <p className="font-medium">{receiptData.customerName || "[Não informado]"}</p>
                  <p className="text-sm text-muted-foreground">{receiptData.customerCpf || "[CPF]"}</p>
                </div>
              </div>

              <div className="bg-primary text-primary-foreground rounded-xl p-6 text-center">
                <p className="text-sm opacity-80">Valor Pago</p>
                <p className="text-3xl font-bold">{formatCurrency(receiptData.amount)}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Serviço:</span>
                  <span className="ml-2 font-medium">{receiptData.planName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Referência:</span>
                  <span className="ml-2 font-medium">{receiptData.referenceMonth}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Data:</span>
                  <span className="ml-2 font-medium">{formatShortPtBr(receiptData.paymentDate)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Forma:</span>
                  <span className="ml-2 font-medium">{paymentMethodLabels[receiptData.paymentMethod] || receiptData.paymentMethod}</span>
                </div>
              </div>

              {receiptData.notes && (
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-1">Observações</p>
                  <p className="text-sm">{receiptData.notes}</p>
                </div>
              )}

              {clauses.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-500 p-4 rounded-r-lg">
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-2">Termos Adicionais</p>
                  {clauses.map(c => (
                    <div key={c.id} className="mb-2">
                      <p className="text-sm font-medium text-amber-900 dark:text-amber-100">{c.title}</p>
                      <p className="text-sm text-amber-800 dark:text-amber-200">{c.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancelar
          </Button>
          <Button variant="outline" onClick={handlePrint} className="flex-1 gap-2">
            <Printer className="w-4 h-4" />
            Imprimir
          </Button>
          <Button onClick={handleDownloadPdf} disabled={isGenerating} className="flex-1 gap-2">
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Baixar PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
