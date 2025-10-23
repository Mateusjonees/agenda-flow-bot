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
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/tarefas", label: "Tarefas", icon: ListTodo },
  { path: "/agendamentos", label: "Agendamentos", icon: Calendar },
  { path: "/clientes", label: "Clientes", icon: Users },
  { path: "/propostas", label: "Propostas", icon: FileText },
  { path: "/assinaturas", label: "Assinaturas", icon: Repeat },
  { path: "/estoque", label: "Estoque", icon: Package },
  { path: "/financeiro", label: "Financeiro", icon: DollarSign },
  { path: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { path: "/configuracoes", label: "Configurações", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <NavLink to={item.path}>
                        <Icon className="w-4 h-4" />
                        {!collapsed && <span>{item.label}</span>}
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
