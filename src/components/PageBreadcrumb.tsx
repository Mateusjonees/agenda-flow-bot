import { useLocation, Link } from "react-router-dom";
import { Home, Calendar, Users, FileText, Package, DollarSign, BarChart3, Settings, ListTodo, FileCheck, CreditCard } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface RouteConfig {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const routeMap: Record<string, RouteConfig> = {
  "/dashboard": { label: "Dashboard", icon: Home },
  "/agendamentos": { label: "Agendamentos", icon: Calendar },
  "/clientes": { label: "Clientes", icon: Users },
  "/propostas": { label: "Propostas", icon: FileText },
  "/estoque": { label: "Estoque", icon: Package },
  "/servicos": { label: "Serviços", icon: FileCheck },
  "/financeiro": { label: "Financeiro", icon: DollarSign },
  "/tarefas": { label: "Tarefas", icon: ListTodo },
  "/relatorios": { label: "Relatórios", icon: BarChart3 },
  "/configuracoes": { label: "Configurações", icon: Settings },
  "/assinaturas": { label: "Assinaturas", icon: CreditCard },
  "/pricing": { label: "Planos", icon: CreditCard },
};

export function PageBreadcrumb() {
  const location = useLocation();
  const pathname = location.pathname;

  // Não mostrar breadcrumb na home ou páginas de auth
  if (pathname === "/" || pathname === "/auth" || pathname === "/landing") {
    return null;
  }

  const currentRoute = routeMap[pathname];

  // Se não encontrar a rota no mapa, não renderiza
  if (!currentRoute) {
    return null;
  }

  const Icon = currentRoute.icon;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/dashboard" className="flex items-center gap-1.5">
              <Home className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Início</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        {pathname !== "/dashboard" && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="flex items-center gap-1.5 font-medium">
                <Icon className="h-3.5 w-3.5 text-primary" />
                {currentRoute.label}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
