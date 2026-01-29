import React, { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";

const PasswordResetGuard = lazy(() => import("./PasswordResetGuard").then(m => ({ default: m.PasswordResetGuard })));
const SubscriptionGuard = lazy(() => import("./SubscriptionGuard").then(m => ({ default: m.SubscriptionGuard })));
const PermissionGuard = lazy(() => import("./PermissionGuard").then(m => ({ default: m.PermissionGuard })));
const Layout = lazy(() => import("./Layout"));
const MaintenanceGuard = lazy(() => import("./MaintenanceGuard").then(m => ({ default: m.MaintenanceGuard })));

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Agendamentos = lazy(() => import("@/pages/Agendamentos"));
const Clientes = lazy(() => import("@/pages/Clientes"));
const Configuracoes = lazy(() => import("@/pages/Configuracoes"));
const Financeiro = lazy(() => import("@/pages/Financeiro"));
const Relatorios = lazy(() => import("@/pages/Relatorios"));
const Propostas = lazy(() => import("@/pages/Propostas"));
const Assinaturas = lazy(() => import("@/pages/Assinaturas"));
const Tarefas = lazy(() => import("@/pages/Tarefas"));
const Estoque = lazy(() => import("@/pages/Estoque"));
const Servicos = lazy(() => import("@/pages/Servicos"));
const Planos = lazy(() => import("@/pages/Planos"));
const HistoricoPagamentos = lazy(() => import("@/pages/HistoricoPagamentos"));
const Produtos = lazy(() => import("@/pages/Produtos"));
const ConversasWhatsApp = lazy(() => import("@/pages/ConversasWhatsApp"));
const PedidosWhatsApp = lazy(() => import("@/pages/PedidosWhatsApp"));
const TreinamentoIA = lazy(() => import("@/pages/TreinamentoIA"));
const HistoricoAssinaturas = lazy(() => import("@/pages/HistoricoAssinaturas"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <svg className="h-8 w-8 animate-spin text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
  </div>
);

const ProtectedRoute = ({ children, withSubscription = true }: { children: React.ReactNode; withSubscription?: boolean }) => (
  <Suspense fallback={<PageLoader />}>
    <Layout>
      {withSubscription ? (
        <SubscriptionGuard>
          <PermissionGuard>{children}</PermissionGuard>
        </SubscriptionGuard>
      ) : (
        <PermissionGuard>{children}</PermissionGuard>
      )}
    </Layout>
  </Suspense>
);

const PrivateRoutes = () => (
  <TooltipProvider>
    <Suspense fallback={<PageLoader />}>
      <PasswordResetGuard>
        <MaintenanceGuard>
          <Routes>
            <Route path="/configuracoes" element={<ProtectedRoute withSubscription={false}><Configuracoes /></ProtectedRoute>} />
            <Route path="/historico-pagamentos" element={<ProtectedRoute withSubscription={false}><HistoricoPagamentos /></ProtectedRoute>} />
            <Route path="/historico-assinaturas" element={<ProtectedRoute withSubscription={false}><HistoricoAssinaturas /></ProtectedRoute>} />
            
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/agendamentos" element={<ProtectedRoute><Agendamentos /></ProtectedRoute>} />
            <Route path="/clientes" element={<ProtectedRoute><Clientes /></ProtectedRoute>} />
            <Route path="/servicos" element={<ProtectedRoute><Servicos /></ProtectedRoute>} />
            <Route path="/financeiro" element={<ProtectedRoute><Financeiro /></ProtectedRoute>} />
            <Route path="/relatorios" element={<ProtectedRoute><Relatorios /></ProtectedRoute>} />
            <Route path="/propostas" element={<ProtectedRoute><Propostas /></ProtectedRoute>} />
            <Route path="/assinaturas" element={<ProtectedRoute><Assinaturas /></ProtectedRoute>} />
            <Route path="/planos" element={<ProtectedRoute><Planos /></ProtectedRoute>} />
            <Route path="/tarefas" element={<ProtectedRoute><Tarefas /></ProtectedRoute>} />
            <Route path="/estoque" element={<ProtectedRoute><Estoque /></ProtectedRoute>} />
            <Route path="/produtos" element={<ProtectedRoute><Produtos /></ProtectedRoute>} />
            <Route path="/conversas-whatsapp" element={<ProtectedRoute><ConversasWhatsApp /></ProtectedRoute>} />
            <Route path="/pedidos-whatsapp" element={<ProtectedRoute><PedidosWhatsApp /></ProtectedRoute>} />
            <Route path="/treinamento-ia" element={<ProtectedRoute><TreinamentoIA /></ProtectedRoute>} />
            
            <Route path="*" element={<Suspense fallback={<PageLoader />}><NotFound /></Suspense>} />
          </Routes>
        </MaintenanceGuard>
      </PasswordResetGuard>
    </Suspense>
  </TooltipProvider>
);

export default PrivateRoutes;
