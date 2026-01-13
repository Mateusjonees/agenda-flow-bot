import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { MaintenanceGuard } from "./components/MaintenanceGuard";
import { SubscriptionGuard } from "./components/SubscriptionGuard";
import { PasswordResetGuard } from "./components/PasswordResetGuard";
import { CookieConsent } from "./components/CookieConsent";
import { PWAUpdatePrompt } from "./components/PWAUpdatePrompt";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import Layout from "./components/Layout";
import Agendamentos from "./pages/Agendamentos";
import Clientes from "./pages/Clientes";
import Configuracoes from "./pages/Configuracoes";
import Financeiro from "./pages/Financeiro";
import Relatorios from "./pages/Relatorios";
import Propostas from "./pages/Propostas";
import Assinaturas from "./pages/Assinaturas";
import Tarefas from "./pages/Tarefas";
import Estoque from "./pages/Estoque";
import Servicos from "./pages/Servicos";
import Pricing from "./pages/Pricing";
import Planos from "./pages/Planos";
import Maintenance from "./pages/Maintenance";
import NotFound from "./pages/NotFound";
import HistoricoPagamentos from "./pages/HistoricoPagamentos";
import Produtos from "./pages/Produtos";
import ConversasWhatsApp from "./pages/ConversasWhatsApp";
import PedidosWhatsApp from "./pages/PedidosWhatsApp";
import TreinamentoIA from "./pages/TreinamentoIA";
import PoliticaPrivacidade from "./pages/PoliticaPrivacidade";
import TermosServico from "./pages/TermosServico";
import HistoricoAssinaturas from "./pages/HistoricoAssinaturas";
import FAQ from "./pages/FAQ";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <PWAUpdatePrompt />
          <BrowserRouter>
            <PasswordResetGuard>
              <MaintenanceGuard>
              <Routes>
                {/* Rotas públicas (sem guard) */}
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/manutencao" element={<Maintenance />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/politica-privacidade" element={<PoliticaPrivacidade />} />
                <Route path="/termos-servico" element={<TermosServico />} />
                <Route path="/faq" element={<FAQ />} />
                
                {/* Página de configurações (fora do guard para permitir renovação) */}
                <Route path="/configuracoes" element={<Layout><Configuracoes /></Layout>} />
                <Route path="/historico-pagamentos" element={<Layout><HistoricoPagamentos /></Layout>} />
                <Route path="/historico-assinaturas" element={<Layout><HistoricoAssinaturas /></Layout>} />
                
                {/* Rotas protegidas (com guard) */}
                <Route path="/dashboard" element={<Layout><SubscriptionGuard><Dashboard /></SubscriptionGuard></Layout>} />
                <Route path="/agendamentos" element={<Layout><SubscriptionGuard><Agendamentos /></SubscriptionGuard></Layout>} />
                <Route path="/clientes" element={<Layout><SubscriptionGuard><Clientes /></SubscriptionGuard></Layout>} />
                <Route path="/servicos" element={<Layout><SubscriptionGuard><Servicos /></SubscriptionGuard></Layout>} />
                <Route path="/financeiro" element={<Layout><SubscriptionGuard><Financeiro /></SubscriptionGuard></Layout>} />
                <Route path="/relatorios" element={<Layout><SubscriptionGuard><Relatorios /></SubscriptionGuard></Layout>} />
                <Route path="/propostas" element={<Layout><SubscriptionGuard><Propostas /></SubscriptionGuard></Layout>} />
                <Route path="/assinaturas" element={<Layout><SubscriptionGuard><Assinaturas /></SubscriptionGuard></Layout>} />
                <Route path="/planos" element={<Layout><SubscriptionGuard><Planos /></SubscriptionGuard></Layout>} />
                <Route path="/tarefas" element={<Layout><SubscriptionGuard><Tarefas /></SubscriptionGuard></Layout>} />
                <Route path="/estoque" element={<Layout><SubscriptionGuard><Estoque /></SubscriptionGuard></Layout>} />
                
                {/* WhatsApp E-commerce Routes */}
                <Route path="/produtos" element={<Layout><SubscriptionGuard><Produtos /></SubscriptionGuard></Layout>} />
                <Route path="/conversas-whatsapp" element={<Layout><SubscriptionGuard><ConversasWhatsApp /></SubscriptionGuard></Layout>} />
                <Route path="/pedidos-whatsapp" element={<Layout><SubscriptionGuard><PedidosWhatsApp /></SubscriptionGuard></Layout>} />
                <Route path="/treinamento-ia" element={<Layout><SubscriptionGuard><TreinamentoIA /></SubscriptionGuard></Layout>} />
                
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </MaintenanceGuard>
            </PasswordResetGuard>
            <CookieConsent />
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
