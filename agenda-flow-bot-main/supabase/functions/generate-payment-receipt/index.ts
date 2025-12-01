import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReceiptRequest {
  paymentId: string;
  paymentType: 'pix' | 'transaction';
}

serve(async (req) => {
  // Handle CORS preflight requests
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

    // Verificar autenticação
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      throw new Error('Não autenticado');
    }

    const { paymentId, paymentType }: ReceiptRequest = await req.json();

    if (!paymentId || !paymentType) {
      throw new Error('Dados incompletos');
    }

    console.log(`Gerando recibo para ${paymentType} ID: ${paymentId}`);

    let paymentData: any = null;
    let businessSettings: any = null;

    // Buscar configurações do negócio
    const { data: settings } = await supabaseClient
      .from('business_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    businessSettings = settings;

    // Buscar dados do pagamento
    if (paymentType === 'pix') {
      const { data: pixCharge, error: pixError } = await supabaseClient
        .from('pix_charges')
        .select('*')
        .eq('id', paymentId)
        .eq('user_id', user.id)
        .single();

      if (pixError || !pixCharge) {
        throw new Error('Pagamento não encontrado');
      }

      if (pixCharge.status !== 'paid') {
        throw new Error('Pagamento ainda não foi confirmado');
      }

      paymentData = {
        id: pixCharge.id,
        date: pixCharge.paid_at || pixCharge.created_at,
        amount: pixCharge.amount,
        method: 'PIX',
        description: pixCharge.description || 'Assinatura Plataforma Foguetinho',
        customer_name: pixCharge.customer_name,
        txid: pixCharge.txid,
      };
    } else {
      const { data: transaction, error: txError } = await supabaseClient
        .from('financial_transactions')
        .select('*')
        .eq('id', paymentId)
        .eq('user_id', user.id)
        .single();

      if (txError || !transaction) {
        throw new Error('Transação não encontrada');
      }

      if (transaction.status !== 'paid' && transaction.status !== 'completed') {
        throw new Error('Transação ainda não foi confirmada');
      }

      paymentData = {
        id: transaction.id,
        date: transaction.transaction_date,
        amount: transaction.amount,
        method: transaction.payment_method || 'N/A',
        description: transaction.description,
        customer_name: 'N/A',
        txid: transaction.id,
      };
    }

    // Gerar HTML do recibo
    const receiptHTML = generateReceiptHTML(paymentData, businessSettings, user);

    // Retornar HTML para ser convertido em PDF no frontend
    return new Response(
      JSON.stringify({ 
        success: true, 
        html: receiptHTML,
        paymentData,
      }),
      {
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        },
      }
    );

  } catch (error: any) {
    console.error('Error generating receipt:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        },
      }
    );
  }
});

function generateReceiptHTML(payment: any, settings: any, user: any): string {
  const date = new Date(payment.date);
  const formattedDate = date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const formattedAmount = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(payment.amount);

  const businessName = settings?.business_name || 'Plataforma Foguetinho';
  const businessCnpj = settings?.cpf_cnpj || 'N/A';
  const businessEmail = settings?.email || user.email;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Arial', sans-serif;
      padding: 40px;
      background: white;
      color: #333;
    }
    
    .receipt {
      max-width: 800px;
      margin: 0 auto;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      padding: 40px;
    }
    
    .header {
      text-align: center;
      margin-bottom: 40px;
      border-bottom: 2px solid #f97316;
      padding-bottom: 20px;
    }
    
    .header h1 {
      color: #f97316;
      font-size: 32px;
      margin-bottom: 10px;
    }
    
    .header p {
      color: #6b7280;
      font-size: 14px;
    }
    
    .info-section {
      margin-bottom: 30px;
    }
    
    .info-section h2 {
      color: #1f2937;
      font-size: 18px;
      margin-bottom: 15px;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 8px;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-top: 15px;
    }
    
    .info-item {
      display: flex;
      flex-direction: column;
    }
    
    .info-label {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    
    .info-value {
      font-size: 16px;
      color: #1f2937;
      font-weight: 500;
    }
    
    .amount-section {
      background: #fef3c7;
      border: 2px solid #fbbf24;
      border-radius: 8px;
      padding: 20px;
      margin: 30px 0;
      text-align: center;
    }
    
    .amount-label {
      font-size: 14px;
      color: #92400e;
      margin-bottom: 8px;
    }
    
    .amount-value {
      font-size: 36px;
      color: #92400e;
      font-weight: bold;
    }
    
    .status-badge {
      display: inline-block;
      background: #10b981;
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      margin-top: 10px;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
    }
    
    .footer p {
      margin: 5px 0;
    }
    
    .qr-notice {
      background: #dbeafe;
      border-left: 4px solid #3b82f6;
      padding: 15px;
      margin-top: 20px;
      font-size: 13px;
      color: #1e40af;
    }
    
    @media print {
      body {
        padding: 0;
      }
      .receipt {
        border: none;
      }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <h1>🚀 ${businessName}</h1>
      <p>Recibo de Pagamento</p>
      <p>Documento gerado em: ${new Date().toLocaleDateString('pt-BR')}</p>
    </div>
    
    <div class="info-section">
      <h2>Dados da Empresa</h2>
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Nome/Razão Social</span>
          <span class="info-value">${businessName}</span>
        </div>
        <div class="info-item">
          <span class="info-label">CPF/CNPJ</span>
          <span class="info-value">${businessCnpj}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Email</span>
          <span class="info-value">${businessEmail}</span>
        </div>
      </div>
    </div>
    
    <div class="info-section">
      <h2>Detalhes do Pagamento</h2>
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Data/Hora</span>
          <span class="info-value">${formattedDate}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Método de Pagamento</span>
          <span class="info-value">${payment.method}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Descrição</span>
          <span class="info-value">${payment.description}</span>
        </div>
        <div class="info-item">
          <span class="info-label">ID da Transação</span>
          <span class="info-value">${payment.txid.substring(0, 20)}...</span>
        </div>
      </div>
    </div>
    
    <div class="amount-section">
      <div class="amount-label">Valor Pago</div>
      <div class="amount-value">${formattedAmount}</div>
      <div class="status-badge">✓ PAGAMENTO CONFIRMADO</div>
    </div>
    
    <div class="qr-notice">
      <strong>ℹ️ Informação:</strong> Este documento serve como comprovante de pagamento da assinatura da Plataforma Foguetinho. 
      Em caso de dúvidas, entre em contato através do email ${businessEmail}.
    </div>
    
    <div class="footer">
      <p><strong>Plataforma Foguetinho</strong></p>
      <p>Sistema de Gestão Empresarial</p>
      <p>Este é um documento gerado automaticamente. Não requer assinatura.</p>
      <p style="margin-top: 15px; font-size: 11px;">
        Recibo #${payment.id} | Gerado em ${new Date().toLocaleString('pt-BR')}
      </p>
    </div>
  </div>
</body>
</html>
  `;
}
