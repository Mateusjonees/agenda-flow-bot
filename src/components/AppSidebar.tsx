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
  MessageCircle,
  FolderOpen,
  CreditCard,
  MessageSquare,
  ShoppingCart,
  Package2,
  Bot,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import logo from "@/assets/logo-menu.png";

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

const whatsappNavItems = [
  { path: "/conversas-whatsapp", label: "Conversas", icon: MessageSquare },
  { path: "/pedidos-whatsapp", label: "Pedidos WhatsApp", icon: ShoppingCart },
  { path: "/produtos", label: "Produtos", icon: Package2 },
  { path: "/treinamento-ia", label: "Treinamento IA", icon: Bot },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r transition-all duration-300">
      <SidebarHeader className="border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
        <div className="flex items-center justify-center py-3 px-2 group-data-[collapsible=icon]:py-3 group-data-[collapsible=icon]:px-1">
          <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl p-2 shadow-sm border border-primary/20 backdrop-blur-sm transition-all duration-300 hover:shadow-md hover:scale-105 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:rounded-lg">
            <img 
              src={logo} 
              alt="Foguete Gestão Empresarial" 
              className="h-12 md:h-14 w-auto drop-shadow-sm group-data-[collapsible=icon]:h-10" 
            />
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="pt-4">
        {/* Main Navigation */}
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

        {/* WhatsApp E-commerce Section */}
        <SidebarGroup>
          <div className="px-3 py-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              WhatsApp E-commerce
            </h3>
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {whatsappNavItems.map((item) => {
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

        {/* Support */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Suporte">
                  <a 
                    href="https://wa.me/5548990751889?text=Olá,%20preciso%20de%20suporte" 
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
