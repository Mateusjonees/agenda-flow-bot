import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
}

function formatDateTime(date: string): string {
  return new Date(date).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function extenso(valor: number): string {
  const unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
  const dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  const especiais = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
  
  const inteiro = Math.floor(valor);
  const centavos = Math.round((valor - inteiro) * 100);
  
  let resultado = '';
  
  if (inteiro >= 1000) {
    const milhares = Math.floor(inteiro / 1000);
    resultado += milhares === 1 ? 'mil' : unidades[milhares] + ' mil';
    const resto = inteiro % 1000;
    if (resto > 0) resultado += ' e ';
  }
  
  const centenas = Math.floor((inteiro % 1000) / 100);
  if (centenas > 0) {
    if (centenas === 1) resultado += 'cem';
    else resultado += unidades[centenas] + 'centos';
    if (inteiro % 100 > 0) resultado += ' e ';
  }
  
  const restoDezenas = inteiro % 100;
  if (restoDezenas >= 10 && restoDezenas < 20) {
    resultado += especiais[restoDezenas - 10];
  } else {
    const dez = Math.floor(restoDezenas / 10);
    const un = restoDezenas % 10;
    if (dez > 0) resultado += dezenas[dez];
    if (dez > 0 && un > 0) resultado += ' e ';
    if (un > 0) resultado += unidades[un];
  }
  
  resultado += inteiro === 1 ? ' real' : ' reais';
  
  if (centavos > 0) {
    resultado += ' e ' + centavos + ' centavos';
  }
  
  return resultado;
}

function generateContractHTML(data: any): string {
  const logoSection = data.settings?.profile_image_url 
    ? `<img src="${data.settings.profile_image_url}" alt="Logo" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 3px solid white;">`
    : `<div style="width: 80px; height: 80px; background: white; color: #1a1a2e; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: bold; border: 3px solid white;">${data.settings?.business_name?.[0] || 'E'}</div>`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          line-height: 1.6;
          color: #1a1a2e;
          background: #f8f9fa;
          padding: 40px 20px;
        }
        .container {
          max-width: 900px;
          margin: 0 auto;
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.1);
          position: relative;
        }
        .watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 120px;
          font-weight: 900;
          color: rgba(0,0,0,0.02);
          z-index: 1;
          pointer-events: none;
          letter-spacing: 10px;
        }
        .content {
          position: relative;
          z-index: 2;
        }
        .header {
          background: linear-gradient(135deg, #1a1a2e 0%, #2d2d44 100%);
          color: white;
          padding: 50px 60px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .header::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
        }
        .header-content {
          position: relative;
          z-index: 2;
        }
        .logo {
          margin-bottom: 20px;
          display: flex;
          justify-content: center;
        }
        .doc-badge {
          display: inline-block;
          background: rgba(255,255,255,0.15);
          backdrop-filter: blur(10px);
          padding: 8px 24px;
          border-radius: 30px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 2px;
          text-transform: uppercase;
          border: 1px solid rgba(255,255,255,0.2);
          margin-bottom: 15px;
        }
        .doc-title {
          font-size: 42px;
          font-weight: 700;
          margin: 15px 0 10px 0;
          letter-spacing: -1px;
        }
        .doc-subtitle {
          font-size: 16px;
          opacity: 0.9;
          font-weight: 300;
        }
        .body {
          padding: 60px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin-bottom: 40px;
        }
        .info-card {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          padding: 25px;
          border-radius: 12px;
          border: 1px solid #dee2e6;
        }
        .info-label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #6c757d;
          margin-bottom: 8px;
        }
        .info-value {
          font-size: 15px;
          font-weight: 500;
          color: #1a1a2e;
          margin-bottom: 6px;
        }
        .service-box {
          background: #1a1a2e;
          color: white;
          padding: 30px;
          border-radius: 12px;
          margin: 30px 0;
        }
        .service-title {
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          opacity: 0.8;
          margin-bottom: 15px;
        }
        .service-name {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 10px;
        }
        .service-description {
          font-size: 15px;
          opacity: 0.9;
          line-height: 1.6;
          margin-bottom: 20px;
        }
        .service-details {
          display: flex;
          gap: 30px;
          padding-top: 20px;
          border-top: 1px solid rgba(255,255,255,0.1);
        }
        .service-detail {
          flex: 1;
        }
        .service-detail-label {
          font-size: 11px;
          opacity: 0.7;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 5px;
        }
        .service-detail-value {
          font-size: 20px;
          font-weight: 700;
        }
        .clauses {
          margin: 40px 0;
        }
        .clause {
          margin-bottom: 25px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
          border-left: 4px solid #1a1a2e;
        }
        .clause-title {
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 10px;
          color: #1a1a2e;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .clause-text {
          font-size: 14px;
          line-height: 1.8;
          color: #495057;
          text-align: justify;
        }
        .signature-section {
          margin-top: 60px;
          padding-top: 40px;
          border-top: 2px solid #e9ecef;
        }
        .signature-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          margin-top: 40px;
        }
        .signature-box {
          text-align: center;
        }
        .signature-line {
          border-top: 2px solid #1a1a2e;
          margin-bottom: 10px;
          padding-top: 80px;
        }
        .signature-name {
          font-weight: 600;
          font-size: 15px;
          color: #1a1a2e;
          margin-bottom: 5px;
        }
        .signature-role {
          font-size: 13px;
          color: #6c757d;
        }
        .footer {
          background: #f8f9fa;
          padding: 30px 60px;
          text-align: center;
          font-size: 12px;
          color: #6c757d;
          border-top: 1px solid #dee2e6;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="watermark">CONTRATO</div>
        <div class="content">
          <div class="header">
            <div class="header-content">
              <div class="logo">${logoSection}</div>
              <div class="doc-badge">Documento Oficial</div>
              <h1 class="doc-title">Contrato de Prestação de Serviço</h1>
              <p class="doc-subtitle">Acordo formal de prestação de serviços</p>
            </div>
          </div>

          <div class="body">
            <div class="info-grid">
              <div class="info-card">
                <div class="info-label">Contratante</div>
                <div class="info-value">${data.settings?.business_name || 'Empresa'}</div>
                <div class="info-value" style="font-size: 13px; color: #6c757d;">
                  ${data.settings?.cpf_cnpj || ''}
                </div>
                <div class="info-value" style="font-size: 13px; color: #6c757d;">
                  ${data.settings?.address || ''}
                </div>
                <div class="info-value" style="font-size: 13px; color: #6c757d;">
                  ${data.settings?.email || ''}
                </div>
                <div class="info-value" style="font-size: 13px; color: #6c757d;">
                  ${data.settings?.whatsapp_number || ''}
                </div>
              </div>

              <div class="info-card">
                <div class="info-label">Contratado</div>
                <div class="info-value">${data.customer?.name || 'Cliente'}</div>
                <div class="info-value" style="font-size: 13px; color: #6c757d;">
                  ${data.customer?.cpf || ''}
                </div>
                <div class="info-value" style="font-size: 13px; color: #6c757d;">
                  ${data.customer?.address || ''}
                </div>
                <div class="info-value" style="font-size: 13px; color: #6c757d;">
                  ${data.customer?.email || ''}
                </div>
                <div class="info-value" style="font-size: 13px; color: #6c757d;">
                  ${data.customer?.phone || ''}
                </div>
              </div>
            </div>

            <div class="service-box">
              <div class="service-title">Serviço Contratado</div>
              <div class="service-name">${data.appointment?.title || 'Serviço'}</div>
              ${data.appointment?.description ? `<div class="service-description">${data.appointment.description}</div>` : ''}
              <div class="service-details">
                <div class="service-detail">
                  <div class="service-detail-label">Data do Serviço</div>
                  <div class="service-detail-value">${formatDate(data.appointment?.start_time)}</div>
                </div>
                <div class="service-detail">
                  <div class="service-detail-label">Horário</div>
                  <div class="service-detail-value">${new Date(data.appointment?.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <div class="service-detail">
                  <div class="service-detail-label">Valor Total</div>
                  <div class="service-detail-value">${formatCurrency(data.appointment?.price || 0)}</div>
                </div>
              </div>
            </div>

            <div class="clauses">
              <div class="clause">
                <div class="clause-title">1. Objeto do Contrato</div>
                <div class="clause-text">
                  O presente contrato tem como objeto a prestação do serviço de ${data.appointment?.title || 'serviço'} 
                  pelo CONTRATANTE ao CONTRATADO, conforme especificações e condições estabelecidas neste instrumento.
                </div>
              </div>

              <div class="clause">
                <div class="clause-title">2. Valor e Forma de Pagamento</div>
                <div class="clause-text">
                  O CONTRATADO pagará ao CONTRATANTE o valor de ${formatCurrency(data.appointment?.price || 0)} 
                  (${extenso(data.appointment?.price || 0)}) pela prestação do serviço. 
                  Forma de pagamento: ${data.appointment?.payment_method === 'pix' ? 'PIX' : 
                                       data.appointment?.payment_method === 'credit_card' ? 'Cartão de Crédito' :
                                       data.appointment?.payment_method === 'debit_card' ? 'Cartão de Débito' :
                                       data.appointment?.payment_method === 'cash' ? 'Dinheiro' : 'A definir'}.
                </div>
              </div>

              <div class="clause">
                <div class="clause-title">3. Prazo e Execução</div>
                <div class="clause-text">
                  O serviço será executado na data de ${formatDate(data.appointment?.start_time)} 
                  às ${new Date(data.appointment?.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}, 
                  conforme combinado entre as partes. O CONTRATANTE compromete-se a executar o serviço com qualidade e pontualidade.
                </div>
              </div>

              <div class="clause">
                <div class="clause-title">4. Responsabilidades</div>
                <div class="clause-text">
                  O CONTRATANTE responsabiliza-se pela qualidade dos serviços prestados, utilizando materiais adequados e 
                  seguindo as melhores práticas de mercado. O CONTRATADO compromete-se a fornecer as condições necessárias 
                  para a execução do serviço.
                </div>
              </div>

              <div class="clause">
                <div class="clause-title">5. Cancelamento</div>
                <div class="clause-text">
                  Em caso de cancelamento por parte do CONTRATADO com menos de 24 horas de antecedência, 
                  poderá ser cobrada taxa de reagendamento. O CONTRATANTE compromete-se a avisar sobre imprevistos 
                  com a máxima antecedência possível.
                </div>
              </div>

              <div class="clause">
                <div class="clause-title">6. Disposições Gerais</div>
                <div class="clause-text">
                  As partes elegem o foro da comarca de localização do CONTRATANTE para dirimir quaisquer dúvidas 
                  decorrentes deste contrato. Este contrato entra em vigor na data de sua assinatura.
                </div>
              </div>
            </div>

            <div class="signature-section">
              <p style="text-align: center; color: #6c757d; margin-bottom: 20px;">
                Emitido em ${formatDate(new Date().toISOString())}
              </p>
              <div class="signature-grid">
                <div class="signature-box">
                  <div class="signature-line"></div>
                  <div class="signature-name">${data.settings?.business_name || 'Empresa'}</div>
                  <div class="signature-role">Contratante</div>
                </div>
                <div class="signature-box">
                  <div class="signature-line"></div>
                  <div class="signature-name">${data.customer?.name || 'Cliente'}</div>
                  <div class="signature-role">Contratado</div>
                </div>
              </div>
            </div>
          </div>

          <div class="footer">
            ${data.settings?.business_name || 'Empresa'} • ${data.settings?.email || ''} • ${data.settings?.whatsapp_number || ''}
            <br>
            Documento gerado automaticamente em ${formatDateTime(new Date().toISOString())}
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateReceiptHTML(data: any): string {
  const logoSection = data.settings?.profile_image_url 
    ? `<img src="${data.settings.profile_image_url}" alt="Logo" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 3px solid white;">`
    : `<div style="width: 80px; height: 80px; background: white; color: #059669; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: bold; border: 3px solid white;">${data.settings?.business_name?.[0] || 'E'}</div>`;

  const verificationCode = `SRV-${data.appointment?.id.slice(0, 8).toUpperCase()}`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          line-height: 1.6;
          color: #1a1a2e;
          background: #f8f9fa;
          padding: 40px 20px;
        }
        .container {
          max-width: 900px;
          margin: 0 auto;
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.1);
          position: relative;
        }
        .watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 100px;
          font-weight: 900;
          color: rgba(5, 150, 105, 0.03);
          z-index: 1;
          pointer-events: none;
          letter-spacing: 10px;
        }
        .content {
          position: relative;
          z-index: 2;
        }
        .header {
          background: linear-gradient(135deg, #059669 0%, #10b981 100%);
          color: white;
          padding: 50px 60px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .header::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%);
        }
        .header-content {
          position: relative;
          z-index: 2;
        }
        .logo {
          margin-bottom: 20px;
          display: flex;
          justify-content: center;
        }
        .check-icon {
          width: 60px;
          height: 60px;
          background: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        .check-icon::after {
          content: '✓';
          color: #059669;
          font-size: 36px;
          font-weight: bold;
        }
        .doc-title {
          font-size: 42px;
          font-weight: 700;
          margin: 15px 0 10px 0;
          letter-spacing: -1px;
        }
        .doc-subtitle {
          font-size: 16px;
          opacity: 0.95;
          font-weight: 300;
        }
        .body {
          padding: 60px;
        }
        .status-badge {
          display: inline-block;
          background: linear-gradient(135deg, #059669, #10b981);
          color: white;
          padding: 12px 28px;
          border-radius: 30px;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 30px;
          box-shadow: 0 4px 15px rgba(5, 150, 105, 0.3);
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin-bottom: 40px;
        }
        .info-card {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          padding: 25px;
          border-radius: 12px;
          border: 1px solid #dee2e6;
        }
        .info-label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #6c757d;
          margin-bottom: 8px;
        }
        .info-value {
          font-size: 15px;
          font-weight: 500;
          color: #1a1a2e;
          margin-bottom: 6px;
        }
        .service-summary {
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          border: 2px solid #059669;
          border-radius: 12px;
          padding: 30px;
          margin: 30px 0;
        }
        .service-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 20px;
          border-bottom: 2px solid #059669;
        }
        .service-name {
          font-size: 24px;
          font-weight: 700;
          color: #1a1a2e;
        }
        .service-date {
          font-size: 14px;
          color: #059669;
          font-weight: 600;
        }
        .service-description {
          font-size: 15px;
          color: #495057;
          margin-bottom: 20px;
          line-height: 1.6;
        }
        .service-details {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        .detail-item {
          text-align: center;
          padding: 15px;
          background: white;
          border-radius: 8px;
        }
        .detail-label {
          font-size: 11px;
          color: #6c757d;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 5px;
        }
        .detail-value {
          font-size: 18px;
          font-weight: 700;
          color: #1a1a2e;
        }
        .value-box {
          background: linear-gradient(135deg, #1a1a2e 0%, #2d2d44 100%);
          color: white;
          padding: 40px;
          border-radius: 12px;
          text-align: center;
          margin: 30px 0;
        }
        .value-label {
          font-size: 13px;
          opacity: 0.8;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin-bottom: 15px;
        }
        .value-amount {
          font-size: 56px;
          font-weight: 700;
          letter-spacing: -2px;
        }
        .value-extenso {
          font-size: 14px;
          opacity: 0.9;
          margin-top: 10px;
          font-style: italic;
        }
        .payment-info {
          background: #f8f9fa;
          padding: 25px;
          border-radius: 12px;
          margin: 30px 0;
        }
        .payment-row {
          display: flex;
          justify-content: space-between;
          padding: 15px 0;
          border-bottom: 1px solid #dee2e6;
        }
        .payment-row:last-child {
          border-bottom: none;
        }
        .payment-label {
          font-size: 14px;
          color: #6c757d;
          font-weight: 500;
        }
        .payment-value {
          font-size: 14px;
          font-weight: 600;
          color: #1a1a2e;
        }
        .verification {
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          border: 1px solid #3b82f6;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
          margin: 30px 0;
        }
        .verification-label {
          font-size: 11px;
          color: #3b82f6;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 8px;
          font-weight: 600;
        }
        .verification-code {
          font-size: 20px;
          font-weight: 700;
          color: #1a1a2e;
          font-family: 'Courier New', monospace;
          letter-spacing: 2px;
        }
        .signature-section {
          margin-top: 60px;
          padding-top: 40px;
          border-top: 2px solid #e9ecef;
          text-align: center;
        }
        .signature-box {
          display: inline-block;
          margin: 30px auto 0;
          min-width: 350px;
        }
        .signature-line {
          border-top: 2px solid #1a1a2e;
          margin-bottom: 10px;
          padding-top: 80px;
        }
        .signature-name {
          font-weight: 600;
          font-size: 15px;
          color: #1a1a2e;
          margin-bottom: 5px;
        }
        .signature-role {
          font-size: 13px;
          color: #6c757d;
        }
        .footer {
          background: #f8f9fa;
          padding: 30px 60px;
          text-align: center;
          font-size: 12px;
          color: #6c757d;
          border-top: 1px solid #dee2e6;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="watermark">PAGO</div>
        <div class="content">
          <div class="header">
            <div class="header-content">
              <div class="logo">${logoSection}</div>
              <div class="check-icon"></div>
              <h1 class="doc-title">Comprovante de Serviço</h1>
              <p class="doc-subtitle">Comprovante oficial de prestação de serviço</p>
            </div>
          </div>

          <div class="body">
            <div style="text-align: center;">
              <div class="status-badge">✓ Serviço Concluído</div>
            </div>

            <div class="info-grid">
              <div class="info-card">
                <div class="info-label">Prestador de Serviço</div>
                <div class="info-value">${data.settings?.business_name || 'Empresa'}</div>
                <div class="info-value" style="font-size: 13px; color: #6c757d;">
                  ${data.settings?.cpf_cnpj || ''}
                </div>
                <div class="info-value" style="font-size: 13px; color: #6c757d;">
                  ${data.settings?.address || ''}
                </div>
                <div class="info-value" style="font-size: 13px; color: #6c757d;">
                  ${data.settings?.email || ''}
                </div>
                <div class="info-value" style="font-size: 13px; color: #6c757d;">
                  ${data.settings?.whatsapp_number || ''}
                </div>
              </div>

              <div class="info-card">
                <div class="info-label">Cliente</div>
                <div class="info-value">${data.customer?.name || 'Cliente'}</div>
                <div class="info-value" style="font-size: 13px; color: #6c757d;">
                  ${data.customer?.cpf || ''}
                </div>
                <div class="info-value" style="font-size: 13px; color: #6c757d;">
                  ${data.customer?.email || ''}
                </div>
                <div class="info-value" style="font-size: 13px; color: #6c757d;">
                  ${data.customer?.phone || ''}
                </div>
              </div>
            </div>

            <div class="service-summary">
              <div class="service-header">
                <div class="service-name">${data.appointment?.title || 'Serviço'}</div>
                <div class="service-date">${formatDate(data.appointment?.start_time)}</div>
              </div>
              ${data.appointment?.description ? `<div class="service-description">${data.appointment.description}</div>` : ''}
              <div class="service-details">
                <div class="detail-item">
                  <div class="detail-label">Horário Início</div>
                  <div class="detail-value">${new Date(data.appointment?.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">Horário Término</div>
                  <div class="detail-value">${new Date(data.appointment?.end_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">Status</div>
                  <div class="detail-value" style="color: #059669;">Concluído</div>
                </div>
              </div>
            </div>

            <div class="payment-info">
              <div class="payment-row">
                <span class="payment-label">Forma de Pagamento</span>
                <span class="payment-value">
                  ${data.appointment?.payment_method === 'pix' ? 'PIX' : 
                    data.appointment?.payment_method === 'credit_card' ? 'Cartão de Crédito' :
                    data.appointment?.payment_method === 'debit_card' ? 'Cartão de Débito' :
                    data.appointment?.payment_method === 'cash' ? 'Dinheiro' : 'Não informado'}
                </span>
              </div>
              <div class="payment-row">
                <span class="payment-label">Status do Pagamento</span>
                <span class="payment-value" style="color: #059669;">
                  ${data.appointment?.payment_status === 'paid' ? '✓ Pago' : 
                    data.appointment?.payment_status === 'pending' ? 'Pendente' : 'Não informado'}
                </span>
              </div>
              <div class="payment-row">
                <span class="payment-label">Data do Serviço</span>
                <span class="payment-value">${formatDateTime(data.appointment?.start_time)}</span>
              </div>
            </div>

            <div class="value-box">
              <div class="value-label">Valor Total do Serviço</div>
              <div class="value-amount">${formatCurrency(data.appointment?.price || 0)}</div>
              <div class="value-extenso">${extenso(data.appointment?.price || 0)}</div>
            </div>

            <div class="verification">
              <div class="verification-label">Código de Verificação</div>
              <div class="verification-code">${verificationCode}</div>
            </div>

            <div class="signature-section">
              <p style="color: #6c757d; margin-bottom: 20px;">
                Declaro que o serviço foi prestado conforme descrito acima
              </p>
              <div class="signature-box">
                <div class="signature-line"></div>
                <div class="signature-name">${data.settings?.business_name || 'Empresa'}</div>
                <div class="signature-role">Prestador de Serviço</div>
              </div>
            </div>
          </div>

          <div class="footer">
            ${data.settings?.business_name || 'Empresa'} • ${data.settings?.email || ''} • ${data.settings?.whatsapp_number || ''}
            <br>
            Documento gerado automaticamente em ${formatDateTime(new Date().toISOString())}
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    const { appointmentId, documentType } = await req.json();

    if (!appointmentId || !documentType) {
      throw new Error('appointmentId and documentType are required');
    }

    console.log(`Generating ${documentType} for appointment ${appointmentId}`);

    // Buscar dados do appointment com relacionamentos
    const { data: appointment, error: appointmentError } = await supabaseClient
      .from('appointments')
      .select('*, customers(*), services(*)')
      .eq('id', appointmentId)
      .eq('user_id', user.id)
      .single();

    if (appointmentError || !appointment) {
      throw new Error('Appointment not found');
    }

    // Buscar configurações do negócio
    const { data: settings } = await supabaseClient
      .from('business_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const data = {
      appointment,
      customer: appointment.customers,
      service: appointment.services,
      settings,
    };

    let htmlContent: string;
    
    if (documentType === 'contract') {
      htmlContent = generateContractHTML(data);
      console.log('Service contract generated successfully');
    } else if (documentType === 'receipt') {
      htmlContent = generateReceiptHTML(data);
      console.log('Service receipt generated successfully');
    } else {
      throw new Error('Invalid document type. Use "contract" or "receipt"');
    }

    return new Response(htmlContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
      },
    });

  } catch (error) {
    console.error('Error generating service document:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
