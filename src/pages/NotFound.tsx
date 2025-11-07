import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.log("Rota inexistente detectada:", location.pathname);
    console.log("Redirecionando para a página principal...");
    
    // Redirecionar automaticamente para a página principal após 1 segundo
    const timer = setTimeout(() => {
      navigate("/", { replace: true });
    }, 1000);

    return () => clearTimeout(timer);
  }, [location.pathname, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6 p-8">
        <div className="flex justify-center mb-6">
          <img 
            src="/logo.png" 
            alt="Logo" 
            className="h-24 w-auto animate-pulse"
          />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">Redirecionando...</h1>
          <p className="text-muted-foreground">Voltando para a página principal</p>
        </div>
        <div className="flex justify-center">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    </div>
  );
};

export default NotFound;
