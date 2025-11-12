import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DocumentRequest {
  subscriptionId: string;
  documentType: "contract" | "receipt";
}

const generateContractHTML = (data: any): string => {
  const { business, customer, plan, subscription } = data;
  const startDate = new Date(subscription.start_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  const nextBilling = new Date(subscription.next_billing_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  const currentDate = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contrato de Assinatura - ${subscription.id.substring(0, 8).toUpperCase()}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    @page { size: A4; margin: 0; }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      line-height: 1.8;
      color: #1e293b;
      background: #f8fafc;
      -webkit-font-smoothing: antialiased;
    }
    
    .page {
      width: 210mm;
      min-height: 297mm;
      background: white;
      margin: 0 auto;
      padding: 60px 50px;
      position: relative;
      box-shadow: 0 0 40px rgba(0,0,0,0.08);
    }
    
    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 140px;
      font-weight: 900;
      color: rgba(148, 163, 184, 0.02);
      text-transform: uppercase;
      letter-spacing: 20px;
      pointer-events: none;
    }
    
    .header {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
      color: white;
      padding: 45px 40px;
      margin: -60px -50px 50px;
      position: relative;
      overflow: hidden;
    }
    
    .header::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -10%;
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%);
      border-radius: 50%;
    }
    
    .header-content {
      position: relative;
      z-index: 1;
      text-align: center;
    }
    
    .contract-badge {
      background: rgba(255,255,255,0.15);
      border: 2px solid rgba(255,255,255,0.3);
      display: inline-block;
      padding: 8px 20px;
      border-radius: 50px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 2px;
      margin-bottom: 20px;
      text-transform: uppercase;
    }
    
    .header h1 {
      font-size: 42px;
      font-weight: 900;
      letter-spacing: -1px;
      margin-bottom: 10px;
      text-shadow: 0 4px 8px rgba(0,0,0,0.2);
    }
    
    .contract-number {
      font-size: 16px;
      font-weight: 600;
      opacity: 0.9;
      letter-spacing: 2px;
    }
    
    .parties-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-bottom: 40px;
    }
    
    .party-card {
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border: 2px solid #e2e8f0;
      border-radius: 16px;
      padding: 30px;
      position: relative;
      overflow: hidden;
    }
    
    .party-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 5px;
      background: linear-gradient(90deg, #0f172a 0%, #334155 100%);
    }
    
    .party-title {
      font-size: 13px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #64748b;
      margin-bottom: 20px;
    }
    
    .party-info {
      margin-bottom: 15px;
    }
    
    .party-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #94a3b8;
      display: block;
      margin-bottom: 5px;
    }
    
    .party-value {
      font-size: 15px;
      font-weight: 600;
      color: #0f172a;
      display: block;
    }
    
    .plan-details {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: white;
      border-radius: 20px;
      padding: 35px;
      margin-bottom: 40px;
      box-shadow: 0 20px 40px rgba(15, 23, 42, 0.15);
    }
    
    .plan-header {
      font-size: 15px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      opacity: 0.8;
      margin-bottom: 15px;
    }
    
    .plan-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 25px;
      margin-top: 25px;
    }
    
    .plan-item {
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      border-radius: 12px;
      padding: 20px;
      border: 1px solid rgba(255,255,255,0.2);
    }
    
    .plan-item-label {
      font-size: 11px;
      font-weight: 600;
      opacity: 0.8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    
    .plan-item-value {
      font-size: 18px;
      font-weight: 800;
    }
    
    .clauses-section {
      margin-bottom: 50px;
    }
    
    .section-title {
      font-size: 24px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 30px;
      padding-bottom: 15px;
      border-bottom: 3px solid #0f172a;
    }
    
    .clause {
      background: white;
      border-left: 4px solid #0f172a;
      padding: 25px;
      margin-bottom: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    }
    
    .clause-title {
      font-size: 14px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .clause-text {
      font-size: 14px;
      line-height: 1.9;
      color: #475569;
      text-align: justify;
    }
    
    .signatures-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 50px;
      margin-top: 80px;
      padding-top: 40px;
      border-top: 2px solid #e2e8f0;
    }
    
    .signature-box {
      text-align: center;
    }
    
    .signature-space {
      height: 80px;
      border-bottom: 2px solid #0f172a;
      margin-bottom: 15px;
    }
    
    .signature-name {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 5px;
    }
    
    .signature-role {
      font-size: 13px;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .signature-details {
      font-size: 12px;
      color: #94a3b8;
      margin-top: 5px;
    }
    
    .footer {
      margin-top: 50px;
      padding-top: 30px;
      border-top: 2px solid #e2e8f0;
      text-align: center;
      color: #64748b;
      font-size: 12px;
      line-height: 1.8;
    }
    
    .footer-highlight {
      font-weight: 700;
      color: #0f172a;
    }
    
    @media print {
      body { background: white; }
      .page { box-shadow: none; margin: 0; }
      .no-print { display: none !important; }
      .clause { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="watermark">CONTRATO</div>
  <div class="page">
    <div class="header">
      <div class="header-content">
        <div class="contract-badge">Documento Oficial</div>
        <h1>CONTRATO DE ASSINATURA</h1>
        <div class="contract-number">Contrato Nº ${subscription.id.substring(0, 8).toUpperCase()}</div>
      </div>
    </div>

    <!-- Parties Section -->
    <div class="parties-section">
      <div class="party-card">
        <div class="party-title">📋 Contratante</div>
        <div class="party-info">
          <span class="party-label">Nome/Razão Social</span>
          <span class="party-value">${business.business_name || "Empresa"}</span>
        </div>
        <div class="party-info">
          <span class="party-label">CPF/CNPJ</span>
          <span class="party-value">${business.cpf_cnpj || "Não informado"}</span>
        </div>
        <div class="party-info">
          <span class="party-label">Endereço</span>
          <span class="party-value">${business.address || "Não informado"}</span>
        </div>
        <div class="party-info">
          <span class="party-label">E-mail</span>
          <span class="party-value">${business.email || "Não informado"}</span>
        </div>
        <div class="party-info">
          <span class="party-label">Telefone</span>
          <span class="party-value">${business.whatsapp_number || "Não informado"}</span>
        </div>
      </div>

      <div class="party-card">
        <div class="party-title">👤 Contratado</div>
        <div class="party-info">
          <span class="party-label">Nome Completo</span>
          <span class="party-value">${customer.name}</span>
        </div>
        <div class="party-info">
          <span class="party-label">CPF</span>
          <span class="party-value">${customer.cpf || "Não informado"}</span>
        </div>
        <div class="party-info">
          <span class="party-label">Endereço</span>
          <span class="party-value">${customer.address || "Não informado"}</span>
        </div>
        <div class="party-info">
          <span class="party-label">E-mail</span>
          <span class="party-value">${customer.email || "Não informado"}</span>
        </div>
        <div class="party-info">
          <span class="party-label">Telefone</span>
          <span class="party-value">${customer.phone || "Não informado"}</span>
        </div>
      </div>
    </div>

    <!-- Plan Details -->
    <div class="plan-details">
      <div class="plan-header">🎯 Objeto do Contrato</div>
      <h2 style="font-size: 28px; font-weight: 900; margin-bottom: 10px;">${plan.name}</h2>
      ${plan.description ? `<p style="opacity: 0.9; margin-bottom: 25px; font-size: 15px; line-height: 1.7;">${plan.description}</p>` : ""}
      
      <div class="plan-grid">
        <div class="plan-item">
          <div class="plan-item-label">💰 Valor</div>
          <div class="plan-item-value">${formatCurrency(plan.price)}</div>
        </div>
        <div class="plan-item">
          <div class="plan-item-label">📅 Periodicidade</div>
          <div class="plan-item-value">${plan.billing_frequency === "monthly" ? "Mensal" : plan.billing_frequency === "quarterly" ? "Trimestral" : "Único"}</div>
        </div>
        <div class="plan-item">
          <div class="plan-item-label">🚀 Início</div>
          <div class="plan-item-value">${new Date(subscription.start_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</div>
        </div>
      </div>
    </div>

    <!-- Clauses -->
    <div class="clauses-section">
      <h3 class="section-title">📜 Cláusulas Contratuais</h3>
      
      <div class="clause">
        <div class="clause-title">Cláusula 1ª - Do Objeto</div>
        <div class="clause-text">
          O presente contrato tem como objeto a prestação de serviços conforme o plano "${plan.name}", 
          pelo valor de ${formatCurrency(plan.price)}, com periodicidade 
          ${plan.billing_frequency === "monthly" ? "mensal" : plan.billing_frequency === "quarterly" ? "trimestral" : "única"}. 
          Os serviços serão prestados com qualidade e profissionalismo, conforme as especificações descritas no plano contratado.
        </div>
      </div>

      <div class="clause">
        <div class="clause-title">Cláusula 2ª - Do Pagamento</div>
        <div class="clause-text">
          O pagamento será realizado através do método PIX, com vencimento na data estabelecida de 
          <strong>${nextBilling}</strong>. Em caso de atraso no pagamento, será aplicada multa de 2% (dois por cento) 
          sobre o valor devido, acrescido de juros de mora de 1% (um por cento) ao mês, calculados pro rata die.
        </div>
      </div>

      <div class="clause">
        <div class="clause-title">Cláusula 3ª - Da Vigência</div>
        <div class="clause-text">
          O presente contrato entra em vigor na data de sua assinatura, com início dos serviços em 
          <strong>${startDate}</strong>, com renovação automática conforme a periodicidade estabelecida, 
          salvo manifestação contrária de qualquer das partes com antecedência mínima de 30 (trinta) dias 
          do término da vigência.
        </div>
      </div>

      <div class="clause">
        <div class="clause-title">Cláusula 4ª - Do Cancelamento</div>
        <div class="clause-text">
          O contratado poderá solicitar o cancelamento da assinatura a qualquer momento, mediante aviso prévio de 
          30 (trinta) dias através dos canais oficiais de atendimento. Não haverá direito a reembolso proporcional 
          do período já pago. O cancelamento será efetivado ao término do ciclo de cobrança vigente.
        </div>
      </div>

      <div class="clause">
        <div class="clause-title">Cláusula 5ª - Das Responsabilidades</div>
        <div class="clause-text">
          O contratante se compromete a prestar os serviços descritos no plano contratado com qualidade, 
          profissionalismo e dentro dos prazos estabelecidos. O contratado compromete-se a realizar os pagamentos 
          nas datas acordadas e a utilizar os serviços de forma adequada, respeitando os termos de uso e 
          políticas estabelecidas.
        </div>
      </div>

      <div class="clause">
        <div class="clause-title">Cláusula 6ª - Do Foro</div>
        <div class="clause-text">
          As partes elegem o foro da comarca do contratante para dirimir quaisquer questões, dúvidas ou 
          litígios oriundos do presente contrato, renunciando a qualquer outro, por mais privilegiado que seja.
        </div>
      </div>
    </div>

    <!-- Signatures -->
    <div class="signatures-section">
      <div class="signature-box">
        <div class="signature-space"></div>
        <div class="signature-name">${business.business_name || "CONTRATANTE"}</div>
        <div class="signature-role">Prestador de Serviços</div>
        <div class="signature-details">${business.email || ""}</div>
      </div>

      <div class="signature-box">
        <div class="signature-space"></div>
        <div class="signature-name">${customer.name}</div>
        <div class="signature-role">Cliente Contratante</div>
        <div class="signature-details">${customer.email || ""}</div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p><span class="footer-highlight">Documento gerado em:</span> ${currentDate}</p>
      <p><span class="footer-highlight">Contrato Nº:</span> ${subscription.id.substring(0, 8).toUpperCase()}</p>
      <p>Este documento tem validade jurídica e deve ser guardado por ambas as partes</p>
      <p style="margin-top: 15px; font-size: 10px; opacity: 0.6;">Código de Verificação: ${subscription.id}</p>
    </div>

    <!-- Print Button -->
    <div class="no-print" style="text-align: center; margin-top: 40px;">
      <button onclick="window.print()" style="background: linear-gradient(135deg, #0f172a 0%, #334155 100%); color: white; padding: 16px 40px; border: none; border-radius: 12px; font-size: 16px; font-weight: 700; cursor: pointer; box-shadow: 0 10px 25px rgba(15, 23, 42, 0.3);">
        🖨️ Imprimir ou Salvar como PDF
      </button>
    </div>
  </div>
</body>
</html>
  `;
};

const generateReceiptHTML = (data: any): string => {
  const { business, customer, plan, subscription } = data;
  const startDate = new Date(subscription.start_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  const currentDate = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Comprovante - ${subscription.id.substring(0, 8).toUpperCase()}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    @page { size: A4; margin: 0; }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 40px 20px;
      -webkit-font-smoothing: antialiased;
    }
    
    .receipt-container {
      background: white;
      max-width: 650px;
      width: 100%;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 25px 50px rgba(0,0,0,0.1);
      position: relative;
    }
    
    .receipt-border {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 8px;
      background: linear-gradient(90deg, #059669 0%, #10b981 50%, #34d399 100%);
    }
    
    .header {
      background: linear-gradient(135deg, #059669 0%, #10b981 100%);
      color: white;
      padding: 50px 40px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    
    .header::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
      animation: pulse 4s ease-in-out infinite;
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 0.6; }
    }
    
    .header-content {
      position: relative;
      z-index: 1;
    }
    
    .check-icon {
      width: 80px;
      height: 80px;
      background: rgba(255,255,255,0.2);
      border: 4px solid white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      font-size: 40px;
    }
    
    .header h1 {
      font-size: 36px;
      font-weight: 900;
      margin-bottom: 10px;
      text-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }
    
    .receipt-number {
      background: rgba(255,255,255,0.25);
      backdrop-filter: blur(10px);
      border: 2px solid rgba(255,255,255,0.4);
      display: inline-block;
      padding: 10px 25px;
      border-radius: 50px;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 2px;
      margin-top: 15px;
    }
    
    .content {
      padding: 45px 40px;
    }
    
    .status-badge {
      background: linear-gradient(135deg, #059669 0%, #10b981 100%);
      color: white;
      padding: 15px 30px;
      border-radius: 50px;
      font-size: 18px;
      font-weight: 800;
      text-align: center;
      margin-bottom: 35px;
      box-shadow: 0 10px 30px rgba(5, 150, 105, 0.3);
      letter-spacing: 1px;
    }
    
    .info-section {
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border: 2px solid #e2e8f0;
      border-radius: 16px;
      padding: 30px;
      margin-bottom: 25px;
    }
    
    .info-section-title {
      font-size: 13px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #64748b;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 2px solid #e2e8f0;
    }
    
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 14px 0;
      border-bottom: 1px solid #e2e8f0;
    }
    
    .info-row:last-child {
      border-bottom: none;
    }
    
    .info-label {
      font-size: 13px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .info-value {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
      text-align: right;
    }
    
    .amount-highlight {
      background: linear-gradient(135deg, #059669 0%, #10b981 100%);
      color: white;
      padding: 35px;
      border-radius: 20px;
      text-align: center;
      margin: 30px 0;
      box-shadow: 0 20px 40px rgba(5, 150, 105, 0.2);
    }
    
    .amount-label {
      font-size: 14px;
      font-weight: 600;
      opacity: 0.9;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-bottom: 10px;
    }
    
    .amount-value {
      font-size: 56px;
      font-weight: 900;
      margin: 10px 0;
      text-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }
    
    .amount-frequency {
      font-size: 15px;
      font-weight: 600;
      opacity: 0.9;
    }
    
    .stamp-section {
      text-align: center;
      margin: 35px 0;
      padding: 25px;
      background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
      border: 3px dashed #059669;
      border-radius: 16px;
    }
    
    .stamp-icon {
      font-size: 48px;
      margin-bottom: 10px;
    }
    
    .stamp-text {
      font-size: 20px;
      font-weight: 800;
      color: #059669;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 30px;
      border-top: 2px solid #e2e8f0;
      text-align: center;
      color: #64748b;
      font-size: 12px;
      line-height: 2;
    }
    
    .footer-highlight {
      font-weight: 700;
      color: #0f172a;
    }
    
    .verification-code {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 15px;
      border-radius: 8px;
      margin-top: 20px;
      font-family: 'Courier New', monospace;
      font-size: 11px;
      color: #64748b;
    }
    
    @media print {
      body { background: white; padding: 0; }
      .receipt-container { box-shadow: none; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    <div class="receipt-border"></div>
    
    <div class="header">
      <div class="header-content">
        <div class="check-icon">✓</div>
        <h1>COMPROVANTE</h1>
        <div style="font-size: 16px; opacity: 0.95; margin-top: 8px; font-weight: 600;">Assinatura de Serviços</div>
        <div class="receipt-number">Nº ${subscription.id.substring(0, 8).toUpperCase()}</div>
      </div>
    </div>

    <div class="content">
      <div class="status-badge">
        ✓ ASSINATURA ATIVA
      </div>

      <!-- Business Info -->
      <div class="info-section">
        <div class="info-section-title">🏢 Dados da Empresa</div>
        <div class="info-row">
          <span class="info-label">Empresa</span>
          <span class="info-value">${business.business_name || "Não informado"}</span>
        </div>
        <div class="info-row">
          <span class="info-label">CPF/CNPJ</span>
          <span class="info-value">${business.cpf_cnpj || "Não informado"}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Endereço</span>
          <span class="info-value">${business.address || "Não informado"}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Telefone</span>
          <span class="info-value">${business.whatsapp_number || "Não informado"}</span>
        </div>
        <div class="info-row">
          <span class="info-label">E-mail</span>
          <span class="info-value">${business.email || "Não informado"}</span>
        </div>
      </div>

      <!-- Customer Info -->
      <div class="info-section">
        <div class="info-section-title">👤 Dados do Cliente</div>
        <div class="info-row">
          <span class="info-label">Nome</span>
          <span class="info-value">${customer.name}</span>
        </div>
        <div class="info-row">
          <span class="info-label">CPF</span>
          <span class="info-value">${customer.cpf || "Não informado"}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Telefone</span>
          <span class="info-value">${customer.phone || "Não informado"}</span>
        </div>
        <div class="info-row">
          <span class="info-label">E-mail</span>
          <span class="info-value">${customer.email || "Não informado"}</span>
        </div>
      </div>

      <!-- Plan Info -->
      <div class="info-section">
        <div class="info-section-title">📦 Detalhes do Plano</div>
        <div class="info-row">
          <span class="info-label">Plano Contratado</span>
          <span class="info-value">${plan.name}</span>
        </div>
        ${plan.description ? `
        <div class="info-row">
          <span class="info-label">Descrição</span>
          <span class="info-value">${plan.description}</span>
        </div>
        ` : ""}
        <div class="info-row">
          <span class="info-label">Periodicidade</span>
          <span class="info-value">${plan.billing_frequency === "monthly" ? "Mensal" : plan.billing_frequency === "quarterly" ? "Trimestral" : "Pagamento Único"}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Data de Início</span>
          <span class="info-value">${startDate}</span>
        </div>
      </div>

      <!-- Amount -->
      <div class="amount-highlight">
        <div class="amount-label">💰 Valor da Assinatura</div>
        <div class="amount-value">${formatCurrency(plan.price)}</div>
        <div class="amount-frequency">${plan.billing_frequency === "monthly" ? "por mês" : plan.billing_frequency === "quarterly" ? "por trimestre" : "pagamento único"}</div>
      </div>

      <!-- Status Stamp -->
      <div class="stamp-section">
        <div class="stamp-icon">✓</div>
        <div class="stamp-text">Assinatura Ativa</div>
        <div style="font-size: 13px; color: #064e3b; margin-top: 8px; font-weight: 600;">Documento Válido</div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <p><span class="footer-highlight">Emitido em:</span> ${currentDate} às ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
        <p style="margin-top: 8px;">Este comprovante confirma a assinatura ativa do plano ${plan.name}</p>
        <p><span class="footer-highlight">Comprovante Nº:</span> ${subscription.id.substring(0, 8).toUpperCase()}</p>
        <div class="verification-code">
          <strong>Código de Verificação:</strong> ${subscription.id}
        </div>
      </div>

      <!-- Print Button -->
      <div class="no-print" style="text-align: center; margin-top: 30px;">
        <button onclick="window.print()" style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 16px 40px; border: none; border-radius: 12px; font-size: 16px; font-weight: 700; cursor: pointer; box-shadow: 0 10px 25px rgba(5, 150, 105, 0.3);">
          🖨️ Imprimir ou Salvar como PDF
        </button>
      </div>
    </div>
  </div>
</body>
</html>
  `;
};

// Função auxiliar para converter número em extenso (simplificado)
const extenso = (valor: number): string => {
  // Implementação simplificada
  let parteInteira = Math.floor(valor);
  const parteCentavos = Math.round((valor - parteInteira) * 100);
  
  const unidades = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];
  const dezenas = ["", "dez", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
  const centenas = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];
  
  let resultado = "";
  
  if (parteInteira >= 100) {
    resultado += centenas[Math.floor(parteInteira / 100)] + " ";
    parteInteira = parteInteira % 100;
  }
  
  if (parteInteira >= 10) {
    resultado += dezenas[Math.floor(parteInteira / 10)] + " ";
    parteInteira = parteInteira % 10;
  }
  
  if (parteInteira > 0) {
    resultado += unidades[parteInteira] + " ";
  }
  
  resultado += parteInteira === 1 ? "real" : "reais";
  
  if (parteCentavos > 0) {
    resultado += " e " + parteCentavos + " centavos";
  }
  
  return resultado.trim();
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { subscriptionId, documentType }: DocumentRequest = await req.json();

    console.log(`Generating ${documentType} for subscription ${subscriptionId}`);

    // Buscar dados da assinatura
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("id", subscriptionId)
      .single();

    if (subError) throw subError;

    // Buscar dados do cliente
    const { data: customer, error: custError } = await supabase
      .from("customers")
      .select("*")
      .eq("id", subscription.customer_id)
      .single();

    if (custError) throw custError;

    // Buscar dados do plano
    const { data: plan, error: planError } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("id", subscription.plan_id)
      .single();

    if (planError) throw planError;

    // Buscar dados da empresa
    const { data: business, error: bizError } = await supabase
      .from("business_settings")
      .select("*")
      .eq("user_id", subscription.user_id)
      .single();

    if (bizError) throw bizError;

    const data = { business, customer, plan, subscription };

    // Gerar HTML apropriado
    const html = documentType === "contract" 
      ? generateContractHTML(data)
      : generateReceiptHTML(data);

    console.log(`${documentType} generated successfully`);

    return new Response(html, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
      },
    });

  } catch (error: any) {
    console.error("Error generating document:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
