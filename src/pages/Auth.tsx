import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Rocket, ArrowLeft } from "lucide-react";
import { FaGoogle } from "react-icons/fa";
import logo from "@/assets/logo.png";
import { useFacebookPixel } from "@/hooks/useFacebookPixel";

// Função para validar CPF
const validateCPF = (cpf: string): boolean => {
  const cleanCPF = cpf.replace(/\D/g, '');
  if (cleanCPF.length !== 11) return false;
  if (/^(\d)\1+$/.test(cleanCPF)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = sum * 10 % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(9))) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = sum * 10 % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(10))) return false;
  return true;
};

// Função para formatar CPF
const formatCPF = (value: string): string => {
  const cleanValue = value.replace(/\D/g, '').slice(0, 11);
  if (cleanValue.length <= 3) return cleanValue;
  if (cleanValue.length <= 6) return `${cleanValue.slice(0, 3)}.${cleanValue.slice(3)}`;
  if (cleanValue.length <= 9) return `${cleanValue.slice(0, 3)}.${cleanValue.slice(3, 6)}.${cleanValue.slice(6)}`;
  return `${cleanValue.slice(0, 3)}.${cleanValue.slice(3, 6)}.${cleanValue.slice(6, 9)}-${cleanValue.slice(9)}`;
};
const Auth = () => {
  const {
    trackCompleteRegistration,
    trackLead,
    trackViewContent,
    trackStartTrial,
    trackLogin
  } = useFacebookPixel();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [cpfError, setCpfError] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  // Check for mode=signup in URL
  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'signup') {
      setIsSignUp(true);
    }
  }, [searchParams]);
  useEffect(() => {
    // Track page view for auth page
    trackViewContent({
      content_name: 'Auth Page',
      content_category: 'authentication'
    });

    // Check if user is already logged in
    const checkSession = async () => {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    checkSession();

    // Listen for auth changes
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/dashboard");
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate, trackViewContent]);
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Preencha todos os campos");
      return;
    }
    setLoading(true);
    const {
      error
    } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      // Track login com email
      trackLogin('email');
      toast.success("Login realizado com sucesso!");
    }
  };
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setCpf(formatted);
    setCpfError("");
  };
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name || !cpf) {
      toast.error("Preencha todos os campos");
      return;
    }
    if (password.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres");
      return;
    }
    if (!validateCPF(cpf)) {
      setCpfError("CPF inválido");
      toast.error("CPF inválido. Verifique o número digitado.");
      return;
    }
    setLoading(true);
    const {
      data,
      error
    } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          name,
          cpf: cpf.replace(/\D/g, '')
        }
      }
    });
    if (!error && data.user) {
      // Save CPF to profile
      await supabase.from("profiles").upsert({
        id: data.user.id,
        full_name: name,
        cpf: cpf.replace(/\D/g, '')
      });
    }
    setLoading(false);
    if (error) {
      if (error.message.includes("already registered")) {
        toast.error("Este e-mail já está cadastrado");
      } else {
        toast.error(error.message);
      }
    } else {
      // Track successful registration + trial start
      trackCompleteRegistration('email');
      trackStartTrial({
        value: 0
      });
      trackLead({
        content_name: 'signup',
        content_category: 'registration'
      });
      toast.success("Conta criada! Verifique seu e-mail para confirmar.");
    }
  };
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Preencha o e-mail");
      return;
    }
    setLoading(true);
    const {
      error
    } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/dashboard`
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("E-mail de recuperação enviado! Verifique sua caixa de entrada.");
      setIsForgotPassword(false);
      setEmail("");
    }
  };
  const handleGoogleLogin = async () => {
    // Track lead ao iniciar OAuth
    trackLead({ content_name: 'google_oauth', content_category: 'authentication' });
    
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    });
    setLoading(false);
    if (error) {
      toast.error(`Erro ao entrar com Google: ${error.message}`);
    }
  };
  return <div className="min-h-screen bg-gradient-to-br from-muted/30 via-muted/20 to-background relative overflow-hidden">
      {/* Decorative rockets */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <Rocket className="absolute top-20 right-[15%] w-32 h-32 text-muted/20 rotate-45" />
        <Rocket className="absolute bottom-32 left-[10%] w-24 h-24 text-muted/15 -rotate-12" />
        <Rocket className="absolute top-1/2 right-[5%] w-20 h-20 text-muted/10 rotate-90" />
      </div>

      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative z-10">
        {/* Back button */}
        <div className="w-full max-w-md mb-4">
          <Button variant="ghost" size="sm" className="gap-2" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4" />
            Voltar para o site
          </Button>
        </div>

        {/* Logo and branding */}
        <div className={`text-center ${isSignUp ? 'mb-4' : 'mb-8'}`}>
          <img src={logo} alt="Foguete Gestão Empresarial" className={`${isSignUp ? 'h-16 md:h-20' : 'h-24 md:h-28'} w-auto mx-auto`} />
        </div>

        {/* Auth card */}
        <Card className="w-full max-w-md bg-card border shadow-xl">
          <CardContent className={`${isSignUp ? 'pt-5 pb-5 px-6' : 'pt-8 pb-8 px-8'}`}>
            {isForgotPassword ? <form onSubmit={handleForgotPassword} className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-foreground">Recuperar Senha</h2>
                  <p className="text-sm text-muted-foreground mt-2">
                    Digite seu e-mail para receber um link de recuperação
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="forgot-email" className="text-foreground font-medium">
                    Email
                  </Label>
                  <Input id="forgot-email" type="email" placeholder="seu.email@empresa.com" value={email} onChange={e => setEmail(e.target.value)} disabled={loading} required className="h-12" />
                </div>
                <Button type="submit" className="w-full h-12 text-base font-semibold shadow-lg" disabled={loading}>
                  {loading ? <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Enviando...
                    </> : "Enviar Link de Recuperação"}
                </Button>

                <div className="text-center text-sm pt-2">
                  <button type="button" className="text-muted-foreground hover:text-foreground underline" onClick={() => {
                setIsForgotPassword(false);
                setEmail("");
              }}>
                    Voltar ao login
                  </button>
                </div>
              </form> : !isSignUp ? <form onSubmit={handleSignIn} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground font-medium">
                    Email
                  </Label>
                  <Input id="email" type="email" placeholder="seu.email@empresa.com" value={email} onChange={e => setEmail(e.target.value)} disabled={loading} required className="h-12" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground font-medium">
                    Senha
                  </Label>
                  <Input id="password" type="password" placeholder="•••••••" value={password} onChange={e => setPassword(e.target.value)} disabled={loading} required className="h-12" />
                </div>
                <Button type="submit" className="w-full h-12 text-base font-semibold shadow-lg" disabled={loading}>
                  {loading ? <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Entrando...
                    </> : "Entrar"}
                </Button>

                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-muted"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Ou continuar com</span>
                  </div>
                </div>

                <div className="flex justify-center">
                  <Button type="button" variant="outline" onClick={handleGoogleLogin} disabled={loading} className="flex items-center justify-center gap-3 h-12 w-full max-w-xs hover:bg-accent hover:scale-105 transition-all duration-200 shadow-sm hover:shadow-md border-2">
                    <FaGoogle className="h-5 w-5 text-[#DB4437]" />
                    <span className="text-sm font-medium">Continuar com Google</span>
                  </Button>
                </div>

                <div className="flex items-center justify-between text-sm pt-2">
                  <button type="button" className="text-muted-foreground hover:text-foreground underline" onClick={() => {
                setIsForgotPassword(true);
                setEmail("");
                setPassword("");
              }}>
                    Esqueceu a senha?
                  </button>
                  <button type="button" className="text-muted-foreground hover:text-foreground underline" onClick={() => setIsSignUp(true)}>
                    Criar conta
                  </button>
                </div>
              </form> : <form onSubmit={handleSignUp} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="signup-name" className="text-foreground font-medium text-sm">
                    Nome
                  </Label>
                  <Input id="signup-name" type="text" placeholder="Seu nome completo" value={name} onChange={e => setName(e.target.value)} disabled={loading} required className="h-10" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="signup-cpf" className="text-foreground font-medium text-sm">
                    CPF
                  </Label>
                  <Input id="signup-cpf" type="text" placeholder="000.000.000-00" value={cpf} onChange={handleCpfChange} disabled={loading} required className={`h-10 ${cpfError ? 'border-destructive' : ''}`} />
                  {cpfError && <p className="text-xs text-destructive">{cpfError}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="signup-email" className="text-foreground font-medium text-sm">
                    Email
                  </Label>
                  <Input id="signup-email" type="email" placeholder="seu.email@empresa.com" value={email} onChange={e => setEmail(e.target.value)} disabled={loading} required className="h-10" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="signup-password" className="text-foreground font-medium text-sm">
                    Crie Sua Senha
                  </Label>
                  <Input id="signup-password" type="password" placeholder="Mínimo 6 caracteres" value={password} onChange={e => setPassword(e.target.value)} disabled={loading} required minLength={6} className="h-10" />
                </div>
                <Button type="submit" className="w-full h-10 text-sm font-semibold shadow-lg" disabled={loading}>
                  {loading ? <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Criando conta...
                    </> : "Criar Conta"}
                </Button>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-muted"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Ou continuar com</span>
                  </div>
                </div>

                <div className="flex justify-center">
                  <Button type="button" variant="outline" onClick={handleGoogleLogin} disabled={loading} className="flex items-center justify-center gap-3 h-10 w-full max-w-xs hover:bg-accent hover:scale-105 transition-all duration-200 shadow-sm hover:shadow-md border-2">
                    <FaGoogle className="h-4 w-4 text-[#DB4437]" />
                    <span className="text-xs font-medium">Continuar com Google</span>
                  </Button>
                </div>

                <div className="text-center text-xs pt-1">
                  <button type="button" className="text-muted-foreground hover:text-foreground underline" onClick={() => setIsSignUp(false)}>
                    Já tem uma conta? Entrar
                  </button>
                </div>
              </form>}
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default Auth;