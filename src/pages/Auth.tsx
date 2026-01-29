import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { FaGoogle } from "react-icons/fa";
import logo from "@/assets/logo.png";

const LoaderIcon = () => (
  <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

const RocketIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
  </svg>
);

const ArrowLeftIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m12 19-7-7 7-7"/>
    <path d="M19 12H5"/>
  </svg>
);

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

const formatCPF = (value: string): string => {
  const cleanValue = value.replace(/\D/g, '').slice(0, 11);
  if (cleanValue.length <= 3) return cleanValue;
  if (cleanValue.length <= 6) return `${cleanValue.slice(0, 3)}.${cleanValue.slice(3)}`;
  if (cleanValue.length <= 9) return `${cleanValue.slice(0, 3)}.${cleanValue.slice(3, 6)}.${cleanValue.slice(6)}`;
  return `${cleanValue.slice(0, 3)}.${cleanValue.slice(3, 6)}.${cleanValue.slice(6, 9)}-${cleanValue.slice(9)}`;
};

const Auth = () => {
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
  const [supabaseClient, setSupabaseClient] = useState<any>(null);
  const [pixelFns, setPixelFns] = useState<any>(null);

  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'signup') {
      setIsSignUp(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      setSupabaseClient(supabase);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
        return;
      }
      
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
        if (session) navigate("/dashboard");
      });
      
      return () => subscription.unsubscribe();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [navigate]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const { useFacebookPixel } = await import("@/hooks/useFacebookPixel");
      setPixelFns(useFacebookPixel);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleSignIn = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseClient) {
      toast.error("Aguarde o carregamento...");
      return;
    }
    if (!email || !password) {
      toast.error("Preencha todos os campos");
      return;
    }
    setLoading(true);
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      if (pixelFns) pixelFns().trackLogin?.('email');
      toast.success("Login realizado com sucesso!");
    }
  }, [supabaseClient, email, password, pixelFns]);

  const handleCpfChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setCpf(formatted);
    setCpfError("");
  }, []);

  const handleSignUp = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseClient) {
      toast.error("Aguarde o carregamento...");
      return;
    }
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
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { name, cpf: cpf.replace(/\D/g, '') }
      }
    });
    if (!error && data.user) {
      await supabaseClient.from("profiles").upsert({
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
      if (pixelFns) {
        const fns = pixelFns();
        fns.trackCompleteRegistration?.('email');
        fns.trackStartTrial?.({ value: 0 });
        fns.trackLead?.({ content_name: 'signup', content_category: 'registration' });
      }
      toast.success("Conta criada! Verifique seu e-mail para confirmar.");
    }
  }, [supabaseClient, email, password, name, cpf, pixelFns]);

  const handleForgotPassword = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseClient) {
      toast.error("Aguarde o carregamento...");
      return;
    }
    if (!email) {
      toast.error("Preencha o e-mail");
      return;
    }
    setLoading(true);
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
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
  }, [supabaseClient, email]);

  const handleGoogleLogin = useCallback(async () => {
    if (!supabaseClient) {
      toast.error("Aguarde o carregamento...");
      return;
    }
    if (pixelFns) {
      pixelFns().trackLead?.({ content_name: 'google_oauth', content_category: 'authentication' });
    }
    setLoading(true);
    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` }
    });
    setLoading(false);
    if (error) {
      toast.error(`Erro ao entrar com Google: ${error.message}`);
    }
  }, [supabaseClient, pixelFns]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/30 via-muted/20 to-background relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <RocketIcon className="absolute top-20 right-[15%] w-32 h-32 text-muted/20 rotate-45" />
        <RocketIcon className="absolute bottom-32 left-[10%] w-24 h-24 text-muted/15 -rotate-12" />
        <RocketIcon className="absolute top-1/2 right-[5%] w-20 h-20 text-muted/10 rotate-90" />
      </div>

      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md mb-4">
          <Button variant="ghost" size="sm" className="gap-2" onClick={() => navigate("/")}>
            <ArrowLeftIcon />
            Voltar para o site
          </Button>
        </div>

        <div className={`text-center ${isSignUp ? 'mb-4' : 'mb-8'}`}>
          <img src={logo} alt="Foguete Gestão Empresarial" className={`${isSignUp ? 'h-16 md:h-20' : 'h-24 md:h-28'} w-auto mx-auto`} />
        </div>

        <Card className="w-full max-w-md bg-card border shadow-xl">
          <CardContent className={`${isSignUp ? 'pt-5 pb-5 px-6' : 'pt-8 pb-8 px-8'}`}>
            {isForgotPassword ? (
              <form onSubmit={handleForgotPassword} className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-foreground">Recuperar Senha</h2>
                  <p className="text-sm text-muted-foreground mt-2">
                    Digite seu e-mail para receber um link de recuperação
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="forgot-email" className="text-foreground font-medium">Email</Label>
                  <Input id="forgot-email" type="email" placeholder="seu.email@empresa.com" value={email} onChange={e => setEmail(e.target.value)} disabled={loading} required className="h-12" />
                </div>
                <Button type="submit" className="w-full h-12 text-base font-semibold shadow-lg" disabled={loading || !supabaseClient}>
                  {loading ? <><LoaderIcon /> <span className="ml-2">Enviando...</span></> : "Enviar Link de Recuperação"}
                </Button>
                <div className="text-center text-sm pt-2">
                  <button type="button" className="text-muted-foreground hover:text-foreground underline" onClick={() => { setIsForgotPassword(false); setEmail(""); }}>
                    Voltar ao login
                  </button>
                </div>
              </form>
            ) : !isSignUp ? (
              <form onSubmit={handleSignIn} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground font-medium">Email</Label>
                  <Input id="email" type="email" placeholder="seu.email@empresa.com" value={email} onChange={e => setEmail(e.target.value)} disabled={loading} required className="h-12" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground font-medium">Senha</Label>
                  <Input id="password" type="password" placeholder="•••••••" value={password} onChange={e => setPassword(e.target.value)} disabled={loading} required className="h-12" />
                </div>
                <Button type="submit" className="w-full h-12 text-base font-semibold shadow-lg" disabled={loading || !supabaseClient}>
                  {loading ? <><LoaderIcon /> <span className="ml-2">Entrando...</span></> : "Entrar"}
                </Button>
                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-muted"></div></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Ou continuar com</span></div>
                </div>
                <div className="flex justify-center">
                  <Button type="button" variant="outline" onClick={handleGoogleLogin} disabled={loading || !supabaseClient} className="flex items-center justify-center gap-3 h-12 w-full max-w-xs hover:bg-accent hover:scale-105 transition-all duration-200 shadow-sm hover:shadow-md border-2">
                    <FaGoogle className="h-5 w-5 text-[#DB4437]" />
                    <span className="text-sm font-medium">Continuar com Google</span>
                  </Button>
                </div>
                <div className="flex items-center justify-between text-sm pt-2">
                  <button type="button" className="text-muted-foreground hover:text-foreground underline" onClick={() => { setIsForgotPassword(true); setEmail(""); setPassword(""); }}>Esqueceu a senha?</button>
                  <button type="button" className="text-muted-foreground hover:text-foreground underline" onClick={() => setIsSignUp(true)}>Criar conta</button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSignUp} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="signup-name" className="text-foreground font-medium text-sm">Nome</Label>
                  <Input id="signup-name" type="text" placeholder="Seu nome completo" value={name} onChange={e => setName(e.target.value)} disabled={loading} required className="h-10" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="signup-cpf" className="text-foreground font-medium text-sm">CPF</Label>
                  <Input id="signup-cpf" type="text" placeholder="000.000.000-00" value={cpf} onChange={handleCpfChange} disabled={loading} required className={`h-10 ${cpfError ? 'border-destructive' : ''}`} />
                  {cpfError && <p className="text-xs text-destructive">{cpfError}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="signup-email" className="text-foreground font-medium text-sm">Email</Label>
                  <Input id="signup-email" type="email" placeholder="seu.email@empresa.com" value={email} onChange={e => setEmail(e.target.value)} disabled={loading} required className="h-10" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="signup-password" className="text-foreground font-medium text-sm">Crie Sua Senha</Label>
                  <Input id="signup-password" type="password" placeholder="Mínimo 6 caracteres" value={password} onChange={e => setPassword(e.target.value)} disabled={loading} required minLength={6} className="h-10" />
                </div>
                <Button type="submit" className="w-full h-10 text-sm font-semibold shadow-lg" disabled={loading || !supabaseClient}>
                  {loading ? <><LoaderIcon /> <span className="ml-2">Criando conta...</span></> : "Criar Conta"}
                </Button>
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-muted"></div></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Ou continuar com</span></div>
                </div>
                <div className="flex justify-center">
                  <Button type="button" variant="outline" onClick={handleGoogleLogin} disabled={loading || !supabaseClient} className="flex items-center justify-center gap-3 h-10 w-full max-w-xs hover:bg-accent hover:scale-105 transition-all duration-200 shadow-sm hover:shadow-md border-2">
                    <FaGoogle className="h-4 w-4 text-[#DB4437]" />
                    <span className="text-xs font-medium">Continuar com Google</span>
                  </Button>
                </div>
                <div className="text-center text-xs pt-1">
                  <button type="button" className="text-muted-foreground hover:text-foreground underline" onClick={() => setIsSignUp(false)}>Já tem uma conta? Entrar</button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;