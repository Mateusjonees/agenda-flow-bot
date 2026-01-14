import { NavLink, useLocation } from "react-router-dom";
import { Calendar, Users, Settings, LayoutDashboard, DollarSign, BarChart3, FileText, Repeat, ListTodo, Package, MessageCircle, CreditCard, Lock } from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader } from "@/components/ui/sidebar";
import { useUserRole } from "@/hooks/useUserRole";
import { Skeleton } from "@/components/ui/skeleton";
import logo from "@/assets/logo-menu.png";

// Definição dos itens de navegação com suas rotas
const navItems = [
  { path: "/dashboard", label: "Painel", icon: LayoutDashboard },
  { path: "/tarefas", label: "Tarefas", icon: ListTodo },
  { path: "/agendamentos", label: "Agenda", icon: Calendar },
  { path: "/clientes", label: "Clientes", icon: Users },
  { path: "/propostas", label: "Propostas", icon: FileText },
  { path: "/assinaturas", label: "Contratos Recorrentes", icon: Repeat },
  { path: "/estoque", label: "Estoque", icon: Package },
  { path: "/financeiro", label: "Financeiro", icon: DollarSign },
  { path: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { path: "/configuracoes", label: "Configurações", icon: Settings },
  { path: "/planos", label: "Meu Plano", icon: CreditCard },
];

export function AppSidebar() {
  const location = useLocation();
  const { allowedRoutes, isReadOnly, isLoading, role } = useUserRole();

  // Enquanto carrega, mostra skeleton
  if (isLoading) {
    return (
      <Sidebar collapsible="icon" className="border-r transition-all duration-300">
        <SidebarHeader className="border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
          <div className="flex items-center justify-center py-3 px-2">
            <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl p-2 shadow-sm border border-primary/20 backdrop-blur-sm">
              <img src={logo} alt="Foguete Gestão Empresarial" className="h-12 md:h-14 w-auto drop-shadow-sm" />
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent className="pt-4">
          <SidebarGroup>
            <SidebarGroupContent>
              <div className="space-y-2 px-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-md" />
                ))}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    );
  }

  // Fallback: se não tem rotas permitidas, mostrar pelo menos dashboard
  const routes = allowedRoutes.length > 0 ? allowedRoutes : ['/dashboard'];

  // Filtra os itens de navegação baseado nas permissões do usuário
  const filteredNavItems = navItems.filter(item => 
    routes.includes(item.path)
  );

  return (
    <Sidebar collapsible="icon" className="border-r transition-all duration-300">
      <SidebarHeader className="border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
        <div className="flex items-center justify-center py-3 px-2 group-data-[collapsible=icon]:py-2 group-data-[collapsible=icon]:px-0">
          <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl p-2 shadow-sm border border-primary/20 backdrop-blur-sm transition-all duration-300 hover:shadow-md hover:scale-105 group-data-[collapsible=icon]:p-1.5 group-data-[collapsible=icon]:rounded-lg overflow-hidden">
            <img src={logo} alt="Foguete Gestão Empresarial" className="h-12 md:h-14 w-auto drop-shadow-sm group-data-[collapsible=icon]:h-7" />
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="pt-4">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavItems.map(item => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                const isRouteReadOnly = isReadOnly(item.path);
                
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                      <NavLink to={item.path} className="flex items-center gap-2">
                        <Icon className="w-5 h-5" />
                        <span className="flex items-center gap-2">
                          {item.label}
                          {/* Mostra badge de somente leitura quando aplicável */}
                          {isRouteReadOnly && (
                            <Lock className="w-3 h-3 text-muted-foreground" />
                          )}
                        </span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Support */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Suporte">
                  <a 
                    href="https://wa.me/554899075189?text=Olá,%20preciso%20de%20suporte" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-3"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>Suporte WhatsApp</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
