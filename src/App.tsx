import React, { Suspense, lazy, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

const CACHE_VERSION = "v2.3.0-zero-blocking";

// Lazy load de componentes não-críticos para o primeiro render
const Toaster = lazy(() => import("@/components/ui/toaster").then(m => ({ default: m.Toaster })));
const Sonner = lazy(() => import("@/components/ui/sonner").then(m => ({ default: m.Toaster })));
const TooltipProvider = lazy(() => import("@/components/ui/tooltip").then(m => ({ default: m.TooltipProvider })));
const PasswordResetGuard = lazy(() => import("./components/PasswordResetGuard").then(m => ({ default: m.PasswordResetGuard })));
const CookieConsent = lazy(() => import("./components/CookieConsent").then(m => ({ default: m.CookieConsent })));
const PWAUpdatePrompt = lazy(() => import("./components/PWAUpdatePrompt").then(m => ({ default: m.PWAUpdatePrompt })));
const AuthTracker = lazy(() => import("./components/AuthTracker").then(m => ({ default: m.AuthTracker })));

// Componentes leves podem ficar estáticos
import { ErrorBoundary } from "./components/ErrorBoundary";
import { MaintenanceGuard } from "./components/MaintenanceGuard";
import { SubscriptionGuard } from "./components/SubscriptionGuard";
import { PermissionGuard } from "./components/PermissionGuard";
import Layout from "./components/Layout";

// Pages lazy
const Index = lazy(() => import("./pages/Index"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Auth = lazy(() => import("./pages/Auth"));
const Agendamentos = lazy(() => import("./pages/Agendamentos"));
const Clientes = lazy(() => import("./pages/Clientes"));
const Configuracoes = lazy(() => import("./pages/Configuracoes"));
const Financeiro = lazy(() => import("./pages/Financeiro"));
const Relatorios = lazy(() => import("./pages/Relatorios"));
const Propostas = lazy(() => import("./pages/Propostas"));
const Assinaturas = lazy(() => import("./pages/Assinaturas"));
const Tarefas = lazy(() => import("./pages/Tarefas"));
const Estoque = lazy(() => import("./pages/Estoque"));
const Servicos = lazy(() => import("./pages/Servicos"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Planos = lazy(() => import("./pages/Planos"));
const Maintenance = lazy(() => import("./pages/Maintenance"));
const NotFound = lazy(() => import("./pages/NotFound"));
const HistoricoPagamentos = lazy(() => import("./pages/HistoricoPagamentos"));
const Produtos = lazy(() => import("./pages/Produtos"));
const ConversasWhatsApp = lazy(() => import("./pages/ConversasWhatsApp"));
const PedidosWhatsApp = lazy(() => import("./pages/PedidosWhatsApp"));
const TreinamentoIA = lazy(() => import("./pages/TreinamentoIA"));
const PoliticaPrivacidade = lazy(() => import("./pages/PoliticaPrivacidade"));
const TermosServico = lazy(() => import("./pages/TermosServico"));
const HistoricoAssinaturas = lazy(() => import("./pages/HistoricoAssinaturas"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Recursos = lazy(() => import("./pages/Recursos"));
const Depoimentos = lazy(() => import("./pages/Depoimentos"));
const Precos = lazy(() => import("./pages/Precos"));

const CacheBuster = () => {
  useEffect(() => {
    const storedVersion = localStorage.getItem("app_cache_version");
    if (storedVersion !== CACHE_VERSION) {
      console.log("Cache version mismatch, clearing all caches...");
      
      const cookieConsent = localStorage.getItem("cookie_consent");
      localStorage.clear();
      if (cookieConsent) {
        localStorage.setItem("cookie_consent", cookieConsent);
      }
      
      sessionStorage.clear();
      
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name));
        });
      }
      
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          registrations.forEach(reg => reg.update());
        });
      }
      
      localStorage.setItem("app_cache_version", CACHE_VERSION);
      window.location.reload();
    }
  }, []);
  
  return null;
};

const LoaderIcon = () => (
  <svg className="h-8 w-8 animate-spin text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4">
      <LoaderIcon />
      <p className="text-sm text-muted-foreground">Carregando...</p>
    </div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <CacheBuster />
      {/* Componentes lazy com Suspense - não bloqueiam o render */}
      <Suspense fallback={null}>
        <TooltipProvider>
          <Suspense fallback={null}>
            <AuthTracker />
            <Toaster />
            <Sonner />
            <PWAUpdatePrompt />
          </Suspense>
          <BrowserRouter>
            <Suspense fallback={null}>
              <PasswordResetGuard>
                <MaintenanceGuard>
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
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
                      
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </MaintenanceGuard>
              </PasswordResetGuard>
            </Suspense>
            <Suspense fallback={null}>
              <CookieConsent />
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </Suspense>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
