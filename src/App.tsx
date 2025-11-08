import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { MaintenanceGuard } from "./components/MaintenanceGuard";
import { OnboardingTutorial } from "./components/OnboardingTutorial";
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

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <OnboardingTutorial />
          <BrowserRouter>
            <MaintenanceGuard>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
                <Route path="/manutencao" element={<Maintenance />} />
                <Route path="/agendamentos" element={<Layout><Agendamentos /></Layout>} />
                <Route path="/clientes" element={<Layout><Clientes /></Layout>} />
                <Route path="/servicos" element={<Layout><Servicos /></Layout>} />
                <Route path="/financeiro" element={<Layout><Financeiro /></Layout>} />
                <Route path="/relatorios" element={<Layout><Relatorios /></Layout>} />
                <Route path="/propostas" element={<Layout><Propostas /></Layout>} />
                <Route path="/assinaturas" element={<Layout><Assinaturas /></Layout>} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/planos" element={<Layout><Planos /></Layout>} />
                <Route path="/tarefas" element={<Layout><Tarefas /></Layout>} />
                <Route path="/estoque" element={<Layout><Estoque /></Layout>} />
                <Route path="/configuracoes" element={<Layout><Configuracoes /></Layout>} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </MaintenanceGuard>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
