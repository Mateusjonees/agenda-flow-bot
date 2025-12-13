import { ArrowLeft, Shield, Lock, Eye, FileText, Database, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const PoliticaPrivacidade = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 sticky top-0 z-50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Política de Privacidade</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <p className="text-muted-foreground mb-8">
            Última atualização: 13 de Dezembro de 2025
          </p>

          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <Eye className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-semibold m-0">1. Informações que Coletamos</h2>
            </div>
            <p className="text-muted-foreground">
              A Foguete Gestão Empresarial coleta informações que você nos fornece diretamente, incluindo:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Informações de cadastro (nome, e-mail, telefone, CPF/CNPJ)</li>
              <li>Dados de clientes e agendamentos que você insere na plataforma</li>
              <li>Informações financeiras para processamento de pagamentos</li>
              <li>Dados de uso e interação com a plataforma</li>
              <li>Informações de dispositivos e logs de acesso</li>
            </ul>
          </section>

          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <Database className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-semibold m-0">2. Como Usamos suas Informações</h2>
            </div>
            <p className="text-muted-foreground">
              Utilizamos as informações coletadas para:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Fornecer, manter e melhorar nossos serviços</li>
              <li>Processar transações e enviar notificações relacionadas</li>
              <li>Responder a comentários, perguntas e fornecer suporte</li>
              <li>Enviar informações sobre atualizações e novos recursos</li>
              <li>Monitorar e analisar tendências de uso</li>
              <li>Detectar, prevenir e resolver problemas técnicos</li>
            </ul>
          </section>

          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <Lock className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-semibold m-0">3. Proteção de Dados</h2>
            </div>
            <p className="text-muted-foreground">
              Implementamos medidas de segurança apropriadas para proteger suas informações pessoais:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Criptografia SSL/TLS em todas as transmissões de dados</li>
              <li>Armazenamento seguro em servidores protegidos</li>
              <li>Controle de acesso restrito aos dados</li>
              <li>Monitoramento contínuo de segurança</li>
              <li>Backups regulares e recuperação de desastres</li>
            </ul>
          </section>

          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <UserCheck className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-semibold m-0">4. Seus Direitos (LGPD)</h2>
            </div>
            <p className="text-muted-foreground">
              De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem direito a:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Confirmar a existência de tratamento de dados</li>
              <li>Acessar seus dados pessoais</li>
              <li>Corrigir dados incompletos, inexatos ou desatualizados</li>
              <li>Solicitar a anonimização, bloqueio ou eliminação de dados</li>
              <li>Portabilidade dos dados a outro fornecedor</li>
              <li>Revogar consentimento a qualquer momento</li>
            </ul>
          </section>

          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-semibold m-0">5. Compartilhamento de Dados</h2>
            </div>
            <p className="text-muted-foreground">
              Não vendemos, alugamos ou compartilhamos suas informações pessoais com terceiros, exceto:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Processadores de pagamento (Mercado Pago) para transações</li>
              <li>Serviços de infraestrutura (Supabase) para armazenamento seguro</li>
              <li>Quando exigido por lei ou ordem judicial</li>
              <li>Para proteger nossos direitos legais</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold">6. Cookies e Tecnologias Similares</h2>
            <p className="text-muted-foreground">
              Utilizamos cookies e tecnologias similares para melhorar sua experiência, 
              lembrar suas preferências e analisar o uso da plataforma. Você pode 
              gerenciar suas preferências de cookies nas configurações do navegador.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold">7. Retenção de Dados</h2>
            <p className="text-muted-foreground">
              Mantemos suas informações pelo tempo necessário para fornecer nossos serviços 
              e cumprir obrigações legais. Após o encerramento da conta, seus dados serão 
              mantidos por até 5 anos para fins legais e fiscais, após o que serão excluídos 
              de forma segura.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold">8. Contato</h2>
            <p className="text-muted-foreground">
              Para exercer seus direitos ou esclarecer dúvidas sobre esta política, 
              entre em contato conosco:
            </p>
            <ul className="list-none pl-0 text-muted-foreground space-y-2 mt-4">
              <li><strong>WhatsApp:</strong> (48) 98843-0812</li>
              <li><strong>E-mail:</strong> contato@foguetegestao.com.br</li>
            </ul>
          </section>

          <section className="mt-12 p-6 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground text-center">
              Esta política pode ser atualizada periodicamente. Recomendamos que você 
              revise esta página regularmente para se manter informado sobre como 
              protegemos suas informações.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default PoliticaPrivacidade;
