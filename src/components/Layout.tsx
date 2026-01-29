import React from "react";
import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
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

// SVGs inline para evitar lucide-react no bundle inicial
const LogOutIcon = () => (
  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const SettingsIcon = () => (
  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const UserIcon = () => (
  <svg className="h-4 w-4 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

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
                        <UserIcon />
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
                    <SettingsIcon />
                    <span>Configurações</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOutIcon />
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
  const [supabaseClient, setSupabaseClient] = useState<any>(null);

  useEffect(() => {
    const initAuth = async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      setSupabaseClient(supabase);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!session) {
          navigate("/auth");
        } else {
          setUser(session.user);
        }
      });

      return () => subscription.unsubscribe();
    };
    
    initAuth();
  }, [navigate]);

  // Buscar foto de perfil
  const { data: businessSettings } = useQuery({
    queryKey: ["business-settings", user?.id],
    queryFn: async () => {
      if (!user || !supabaseClient) return null;
      const { data } = await supabaseClient
        .from("business_settings")
        .select("profile_image_url")
        .eq("user_id", user.id)
        .single();
      return data;
    },
    enabled: !!user && !!supabaseClient,
  });

  const profileImage = businessSettings?.profile_image_url;

  const handleLogout = async () => {
    // Clear all caches on logout
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear Service Worker caches
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
    
    if (supabaseClient) {
      await supabaseClient.auth.signOut();
    }
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
