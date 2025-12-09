import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, TestTube, CheckCircle2, XCircle, MessageCircle, Smartphone, Key, Brain } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useReadOnly } from "@/components/SubscriptionGuard";

interface WhatsAppConfig {
  whatsapp_phone_number_id: string;
  whatsapp_access_token: string;
  whatsapp_webhook_secret: string;
  whatsapp_verify_token: string;
  openai_api_key: string;
  default_message: string;
}

const ConfiguracoesWhatsApp = () => {
  const { toast } = useToast();
  const { isReadOnly } = useReadOnly();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  
  const [config, setConfig] = useState<WhatsAppConfig>({
    whatsapp_phone_number_id: "",
    whatsapp_access_token: "",
    whatsapp_webhook_secret: "WPgIeb1nuS0i6VLRsc4Qwd8jlm9ZMatfBX5hUJTK7CYrFqDvo3NxyEG2zHAkOp",
    whatsapp_verify_token: "f2Qrzm6EnGSRCbx0uKL8UiptV79P3YMA",
    openai_api_key: "",
    default_message: "Olá! 👋 Sou o assistente virtual. Como posso ajudar você hoje?",
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar configurações em business_settings
      const { data: settings } = await supabase
        .from("business_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (settings) {
        // Buscar secrets do Supabase Edge Functions
        // Nota: secrets não podem ser lidos, apenas escritos
        // Então vamos armazenar em business_settings (criptografado)
        const whatsappConfig = (settings as any).whatsapp_config as any;
        
        if (whatsappConfig) {
          setConfig({
            whatsapp_phone_number_id: whatsappConfig.whatsapp_phone_number_id || "",
            whatsapp_access_token: whatsappConfig.whatsapp_access_token || "",
            whatsapp_webhook_secret: whatsappConfig.whatsapp_webhook_secret || "WPgIeb1nuS0i6VLRsc4Qwd8jlm9ZMatfBX5hUJTK7CYrFqDvo3NxyEG2zHAkOp",
            whatsapp_verify_token: whatsappConfig.whatsapp_verify_token || "f2Qrzm6EnGSRCbx0uKL8UiptV79P3YMA",
            openai_api_key: whatsappConfig.openai_api_key || "",
            default_message: whatsappConfig.default_message || "Olá! 👋 Sou o assistente virtual. Como posso ajudar você hoje?",
          });
        }
      }
    } catch (error: any) {
      console.error("Error fetching config:", error);
      toast({
        title: "Erro ao carregar configurações",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (isReadOnly) {
      toast({
        title: "Ação bloqueada",
        description: "Seu plano atual não permite editar configurações.",
        variant: "destructive",
      });
      return;
    }

    if (!config.whatsapp_phone_number_id || !config.whatsapp_access_token || !config.openai_api_key) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha Phone Number ID, Access Token e OpenAI API Key.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Atualizar business_settings com whatsapp_config
      const { error } = await supabase
        .from("business_settings")
        .update({
          whatsapp_config: JSON.parse(JSON.stringify(config)),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "✅ Configurações salvas!",
        description: "As configurações do WhatsApp foram atualizadas com sucesso.",
      });

      setTestResult(null); // Resetar resultado de teste
    } catch (error: any) {
      console.error("Error saving config:", error);
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!config.whatsapp_phone_number_id || !config.whatsapp_access_token) {
      toast({
        title: "Configuração incompleta",
        description: "Configure Phone Number ID e Access Token antes de testar.",
        variant: "destructive",
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      // Testar conexão com WhatsApp Cloud API
      const response = await fetch(
        `https://graph.facebook.com/v21.0/${config.whatsapp_phone_number_id}`,
        {
          headers: {
            Authorization: `Bearer ${config.whatsapp_access_token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setTestResult({
          success: true,
          message: `✅ Conexão bem-sucedida! Número verificado: ${data.display_phone_number || "N/A"}`,
        });
      } else {
        const errorData = await response.json();
        setTestResult({
          success: false,
          message: `❌ Erro na conexão: ${errorData.error?.message || "Credenciais inválidas"}`,
        });
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        message: `❌ Erro de rede: ${error.message}`,
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Configurações WhatsApp</h1>
        <p className="text-muted-foreground">
          Configure a integração com WhatsApp Cloud API e OpenAI para ativar o vendedor 24/7.
        </p>
      </div>

      {/* Meta WhatsApp Business */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            WhatsApp Cloud API
          </CardTitle>
          <CardDescription>
            Obtenha essas credenciais em{" "}
            <a
              href="https://business.facebook.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              Meta Business Manager → WhatsApp → Configurações → API
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone_number_id">
              Phone Number ID <Badge variant="destructive">Obrigatório</Badge>
            </Label>
            <Input
              id="phone_number_id"
              placeholder="123456789012345"
              value={config.whatsapp_phone_number_id}
              onChange={(e) =>
                setConfig({ ...config, whatsapp_phone_number_id: e.target.value })
              }
              disabled={isReadOnly}
            />
            <p className="text-sm text-muted-foreground">
              ID do número de telefone do WhatsApp Business
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="access_token">
              Access Token <Badge variant="destructive">Obrigatório</Badge>
            </Label>
            <Input
              id="access_token"
              type="password"
              placeholder="EAAxxxxxxxxxxxxxxxxxxxx"
              value={config.whatsapp_access_token}
              onChange={(e) =>
                setConfig({ ...config, whatsapp_access_token: e.target.value })
              }
              disabled={isReadOnly}
            />
            <p className="text-sm text-muted-foreground">
              Token de acesso permanente (System User Token)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="webhook_secret">Webhook Secret (Pré-configurado)</Label>
            <Input
              id="webhook_secret"
              value={config.whatsapp_webhook_secret}
              disabled
              className="bg-muted"
            />
            <p className="text-sm text-muted-foreground">
              Use este valor ao configurar o webhook no Meta Business Manager
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="verify_token">Verify Token (Pré-configurado)</Label>
            <Input
              id="verify_token"
              value={config.whatsapp_verify_token}
              disabled
              className="bg-muted"
            />
            <p className="text-sm text-muted-foreground">
              Token de verificação para webhook
            </p>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleTestConnection} disabled={testing || isReadOnly} variant="outline">
              {testing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testando...
                </>
              ) : (
                <>
                  <TestTube className="mr-2 h-4 w-4" />
                  Testar Conexão
                </>
              )}
            </Button>
          </div>

          {testResult && (
            <Alert variant={testResult.success ? "default" : "destructive"}>
              {testResult.success ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <AlertDescription>{testResult.message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* OpenAI Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            OpenAI API
          </CardTitle>
          <CardDescription>
            Configure a chave da API OpenAI para inteligência artificial.{" "}
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              Obter chave
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="openai_key">
              API Key <Badge variant="destructive">Obrigatório</Badge>
            </Label>
            <Input
              id="openai_key"
              type="password"
              placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
              value={config.openai_api_key}
              onChange={(e) =>
                setConfig({ ...config, openai_api_key: e.target.value })
              }
              disabled={isReadOnly}
            />
            <p className="text-sm text-muted-foreground">
              Chave de API da OpenAI (usará GPT-4o-mini)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Default Message */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Mensagem Padrão
          </CardTitle>
          <CardDescription>
            Mensagem inicial que o bot enviará ao receber primeiro contato.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="default_message">Mensagem de Boas-vindas</Label>
            <Textarea
              id="default_message"
              rows={4}
              placeholder="Olá! 👋 Como posso ajudar você hoje?"
              value={config.default_message}
              onChange={(e) =>
                setConfig({ ...config, default_message: e.target.value })
              }
              disabled={isReadOnly}
            />
          </div>
        </CardContent>
      </Card>

      {/* Webhook URL Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Configuração do Webhook
          </CardTitle>
          <CardDescription>
            Configure estes valores no Meta Business Manager → WhatsApp → Webhooks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Callback URL</Label>
            <Input
              value="https://pnwelorcrncqltqiyxwx.supabase.co/functions/v1/whatsapp-webhook"
              disabled
              className="bg-muted font-mono text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label>Verify Token</Label>
            <Input
              value={config.whatsapp_verify_token}
              disabled
              className="bg-muted font-mono text-sm"
            />
          </div>
          <Alert>
            <AlertDescription>
              📌 <strong>Importante:</strong> Após salvar as configurações, configure o webhook no Meta
              Business Manager usando a URL e o Verify Token acima. Subscribe aos eventos:{" "}
              <code className="bg-muted px-1 py-0.5 rounded">messages</code> e{" "}
              <code className="bg-muted px-1 py-0.5 rounded">message_status</code>.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving || isReadOnly} size="lg">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Salvar Configurações
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ConfiguracoesWhatsApp;
