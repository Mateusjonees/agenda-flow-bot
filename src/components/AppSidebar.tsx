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
  Briefcase,
  CreditCard,
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
  useSidebar,
} from "@/components/ui/sidebar";
import logo from "@/assets/logo.png";

const navItems = [
  { path: "/dashboard", label: "Painel", icon: LayoutDashboard },
  { path: "/tarefas", label: "Tarefas", icon: ListTodo },
  { path: "/agendamentos", label: "Agenda", icon: Calendar },
  { path: "/clientes", label: "Clientes", icon: Users },
  { path: "/propostas", label: "Propostas", icon: FileText },
  { path: "/assinaturas", label: "Assinaturas", icon: Repeat },
  { path: "/estoque", label: "Estoque", icon: Package },
  { path: "/financeiro", label: "Financeiro", icon: DollarSign },
  { path: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { path: "/configuracoes", label: "Configurações", icon: Settings },
  { path: "/planos", label: "Minha Assinatura", icon: CreditCard },
];

export function AppSidebar() {
  const location = useLocation();
  const { setOpen, isMobile } = useSidebar();

  const handleNavClick = () => {
    if (isMobile) {
      setOpen(false);
    }
  };

  return (
    <Sidebar 
      collapsible="icon" 
      className="border-r relative z-40 transition-transform duration-300 ease-out bg-background"
    >
      <SidebarHeader className="border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
        <div className="flex items-center justify-center p-3 sm:p-4 group-data-[collapsible=icon]:p-2 transition-all duration-300">
          <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl p-2 sm:p-3 shadow-sm border border-primary/20 backdrop-blur-sm transition-all duration-300 hover:shadow-md hover:scale-105 group-data-[collapsible=icon]:p-2">
            <img 
              src={logo} 
              alt="Foguete Gestão Empresarial" 
              className="h-8 sm:h-10 w-auto drop-shadow-sm group-data-[collapsible=icon]:h-6 transition-all duration-300" 
            />
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="pt-2 sm:pt-4 transition-opacity duration-300 ease-out">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5 sm:space-y-1 px-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive} 
                      tooltip={item.label}
                      className="transition-all duration-200 ease-out min-h-[44px] md:min-h-[40px] rounded-lg hover:bg-accent active:scale-95"
                    >
                      <NavLink to={item.path} onClick={handleNavClick} className="gap-3">
                        <Icon className="w-5 h-5 sm:w-5 sm:h-5 transition-transform duration-200 flex-shrink-0" />
                        <span className="transition-opacity duration-300 text-sm font-medium">{item.label}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
              
              {/* WhatsApp Support */}
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  tooltip="Suporte"
                  className="transition-all duration-200 ease-out min-h-[44px] md:min-h-[40px] rounded-lg hover:bg-accent active:scale-95"
                >
                  <a 
                    href="https://wa.me/5548990751889?text=Olá,%20preciso%20de%20suporte" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-3"
                    onClick={handleNavClick}
                  >
                    <MessageCircle className="w-5 h-5 sm:w-5 sm:h-5 transition-transform duration-200 flex-shrink-0" />
                    <span className="transition-opacity duration-300 text-sm font-medium">Suporte WhatsApp</span>
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
