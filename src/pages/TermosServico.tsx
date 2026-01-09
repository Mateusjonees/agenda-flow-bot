import { ArrowLeft, FileText, AlertTriangle, CreditCard, Ban, Scale, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const TermosServico = () => {
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
            <FileText className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Termos de Serviço</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <p className="text-muted-foreground mb-8">
            Última atualização: 13 de Dezembro de 2025
          </p>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold">1. Aceitação dos Termos</h2>
            <p className="text-muted-foreground">
              Ao acessar e utilizar o Foguete Gestão Empresarial ("Plataforma"), você concorda 
              em cumprir e estar vinculado a estes Termos de Serviço. Se você não concordar 
              com qualquer parte destes termos, não poderá acessar ou usar nossos serviços.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold">2. Descrição do Serviço</h2>
            <p className="text-muted-foreground">
              O Foguete é uma plataforma de gestão empresarial que oferece:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Gerenciamento de agendamentos e agenda</li>
              <li>Cadastro e gestão de clientes (CRM)</li>
              <li>Controle financeiro (receitas e despesas)</li>
              <li>Gestão de estoque e produtos</li>
              <li>Emissão de propostas e orçamentos</li>
              <li>Assinaturas recorrentes de clientes</li>
              <li>Relatórios e análises</li>
              <li>Integrações com WhatsApp e pagamentos PIX</li>
            </ul>
          </section>

          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <CreditCard className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-semibold m-0">3. Planos e Pagamentos</h2>
            </div>
            <p className="text-muted-foreground">
              A Plataforma oferece diferentes planos de assinatura:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Trial Gratuito:</strong> 7 dias de acesso completo para novos usuários</li>
              <li><strong>Plano Mensal:</strong> R$ 49,00/mês</li>
              <li><strong>Plano Semestral:</strong> R$ 259,00 (economia de 12%)</li>
              <li><strong>Plano Anual:</strong> R$ 475,00 (economia de 19%)</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              Os pagamentos são processados via Mercado Pago (PIX ou cartão de crédito). 
              A renovação das assinaturas é automática, podendo ser cancelada a qualquer momento.
            </p>
          </section>

          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <RefreshCw className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-semibold m-0">4. Cancelamento e Reembolso</h2>
            </div>
            <p className="text-muted-foreground">
              Você pode cancelar sua assinatura a qualquer momento através das configurações 
              da sua conta. Após o cancelamento:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Você manterá acesso até o fim do período pago</li>
              <li>Não haverá cobrança de renovação</li>
              <li>Seus dados serão mantidos por 30 dias após o vencimento</li>
              <li>Reembolsos são avaliados caso a caso para cancelamentos em até 7 dias</li>
            </ul>
          </section>

          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-semibold m-0">5. Uso Aceitável</h2>
            </div>
            <p className="text-muted-foreground">
              Ao utilizar a Plataforma, você concorda em:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Fornecer informações verdadeiras e precisas</li>
              <li>Manter a segurança de suas credenciais de acesso</li>
              <li>Não compartilhar sua conta com terceiros</li>
              <li>Não utilizar a plataforma para atividades ilegais</li>
              <li>Não tentar acessar dados de outros usuários</li>
              <li>Não sobrecarregar intencionalmente os sistemas</li>
            </ul>
          </section>

          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <Ban className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-semibold m-0">6. Suspensão e Encerramento</h2>
            </div>
            <p className="text-muted-foreground">
              Reservamo-nos o direito de suspender ou encerrar sua conta caso:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Viole estes Termos de Serviço</li>
              <li>Utilize a plataforma de forma fraudulenta</li>
              <li>Não efetue o pagamento das assinaturas</li>
              <li>Cause danos à plataforma ou outros usuários</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold">7. Propriedade Intelectual</h2>
            <p className="text-muted-foreground">
              Todo o conteúdo da Plataforma, incluindo código, design, marcas e logotipos, 
              são de propriedade exclusiva do Foguete Gestão Empresarial. Os dados inseridos 
              por você na plataforma permanecem de sua propriedade, e você nos concede 
              licença para processá-los conforme necessário para fornecer os serviços.
            </p>
          </section>

          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <Scale className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-semibold m-0">8. Limitação de Responsabilidade</h2>
            </div>
            <p className="text-muted-foreground">
              A Plataforma é fornecida "como está", sem garantias de qualquer tipo. Não nos 
              responsabilizamos por:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Perdas ou danos decorrentes do uso da plataforma</li>
              <li>Interrupções temporárias de serviço</li>
              <li>Decisões de negócio baseadas em dados da plataforma</li>
              <li>Erros de terceiros (processadores de pagamento, etc.)</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold">9. Alterações nos Termos</h2>
            <p className="text-muted-foreground">
              Podemos atualizar estes Termos periodicamente. Alterações significativas serão 
              comunicadas por e-mail ou notificação na plataforma. O uso continuado após as 
              alterações constitui aceitação dos novos termos.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold">10. Lei Aplicável</h2>
            <p className="text-muted-foreground">
              Estes Termos são regidos pelas leis da República Federativa do Brasil. 
              Qualquer disputa será resolvida no foro da comarca de Florianópolis/SC.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold">11. Contato</h2>
            <p className="text-muted-foreground">
              Para dúvidas sobre estes Termos de Serviço, entre em contato:
            </p>
            <ul className="list-none pl-0 text-muted-foreground space-y-2 mt-4">
              <li><strong>WhatsApp:</strong> (48) 98843-0812</li>
              <li><strong>E-mail:</strong> contato@foguetegestao.com.br</li>
            </ul>
          </section>

          <section className="mt-12 p-6 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground text-center">
              Ao utilizar o Foguete Gestão Empresarial, você confirma que leu, entendeu 
              e concorda com estes Termos de Serviço.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default TermosServico;
