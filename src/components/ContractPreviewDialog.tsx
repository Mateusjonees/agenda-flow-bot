import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Printer, User, Building2, Loader2, Eye, Edit3, Plus, Trash2, ChevronUp, ChevronDown, Download } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { downloadPdfFromHtml, printHtml } from "@/lib/pdf";
import { toDateInputValue, formatLongPtBr, getDayOfMonth } from "@/lib/date";

interface Clause {
  id: string;
  title: string;
  text: string;
}

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
  businessSettings
}: ContractPreviewDialogProps) {
  const [activeTab, setActiveTab] = useState("dados");
  const [isGenerating, setIsGenerating] = useState(false);

  const [contractData, setContractData] = useState({
    businessName: "",
    businessCpfCnpj: "",
    businessAddress: "",
    businessEmail: "",
    businessPhone: "",
    customerName: "",
    customerCpf: "",
    customerAddress: "",
    customerEmail: "",
    customerPhone: "",
    planName: "",
    planPrice: 0,
    billingDay: 1,
    startDate: "",
  });

  const [clauses, setClauses] = useState<Clause[]>([]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  useEffect(() => {
    if (open && subscription && plan && customer) {
      const planName = plan?.name || "";
      const planPrice = plan?.price || subscription?.price || 0;
      const startDateRaw = subscription?.start_date || new Date().toISOString().split("T")[0];
      const billingDay = getDayOfMonth(subscription?.next_billing_date) || 1;
      const formattedStartDate = formatLongPtBr(startDateRaw);
      const formattedPrice = formatCurrency(planPrice);

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
        planName: planName,
        planPrice: planPrice,
        billingDay: billingDay,
        startDate: toDateInputValue(startDateRaw),
      });

      // Initialize default clauses
      setClauses([
        {
          id: "1",
          title: "Cláusula 1ª - Do Objeto",
          text: `O presente contrato tem como objeto a prestação de serviços conforme o plano "${planName}", pelo valor de ${formattedPrice}, com periodicidade mensal. Os serviços serão prestados com qualidade e profissionalismo.`
        },
        {
          id: "2",
          title: "Cláusula 2ª - Do Pagamento",
          text: `O pagamento será realizado mensalmente, com vencimento todo dia ${billingDay}. Em caso de atraso, será aplicada multa de 2% sobre o valor devido, acrescido de juros de mora de 1% ao mês.`
        },
        {
          id: "3",
          title: "Cláusula 3ª - Da Vigência",
          text: `O presente contrato entra em vigor na data de sua assinatura, com início dos serviços em ${formattedStartDate}, com renovação automática, salvo manifestação contrária com antecedência mínima de 30 dias.`
        },
        {
          id: "4",
          title: "Cláusula 4ª - Do Cancelamento",
          text: `O contratado poderá solicitar o cancelamento a qualquer momento, mediante aviso prévio de 30 dias. O cancelamento será efetivado ao término do ciclo de cobrança vigente.`
        },
        {
          id: "5",
          title: "Cláusula 5ª - Do Foro",
          text: `As partes elegem o foro da comarca do contratante para dirimir quaisquer questões oriundas deste contrato.`
        }
      ]);

      setActiveTab("dados");
    }
  }, [open, subscription, plan, customer, businessSettings]);

  const handleInputChange = (field: string, value: string | number) => {
    setContractData(prev => ({ ...prev, [field]: value }));
  };

  const handleClauseChange = (id: string, field: "title" | "text", value: string) => {
    setClauses(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const addClause = () => {
    const newId = Date.now().toString();
    setClauses(prev => [...prev, {
      id: newId,
      title: `Cláusula ${prev.length + 1}ª`,
      text: ""
    }]);
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

  const generateContractHtml = () => {
    const currentDate = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

    const clausesHtml = clauses.map(clause => `
      <div class="clause">
        <div class="clause-title">${clause.title}</div>
        <div class="clause-text">${clause.text}</div>
      </div>
    `).join("");

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Contrato de Prestação de Serviços</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: A4; margin: 20mm; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.8; color: #1e293b; max-width: 800px; margin: 0 auto; padding: 40px; background: white; }
    .header { text-align: center; border-bottom: 3px solid #0f172a; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { font-size: 24px; font-weight: 800; color: #0f172a; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px; }
    .header p { color: #64748b; font-size: 14px; }
    .section { margin-bottom: 24px; }
    .section-title { font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
    .party-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
    .party-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; }
    .party-box h3 { font-size: 13px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 12px; }
    .party-info { margin-bottom: 8px; }
    .party-label { font-size: 11px; color: #94a3b8; text-transform: uppercase; }
    .party-value { font-size: 14px; font-weight: 600; color: #0f172a; }
    .clause { background: #fff; border-left: 4px solid #0f172a; padding: 16px 20px; margin-bottom: 16px; border-radius: 0 8px 8px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .clause-title { font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 8px; text-transform: uppercase; }
    .clause-text { font-size: 14px; line-height: 1.8; color: #475569; text-align: justify; white-space: pre-wrap; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; margin-top: 80px; }
    .signature-box { text-align: center; }
    .signature-line { border-top: 2px solid #0f172a; padding-top: 10px; margin-top: 60px; }
    .signature-name { font-size: 14px; font-weight: 700; color: #0f172a; }
    .signature-role { font-size: 12px; color: #64748b; }
    .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 12px; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>Contrato de Prestação de Serviços</h1>
    <p>Contrato Nº ${subscription?.id?.substring(0, 8).toUpperCase() || "---"}</p>
  </div>

  <div class="party-grid">
    <div class="party-box">
      <h3>📋 Contratante</h3>
      <div class="party-info">
        <div class="party-label">Nome/Razão Social</div>
        <div class="party-value">${contractData.businessName || "[Não informado]"}</div>
      </div>
      <div class="party-info">
        <div class="party-label">CPF/CNPJ</div>
        <div class="party-value">${contractData.businessCpfCnpj || "[Não informado]"}</div>
      </div>
      <div class="party-info">
        <div class="party-label">Endereço</div>
        <div class="party-value">${contractData.businessAddress || "[Não informado]"}</div>
      </div>
      <div class="party-info">
        <div class="party-label">E-mail</div>
        <div class="party-value">${contractData.businessEmail || "[Não informado]"}</div>
      </div>
      <div class="party-info">
        <div class="party-label">Telefone</div>
        <div class="party-value">${contractData.businessPhone || "[Não informado]"}</div>
      </div>
    </div>

    <div class="party-box">
      <h3>👤 Contratado</h3>
      <div class="party-info">
        <div class="party-label">Nome Completo</div>
        <div class="party-value">${contractData.customerName || "[Não informado]"}</div>
      </div>
      <div class="party-info">
        <div class="party-label">CPF</div>
        <div class="party-value">${contractData.customerCpf || "[Não informado]"}</div>
      </div>
      <div class="party-info">
        <div class="party-label">Endereço</div>
        <div class="party-value">${contractData.customerAddress || "[Não informado]"}</div>
      </div>
      <div class="party-info">
        <div class="party-label">E-mail</div>
        <div class="party-value">${contractData.customerEmail || "[Não informado]"}</div>
      </div>
      <div class="party-info">
        <div class="party-label">Telefone</div>
        <div class="party-value">${contractData.customerPhone || "[Não informado]"}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">📜 Cláusulas Contratuais</div>
    ${clausesHtml}
  </div>

  <div class="signatures">
    <div class="signature-box">
      <div class="signature-line">
        <div class="signature-name">${contractData.businessName || "CONTRATANTE"}</div>
        <div class="signature-role">Prestador de Serviços</div>
      </div>
    </div>
    <div class="signature-box">
      <div class="signature-line">
        <div class="signature-name">${contractData.customerName || "CONTRATADO"}</div>
        <div class="signature-role">Cliente</div>
      </div>
    </div>
  </div>

  <div class="footer">
    <p>Documento gerado em: ${currentDate}</p>
    <p>Contrato Nº: ${subscription?.id?.substring(0, 8).toUpperCase() || "---"}</p>
  </div>
</body>
</html>
    `;
  };

  const handleDownloadPdf = async () => {
    setIsGenerating(true);
    try {
      const html = generateContractHtml();
      const filename = `Contrato - ${contractData.customerName || "Cliente"} - ${format(new Date(), "yyyy-MM-dd")}.pdf`;
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
    const html = generateContractHtml();
    printHtml(html);
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
                Edite os dados e cláusulas antes de gerar
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
                  <Input value={contractData.businessName} onChange={e => handleInputChange("businessName", e.target.value)} placeholder="Nome da empresa" />
                </div>
                <div className="space-y-2">
                  <Label>CPF/CNPJ</Label>
                  <Input value={contractData.businessCpfCnpj} onChange={e => handleInputChange("businessCpfCnpj", e.target.value)} placeholder="00.000.000/0000-00" />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label>Endereço</Label>
                  <Input value={contractData.businessAddress} onChange={e => handleInputChange("businessAddress", e.target.value)} placeholder="Endereço completo" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={contractData.businessEmail} onChange={e => handleInputChange("businessEmail", e.target.value)} placeholder="email@empresa.com" />
                </div>
                <div className="space-y-2">
                  <Label>Telefone/WhatsApp</Label>
                  <Input value={contractData.businessPhone} onChange={e => handleInputChange("businessPhone", e.target.value)} placeholder="(00) 00000-0000" />
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
                  <Input value={contractData.customerName} onChange={e => handleInputChange("customerName", e.target.value)} placeholder="Nome do cliente" />
                </div>
                <div className="space-y-2">
                  <Label>CPF</Label>
                  <Input value={contractData.customerCpf} onChange={e => handleInputChange("customerCpf", e.target.value)} placeholder="000.000.000-00" />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label>Endereço</Label>
                  <Input value={contractData.customerAddress} onChange={e => handleInputChange("customerAddress", e.target.value)} placeholder="Endereço completo" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={contractData.customerEmail} onChange={e => handleInputChange("customerEmail", e.target.value)} placeholder="email@cliente.com" />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input value={contractData.customerPhone} onChange={e => handleInputChange("customerPhone", e.target.value)} placeholder="(00) 00000-0000" />
                </div>
              </CardContent>
            </Card>

            {/* Plano */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Dados do Plano
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Nome do Plano</Label>
                  <Input value={contractData.planName} onChange={e => handleInputChange("planName", e.target.value)} placeholder="Plano mensal" />
                </div>
                <div className="space-y-2">
                  <Label>Valor (R$)</Label>
                  <Input type="number" step="0.01" value={contractData.planPrice} onChange={e => handleInputChange("planPrice", parseFloat(e.target.value) || 0)} placeholder="0,00" />
                </div>
                <div className="space-y-2">
                  <Label>Dia do Vencimento</Label>
                  <Input type="number" min="1" max="31" value={contractData.billingDay} onChange={e => handleInputChange("billingDay", parseInt(e.target.value) || 1)} placeholder="1" />
                </div>
                <div className="space-y-2">
                  <Label>Data de Início</Label>
                  <Input type="date" value={contractData.startDate} onChange={e => handleInputChange("startDate", e.target.value)} />
                </div>
              </CardContent>
            </Card>

            {/* Cláusulas */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    Cláusulas do Contrato
                  </CardTitle>
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
                      <Input
                        value={clause.title}
                        onChange={e => handleClauseChange(clause.id, "title", e.target.value)}
                        placeholder="Título da cláusula"
                        className="font-medium"
                      />
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => moveClause(clause.id, "up")}
                          disabled={index === 0}
                        >
                          <ChevronUp className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => moveClause(clause.id, "down")}
                          disabled={index === clauses.length - 1}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => removeClause(clause.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <Textarea
                      value={clause.text}
                      onChange={e => handleClauseChange(clause.id, "text", e.target.value)}
                      placeholder="Texto da cláusula..."
                      rows={3}
                    />
                  </div>
                ))}
                {clauses.length === 0 && (
                  <p className="text-muted-foreground text-sm text-center py-4">
                    Nenhuma cláusula. Clique em "Adicionar" para criar.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview" className="mt-6">
            <div className="bg-muted/30 border rounded-xl p-6 space-y-6">
              <div className="text-center border-b pb-4">
                <h2 className="text-xl font-bold">CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h2>
                <p className="text-muted-foreground text-sm">Contrato Nº {subscription?.id?.substring(0, 8).toUpperCase() || "---"}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-background rounded-lg p-4">
                  <h3 className="font-semibold text-sm text-muted-foreground mb-2">CONTRATANTE</h3>
                  <p className="font-medium">{contractData.businessName || "[Não informado]"}</p>
                  <p className="text-sm text-muted-foreground">{contractData.businessCpfCnpj || "[CPF/CNPJ]"}</p>
                  <p className="text-sm text-muted-foreground">{contractData.businessAddress || "[Endereço]"}</p>
                </div>
                <div className="bg-background rounded-lg p-4">
                  <h3 className="font-semibold text-sm text-muted-foreground mb-2">CONTRATADO</h3>
                  <p className="font-medium">{contractData.customerName || "[Não informado]"}</p>
                  <p className="text-sm text-muted-foreground">{contractData.customerCpf || "[CPF]"}</p>
                  <p className="text-sm text-muted-foreground">{contractData.customerAddress || "[Endereço]"}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground">CLÁUSULAS</h3>
                {clauses.map(clause => (
                  <div key={clause.id} className="bg-background rounded-lg p-4 border-l-4 border-primary">
                    <h4 className="font-semibold text-sm mb-2">{clause.title}</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{clause.text}</p>
                  </div>
                ))}
              </div>
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
