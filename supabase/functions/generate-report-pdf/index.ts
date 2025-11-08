import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReportData {
  startDate: string;
  endDate: string;
  summary: {
    total_revenue: number;
    total_expenses: number;
    profit: number;
    canceled_appointments: number;
    pending_payments: number;
  };
  income_transactions: Array<{
    id: string;
    amount: number;
    description: string;
    transaction_date: string;
    payment_method: string;
  }>;
  expense_transactions: Array<{
    id: string;
    amount: number;
    description: string;
    transaction_date: string;
    payment_method: string;
  }>;
  inactive_customers?: Array<{
    name: string;
    days_inactive: number;
    total_spent: number;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting PDF generation...');
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing Authorization header');
      throw new Error('Missing Authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Extrair o JWT do header para validação
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(jwt);
    
    if (userError || !user) {
      console.error('Authentication error:', userError);
      throw new Error('Unauthorized');
    }

    console.log('User authenticated:', user.id);

    const reportData: ReportData = await req.json();
    console.log('Report data received, date range:', reportData.startDate, 'to', reportData.endDate);

    // Buscar configurações do negócio (RLS policies garantem que só busca do próprio usuário)
    const { data: businessSettings, error: bizError } = await supabaseClient
      .from('business_settings')
      .select('business_name, address, email, whatsapp_number, cpf_cnpj, profile_image_url')
      .eq('user_id', user.id)
      .single();

    if (bizError) {
      console.error('Error fetching business settings:', bizError);
    }

    const businessInfo = {
      business_name: businessSettings?.business_name || 'Meu Negócio',
      address: businessSettings?.address || '',
      email: businessSettings?.email || '',
      whatsapp_number: businessSettings?.whatsapp_number || '',
      cpf_cnpj: businessSettings?.cpf_cnpj || '',
      profile_image_url: businessSettings?.profile_image_url || ''
    };
    console.log('Business name:', businessInfo.business_name);

    // Formatar datas
    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(value);
    };

    // Gerar HTML do relatório
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 40px;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 3px solid #E31E24;
            padding-bottom: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 20px;
          }
          .header img {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            object-fit: cover;
          }
          .header-content {
            text-align: left;
          }
          .header h1 {
            color: #E31E24;
            margin: 0;
            font-size: 28px;
          }
          .header p {
            color: #666;
            margin: 5px 0;
            font-size: 12px;
          }
          .summary {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin-bottom: 40px;
          }
          .summary-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #E31E24;
          }
          .summary-card h3 {
            margin: 0 0 10px 0;
            font-size: 14px;
            color: #666;
            text-transform: uppercase;
          }
          .summary-card .value {
            font-size: 24px;
            font-weight: bold;
            color: #333;
          }
          .summary-card.positive .value {
            color: #10b981;
          }
          .summary-card.negative .value {
            color: #ef4444;
          }
          .section {
            margin-bottom: 40px;
          }
          .section h2 {
            color: #E31E24;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th {
            background: #E31E24;
            color: white;
            padding: 12px;
            text-align: left;
            font-size: 12px;
            text-transform: uppercase;
          }
          td {
            padding: 12px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 14px;
          }
          tr:hover {
            background: #f8f9fa;
          }
          .footer {
            margin-top: 60px;
            text-align: center;
            color: #999;
            font-size: 12px;
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
          }
          .total-row {
            font-weight: bold;
            background: #f8f9fa;
            border-top: 2px solid #E31E24;
          }
        </style>
      </head>
      <body>
        <div class="header">
          ${businessInfo.profile_image_url ? `<img src="${businessInfo.profile_image_url}" alt="Logo" />` : ''}
          <div class="header-content">
            <h1>${businessInfo.business_name}</h1>
            <p>Relatório Financeiro</p>
            <p>${formatDate(reportData.startDate)} até ${formatDate(reportData.endDate)}</p>
            ${businessInfo.email ? `<p>📧 ${businessInfo.email}</p>` : ''}
            ${businessInfo.whatsapp_number ? `<p>📱 ${businessInfo.whatsapp_number}</p>` : ''}
            ${businessInfo.address ? `<p>📍 ${businessInfo.address}</p>` : ''}
            ${businessInfo.cpf_cnpj ? `<p>CPF/CNPJ: ${businessInfo.cpf_cnpj}</p>` : ''}
          </div>
        </div>

        <div class="summary">
          <div class="summary-card positive">
            <h3>Receita Total</h3>
            <div class="value">${formatCurrency(reportData.summary.total_revenue)}</div>
          </div>
          <div class="summary-card negative">
            <h3>Despesas Totais</h3>
            <div class="value">${formatCurrency(reportData.summary.total_expenses)}</div>
          </div>
          <div class="summary-card ${reportData.summary.profit >= 0 ? 'positive' : 'negative'}">
            <h3>Lucro Líquido</h3>
            <div class="value">${formatCurrency(reportData.summary.profit)}</div>
          </div>
          <div class="summary-card">
            <h3>Cancelamentos</h3>
            <div class="value">${reportData.summary.canceled_appointments}</div>
          </div>
        </div>

        ${reportData.income_transactions.length > 0 ? `
          <div class="section">
            <h2>Receitas (${reportData.income_transactions.length} transações)</h2>
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Descrição</th>
                  <th>Método</th>
                  <th style="text-align: right;">Valor</th>
                </tr>
              </thead>
              <tbody>
                ${reportData.income_transactions.map(t => `
                  <tr>
                    <td>${formatDate(t.transaction_date)}</td>
                    <td>${t.description}</td>
                    <td>${t.payment_method || 'N/A'}</td>
                    <td style="text-align: right; color: #10b981;">${formatCurrency(t.amount)}</td>
                  </tr>
                `).join('')}
                <tr class="total-row">
                  <td colspan="3">Total de Receitas</td>
                  <td style="text-align: right; color: #10b981;">${formatCurrency(reportData.summary.total_revenue)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        ` : ''}

        ${reportData.expense_transactions.length > 0 ? `
          <div class="section">
            <h2>Despesas (${reportData.expense_transactions.length} transações)</h2>
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Descrição</th>
                  <th>Método</th>
                  <th style="text-align: right;">Valor</th>
                </tr>
              </thead>
              <tbody>
                ${reportData.expense_transactions.map(t => `
                  <tr>
                    <td>${formatDate(t.transaction_date)}</td>
                    <td>${t.description}</td>
                    <td>${t.payment_method || 'N/A'}</td>
                    <td style="text-align: right; color: #ef4444;">${formatCurrency(t.amount)}</td>
                  </tr>
                `).join('')}
                <tr class="total-row">
                  <td colspan="3">Total de Despesas</td>
                  <td style="text-align: right; color: #ef4444;">${formatCurrency(reportData.summary.total_expenses)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        ` : ''}

        ${reportData.inactive_customers && reportData.inactive_customers.length > 0 ? `
          <div class="section">
            <h2>Top 10 Clientes Inativos</h2>
            <table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th style="text-align: center;">Dias Inativo</th>
                  <th style="text-align: right;">Total Gasto</th>
                </tr>
              </thead>
              <tbody>
                ${reportData.inactive_customers.map(c => `
                  <tr>
                    <td>${c.name}</td>
                    <td style="text-align: center;">${c.days_inactive}</td>
                    <td style="text-align: right;">${formatCurrency(c.total_spent)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}

        <div class="footer">
          <p>Relatório gerado em ${formatDate(new Date().toISOString())}</p>
          <p>${businessInfo.business_name} - Sistema de Gestão</p>
        </div>
      </body>
      </html>
    `;

    // Usar base64 encode correto para UTF-8
    const encoder = new TextEncoder();
    const data = encoder.encode(htmlContent);
    const base64 = btoa(String.fromCharCode(...data));

    console.log('PDF report generated successfully for:', businessInfo.business_name);

    return new Response(
      JSON.stringify({ 
        pdf: base64,
        type: 'html',
        businessName: businessInfo.business_name
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    );
  } catch (error) {
    console.error('Error generating PDF:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate PDF report';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined
      }),
      {
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    );
  }
});
