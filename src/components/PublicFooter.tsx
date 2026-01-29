import { Link, useNavigate } from "react-router-dom";
import logoLight from "@/assets/logo.png";

export function PublicFooter() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-background dark:bg-[#1a1f2e] border-t border-border dark:border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-16">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <img 
                src="/lovable-uploads/80412b3c-5edc-43b9-ab6d-a607dcdc2156.png" 
                alt="Foguete" 
                width={64}
                height={64}
                className="h-16 w-auto dark:hidden" 
              />
              <img 
                src={logoLight} 
                alt="Foguete" 
                width={64}
                height={64}
                className="h-16 w-auto hidden dark:block" 
              />
              <span className="text-xl font-bold text-foreground">Foguete</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Sistema completo de gestão empresarial para salões, clínicas, barbearias e prestadores de serviço.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-foreground mb-5 text-base">Produto</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link 
                  to="/recursos" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Funcionalidades
                </Link>
              </li>
              <li>
                <Link 
                  to="/precos" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Preços
                </Link>
              </li>
              <li>
                <Link 
                  to="/depoimentos" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Depoimentos
                </Link>
              </li>
              <li>
                <Link 
                  to="/faq" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-foreground mb-5 text-base">Contato</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a 
                  href="https://wa.me/5548988127520" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                >
                  <span className="text-base">💬</span>
                  Vendas: (48) 98812-7520
                </a>
              </li>
              <li>
                <a 
                  href="https://wa.me/554899075189" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                >
                  <span className="text-base">🎧</span>
                  Suporte: (48) 99075-1889
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-foreground mb-5 text-base">Horário</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 text-muted-foreground">
                <span className="text-base">🕐</span>
                Seg - Sex: 9h às 18h
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <span className="text-base">🛡️</span>
                Suporte 24/7 via WhatsApp
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border dark:border-white/10 mt-12 pt-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground text-center sm:text-left">
              © {currentYear} Foguete Gestão Empresarial. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-6 text-sm">
              <Link 
                to="/politica-privacidade" 
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacidade
              </Link>
              <Link 
                to="/termos-servico" 
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Termos
              </Link>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="text-base">🔒</span>
                LGPD
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default PublicFooter;
