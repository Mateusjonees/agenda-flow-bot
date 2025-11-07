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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
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

    // Verificar autenticação
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const reportData: ReportData = await req.json();
    console.log('Generating PDF report for user:', user.id);

    // Buscar configurações do negócio
    const { data: businessSettings } = await supabaseClient
      .from('business_settings')
      .select('business_name')
      .eq('user_id', user.id)
      .single();

    const businessName = businessSettings?.business_name || 'Meu Negócio';

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
            border-bottom: 3px solid #FF6B35;
            padding-bottom: 20px;
          }
          .header h1 {
            color: #FF6B35;
            margin: 0;
            font-size: 28px;
          }
          .header p {
            color: #666;
            margin: 10px 0 0 0;
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
            border-left: 4px solid #FF6B35;
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
            color: #FF6B35;
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
            background: #FF6B35;
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
            border-top: 2px solid #FF6B35;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${businessName}</h1>
          <p>Relatório Financeiro</p>
          <p>${formatDate(reportData.startDate)} até ${formatDate(reportData.endDate)}</p>
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
          <p>${businessName} - Sistema de Gestão</p>
        </div>
      </body>
      </html>
    `;

    // Usar API do Cloudflare Workers para converter HTML em PDF
    // Como alternativa simples, vamos retornar um base64 do HTML para o cliente processar
    // Em produção, você pode usar serviços como PDFShift, DocRaptor, ou Puppeteer no servidor
    
    // Por enquanto, vamos usar uma abordagem simplificada com a API do navegador
    // O cliente receberá o HTML e usará window.print() ou outra biblioteca
    
    const base64Html = btoa(unescape(encodeURIComponent(htmlContent)));

    console.log('PDF report generated successfully');

    return new Response(
      JSON.stringify({ 
        pdf: base64Html,
        type: 'html' // Cliente saberá que precisa processar como HTML
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
        error: errorMessage
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
