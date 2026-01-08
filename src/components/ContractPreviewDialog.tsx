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
import { FileText, Printer, Mail, User, Building2, Calendar, DollarSign, Loader2, Eye, Edit3 } from "lucide-react";
import { toast } from "sonner";
import { format, isValid, parse, parseISO } from "date-fns";
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
  businessSettings
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
    customClauses: ""
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
        customClauses: ""
      });
      setActiveTab("dados");
    }
  }, [open, subscription, plan, customer, businessSettings]);
  const handleInputChange = (field: string, value: string | number) => {
    setContractData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  const generateAndPrint = async () => {
    setIsGenerating(true);
    try {
      // Generate contract HTML locally with edited data
      const html = generateContractHtml();
      
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }
      toast.success("Contrato gerado com sucesso!");
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error generating contract:", error);
      toast.error("Erro ao gerar contrato: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateContractHtml = () => {
    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
    };

    const formatDate = (dateStr: string) => {
      try {
        if (!dateStr) return "[Não definida]";
        const date = new Date(dateStr + "T12:00:00");
        if (isNaN(date.getTime())) return "[Data inválida]";
        return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
      } catch {
        return "[Data inválida]";
      }
    };

    const currentDate = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Contrato de Prestação de Serviços</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: A4; margin: 20mm; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.8; color: #1e293b; max-width: 800px; margin: 0 auto; padding: 40px; }
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
    .clause-text { font-size: 14px; line-height: 1.8; color: #475569; text-align: justify; }
    .custom-clauses { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px 20px; margin-top: 20px; border-radius: 0 8px 8px 0; }
    .custom-clauses-title { font-size: 13px; font-weight: 700; color: #92400e; margin-bottom: 8px; text-transform: uppercase; }
    .custom-clauses-text { font-size: 14px; line-height: 1.8; color: #78350f; white-space: pre-wrap; }
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
    
    <div class="clause">
      <div class="clause-title">Cláusula 1ª - Do Objeto</div>
      <div class="clause-text">
        O presente contrato tem como objeto a prestação de serviços conforme o plano "<strong>${contractData.planName}</strong>", 
        pelo valor de <strong>${formatCurrency(contractData.planPrice)}</strong>, com periodicidade mensal. 
        Os serviços serão prestados com qualidade e profissionalismo.
      </div>
    </div>

    <div class="clause">
      <div class="clause-title">Cláusula 2ª - Do Pagamento</div>
      <div class="clause-text">
        O pagamento será realizado mensalmente, com vencimento todo dia <strong>${contractData.billingDay}</strong>.
        Em caso de atraso, será aplicada multa de 2% sobre o valor devido, acrescido de juros de mora de 1% ao mês.
      </div>
    </div>

    <div class="clause">
      <div class="clause-title">Cláusula 3ª - Da Vigência</div>
      <div class="clause-text">
        O presente contrato entra em vigor na data de sua assinatura, com início dos serviços em 
        <strong>${formatDate(contractData.startDate)}</strong>, com renovação automática, 
        salvo manifestação contrária com antecedência mínima de 30 dias.
      </div>
    </div>

    <div class="clause">
      <div class="clause-title">Cláusula 4ª - Do Cancelamento</div>
      <div class="clause-text">
        O contratado poderá solicitar o cancelamento a qualquer momento, mediante aviso prévio de 30 dias.
        O cancelamento será efetivado ao término do ciclo de cobrança vigente.
      </div>
    </div>

    <div class="clause">
      <div class="clause-title">Cláusula 5ª - Do Foro</div>
      <div class="clause-text">
        As partes elegem o foro da comarca do contratante para dirimir quaisquer questões oriundas deste contrato.
      </div>
    </div>

    ${contractData.customClauses ? `
    <div class="custom-clauses">
      <div class="custom-clauses-title">⚡ Cláusulas Adicionais</div>
      <div class="custom-clauses-text">${contractData.customClauses}</div>
    </div>
    ` : ""}
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
  const sendByEmail = async () => {
    if (!contractData.customerEmail) {
      toast.error("Email do cliente não informado");
      return;
    }
    setIsSending(true);
    try {
      const {
        error
      } = await supabase.functions.invoke("send-subscription-document", {
        body: {
          subscriptionId: subscription.id,
          customData: contractData
        }
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
      currency: "BRL"
    }).format(value);
  };
  return <Dialog open={open} onOpenChange={onOpenChange}>
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
                  <Input value={contractData.planName} onChange={e => handleInputChange("planName", e.target.value)} placeholder="Nome do plano" />
                </div>
                <div className="space-y-2">
                  <Label>Valor Mensal (R$)</Label>
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

            {/* Custom Clauses */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Cláusulas Adicionais (Opcional)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea value={contractData.customClauses} onChange={e => handleInputChange("customClauses", e.target.value)} placeholder="Adicione cláusulas personalizadas que serão incluídas no contrato..." rows={4} className="resize-none" />
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
                        return format(date, "dd/MM/yyyy", {
                          locale: ptBR
                        });
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
                {contractData.customClauses && <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold text-primary mb-2">CLÁUSULAS ADICIONAIS:</h3>
                      <p className="whitespace-pre-wrap">{contractData.customClauses}</p>
                    </div>
                  </>}

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
                    {format(new Date(), "'Data: 'dd' de 'MMMM' de 'yyyy", {
                    locale: ptBR
                  })}
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
          
          <Button onClick={generateAndPrint} disabled={isGenerating} className="gap-2 bg-gradient-to-r from-primary to-primary/80">
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
            Visualizar e Imprimir
          </Button>
        </div>
      </DialogContent>
    </Dialog>;
}