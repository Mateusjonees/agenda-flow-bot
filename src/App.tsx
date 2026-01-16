import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";

// Cache version - increment to force cache clear on all machines
const CACHE_VERSION = "v2.0.0-clean-2025-01-16";

// Cache clearing component
const CacheBuster = () => {
  useEffect(() => {
    const storedVersion = localStorage.getItem("app_cache_version");
    if (storedVersion !== CACHE_VERSION) {
      console.log("Cache version mismatch, clearing all caches...");
      
      // Preserve cookie consent
      const cookieConsent = localStorage.getItem("cookie_consent");
      
      // Clear localStorage
      localStorage.clear();
      
      // Restore cookie consent if existed
      if (cookieConsent) {
        localStorage.setItem("cookie_consent", cookieConsent);
      }
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      // Clear Service Worker caches
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name));
        });
      }
      
      // Force Service Worker update
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          registrations.forEach(reg => reg.update());
        });
      }
      
      // Save new version
      localStorage.setItem("app_cache_version", CACHE_VERSION);
      
      // Force clean reload
      window.location.reload();
    }
  }, []);
  
  return null;
};
import { ErrorBoundary } from "./components/ErrorBoundary";
import { MaintenanceGuard } from "./components/MaintenanceGuard";
import { SubscriptionGuard } from "./components/SubscriptionGuard";
import { PasswordResetGuard } from "./components/PasswordResetGuard";
import { PermissionGuard } from "./components/PermissionGuard";
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
import Recursos from "./pages/Recursos";
import Depoimentos from "./pages/Depoimentos";
import Precos from "./pages/Precos";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <CacheBuster />
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
                <Route path="/recursos" element={<Recursos />} />
                <Route path="/depoimentos" element={<Depoimentos />} />
                <Route path="/precos" element={<Precos />} />
                
                {/* Página de configurações (fora do guard para permitir renovação) - apenas admin */}
                <Route path="/configuracoes" element={
                  <Layout>
                    <PermissionGuard>
                      <Configuracoes />
                    </PermissionGuard>
                  </Layout>
                } />
                <Route path="/historico-pagamentos" element={
                  <Layout>
                    <PermissionGuard>
                      <HistoricoPagamentos />
                    </PermissionGuard>
                  </Layout>
                } />
                <Route path="/historico-assinaturas" element={
                  <Layout>
                    <PermissionGuard>
                      <HistoricoAssinaturas />
                    </PermissionGuard>
                  </Layout>
                } />
                
                {/* Rotas protegidas (com guard de assinatura e permissão) */}
                <Route path="/dashboard" element={
                  <Layout>
                    <SubscriptionGuard>
                      <PermissionGuard>
                        <Dashboard />
                      </PermissionGuard>
                    </SubscriptionGuard>
                  </Layout>
                } />
                <Route path="/agendamentos" element={
                  <Layout>
                    <SubscriptionGuard>
                      <PermissionGuard>
                        <Agendamentos />
                      </PermissionGuard>
                    </SubscriptionGuard>
                  </Layout>
                } />
                <Route path="/clientes" element={
                  <Layout>
                    <SubscriptionGuard>
                      <PermissionGuard>
                        <Clientes />
                      </PermissionGuard>
                    </SubscriptionGuard>
                  </Layout>
                } />
                <Route path="/servicos" element={
                  <Layout>
                    <SubscriptionGuard>
                      <PermissionGuard>
                        <Servicos />
                      </PermissionGuard>
                    </SubscriptionGuard>
                  </Layout>
                } />
                <Route path="/financeiro" element={
                  <Layout>
                    <SubscriptionGuard>
                      <PermissionGuard>
                        <Financeiro />
                      </PermissionGuard>
                    </SubscriptionGuard>
                  </Layout>
                } />
                <Route path="/relatorios" element={
                  <Layout>
                    <SubscriptionGuard>
                      <PermissionGuard>
                        <Relatorios />
                      </PermissionGuard>
                    </SubscriptionGuard>
                  </Layout>
                } />
                <Route path="/propostas" element={
                  <Layout>
                    <SubscriptionGuard>
                      <PermissionGuard>
                        <Propostas />
                      </PermissionGuard>
                    </SubscriptionGuard>
                  </Layout>
                } />
                <Route path="/assinaturas" element={
                  <Layout>
                    <SubscriptionGuard>
                      <PermissionGuard>
                        <Assinaturas />
                      </PermissionGuard>
                    </SubscriptionGuard>
                  </Layout>
                } />
                <Route path="/planos" element={
                  <Layout>
                    <SubscriptionGuard>
                      <PermissionGuard>
                        <Planos />
                      </PermissionGuard>
                    </SubscriptionGuard>
                  </Layout>
                } />
                <Route path="/tarefas" element={
                  <Layout>
                    <SubscriptionGuard>
                      <PermissionGuard>
                        <Tarefas />
                      </PermissionGuard>
                    </SubscriptionGuard>
                  </Layout>
                } />
                <Route path="/estoque" element={
                  <Layout>
                    <SubscriptionGuard>
                      <PermissionGuard>
                        <Estoque />
                      </PermissionGuard>
                    </SubscriptionGuard>
                  </Layout>
                } />
                
                {/* WhatsApp E-commerce Routes */}
                <Route path="/produtos" element={
                  <Layout>
                    <SubscriptionGuard>
                      <PermissionGuard>
                        <Produtos />
                      </PermissionGuard>
                    </SubscriptionGuard>
                  </Layout>
                } />
                <Route path="/conversas-whatsapp" element={
                  <Layout>
                    <SubscriptionGuard>
                      <PermissionGuard>
                        <ConversasWhatsApp />
                      </PermissionGuard>
                    </SubscriptionGuard>
                  </Layout>
                } />
                <Route path="/pedidos-whatsapp" element={
                  <Layout>
                    <SubscriptionGuard>
                      <PermissionGuard>
                        <PedidosWhatsApp />
                      </PermissionGuard>
                    </SubscriptionGuard>
                  </Layout>
                } />
                <Route path="/treinamento-ia" element={
                  <Layout>
                    <SubscriptionGuard>
                      <PermissionGuard>
                        <TreinamentoIA />
                      </PermissionGuard>
                    </SubscriptionGuard>
                  </Layout>
                } />
                
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
