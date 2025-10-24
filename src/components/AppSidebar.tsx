import { NavLink, useLocation } from "react-router-dom";
import {
  Calendar,
  Users,
  Settings,
  LayoutDashboard,
  DollarSign,
  BarChart3,
  FileText,
  Repeat,
  ListTodo,
  Package,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const navItems = [
  { path: "/", label: "Painel", icon: LayoutDashboard },
  { path: "/tarefas", label: "Tarefas", icon: ListTodo },
  { path: "/agendamentos", label: "Atendimentos", icon: Calendar },
  { path: "/clientes", label: "Clientes", icon: Users },
  { path: "/propostas", label: "Orçamentos", icon: FileText },
  { path: "/assinaturas", label: "Assinaturas", icon: Repeat },
  { path: "/estoque", label: "Estoque", icon: Package },
  { path: "/financeiro", label: "Financeiro", icon: DollarSign },
  { path: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { path: "/configuracoes", label: "Configurações", icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarContent className="pt-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                      <NavLink to={item.path}>
                        <Icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
