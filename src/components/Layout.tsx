import React from "react";
import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, User as UserIcon } from "lucide-react";
import { SubscriptionPopover } from "@/components/SubscriptionPopover";
import { toast } from "sonner";
import { User } from "@supabase/supabase-js";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SearchBar } from "@/components/SearchBar";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { NotificationBell } from "@/components/NotificationBell";
import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import logo from "@/assets/logo.png";

interface LayoutProps {
  children: ReactNode;
}

// Componente interno que usa useSidebar
function LayoutContent({ children, user, profileImage, navigate, handleLogout }: any) {
  const { isMobile, open } = useSidebar();

  return (
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar />
      
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-40 w-full border-b bg-background">
          <div className="flex h-14 sm:h-16 items-center gap-2 sm:gap-4 px-3 sm:px-6">
            <SidebarTrigger className="-ml-1 sm:-ml-2" />
            
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <img src={logo} alt="Foguete Gestão Empresarial" className="h-8 sm:h-10 w-auto" />
            </div>

            <div className="hidden md:flex flex-1 max-w-md mx-4">
              <SearchBar />
            </div>

            <div className="flex items-center gap-1 sm:gap-2 ml-auto">
              <ThemeToggle />
              
              <SubscriptionPopover />

              <NotificationBell />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9 border-2 border-primary/20">
                      <AvatarImage src={profileImage || undefined} alt="Perfil" />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70">
                        <UserIcon className="h-4 w-4 text-primary-foreground" />
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">Minha Conta</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/configuracoes")}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Configurações</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-3 sm:p-4 md:p-6">
            {/* Breadcrumb */}
            <div className="mb-4">
              <PageBreadcrumb />
            </div>
            
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    };
    
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Buscar foto de perfil
  const { data: businessSettings } = useQuery({
    queryKey: ["business-settings", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("business_settings")
        .select("profile_image_url")
        .eq("user_id", user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const profileImage = businessSettings?.profile_image_url;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logout realizado com sucesso!");
    navigate("/auth");
  };

  if (!user) return null;

  return (
    <SidebarProvider defaultOpen={true}>
      <LayoutContent
        user={user}
        profileImage={profileImage}
        navigate={navigate}
        handleLogout={handleLogout}
      >
        {children}
      </LayoutContent>
    </SidebarProvider>
  );
};

export default Layout;
