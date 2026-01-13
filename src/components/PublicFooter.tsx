import { Link } from "react-router-dom";
import { Rocket, MessageCircle, Instagram, Mail, ArrowRight, Phone, MapPin, Clock, Shield, Heart } from "lucide-react";
import { FaWhatsapp, FaInstagram, FaFacebook, FaLinkedin, FaYoutube } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function PublicFooter() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="relative bg-gradient-to-b from-muted/30 via-muted/50 to-muted border-t border-border overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-orange-500/5 rounded-full blur-3xl" />
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
            {/* Logo e Descrição */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/25">
                  <Rocket className="w-7 h-7 text-white" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
                  Foguete
                </span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
                A plataforma completa para gestão do seu negócio. Automatize agendamentos, 
                gerencie clientes e cresça com inteligência artificial.
              </p>
              
              {/* Social Icons */}
              <div className="flex items-center gap-3">
                <a 
                  href="https://wa.me/5511999999999" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-[#25D366]/10 hover:bg-[#25D366] text-[#25D366] hover:text-white flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-[#25D366]/25"
                >
                  <FaWhatsapp className="w-5 h-5" />
                </a>
                <a 
                  href="https://instagram.com/foguete" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-[#E4405F]/10 hover:bg-gradient-to-br hover:from-[#833AB4] hover:via-[#E4405F] hover:to-[#FCAF45] text-[#E4405F] hover:text-white flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-[#E4405F]/25"
                >
                  <FaInstagram className="w-5 h-5" />
                </a>
                <a 
                  href="https://facebook.com/foguete" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-[#1877F2]/10 hover:bg-[#1877F2] text-[#1877F2] hover:text-white flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-[#1877F2]/25"
                >
                  <FaFacebook className="w-5 h-5" />
                </a>
                <a 
                  href="https://linkedin.com/company/foguete" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-[#0A66C2]/10 hover:bg-[#0A66C2] text-[#0A66C2] hover:text-white flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-[#0A66C2]/25"
                >
                  <FaLinkedin className="w-5 h-5" />
                </a>
                <a 
                  href="https://youtube.com/foguete" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-[#FF0000]/10 hover:bg-[#FF0000] text-[#FF0000] hover:text-white flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-[#FF0000]/25"
                >
                  <FaYoutube className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Produto */}
            <div className="space-y-4">
              <h4 className="font-bold text-foreground text-sm uppercase tracking-wider">Produto</h4>
              <ul className="space-y-3">
                <li>
                  <Link to="/recursos" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group">
                    <ArrowRight className="w-3 h-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    Recursos
                  </Link>
                </li>
                <li>
                  <Link to="/precos" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group">
                    <ArrowRight className="w-3 h-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    Preços
                  </Link>
                </li>
                <li>
                  <Link to="/depoimentos" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group">
                    <ArrowRight className="w-3 h-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    Depoimentos
                  </Link>
                </li>
                <li>
                  <Link to="/faq" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group">
                    <ArrowRight className="w-3 h-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>

            {/* Suporte */}
            <div className="space-y-4">
              <h4 className="font-bold text-foreground text-sm uppercase tracking-wider">Suporte</h4>
              <ul className="space-y-3">
                <li>
                  <Link to="/faq" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group">
                    <ArrowRight className="w-3 h-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    Central de Ajuda
                  </Link>
                </li>
                <li>
                  <a 
                    href="https://wa.me/5511999999999" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group"
                  >
                    <ArrowRight className="w-3 h-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    Suporte WhatsApp
                  </a>
                </li>
                <li>
                  <Link to="/politica-privacidade" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group">
                    <ArrowRight className="w-3 h-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    Privacidade
                  </Link>
                </li>
                <li>
                  <Link to="/termos-servico" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group">
                    <ArrowRight className="w-3 h-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    Termos de Uso
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contato */}
            <div className="space-y-4">
              <h4 className="font-bold text-foreground text-sm uppercase tracking-wider">Contato</h4>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <a href="mailto:contato@foguete.com" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                      contato@foguete.com
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Telefone</p>
                    <a href="tel:+5511999999999" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                      (11) 99999-9999
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Atendimento</p>
                    <p className="text-sm font-medium text-foreground">Seg-Sex: 9h às 18h</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="py-8 border-t border-border/50">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="text-center lg:text-left">
              <h5 className="font-bold text-foreground text-lg">Receba novidades e dicas</h5>
              <p className="text-sm text-muted-foreground mt-1">Fique por dentro das melhores práticas para seu negócio</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <Input 
                type="email" 
                placeholder="seu@email.com" 
                className="h-12 w-full sm:w-72 bg-background border-border/50 focus:border-primary"
              />
              <Button className="h-12 px-8 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all">
                Inscrever-se
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="py-6 border-t border-border/50">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>© {currentYear} Foguete.</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:flex items-center gap-1">
                Feito com <Heart className="w-3 h-3 text-red-500 fill-red-500" /> no Brasil
              </span>
            </div>
            
            <div className="flex items-center gap-6 text-sm">
              <Link to="/politica-privacidade" className="text-muted-foreground hover:text-primary transition-colors">
                Privacidade
              </Link>
              <Link to="/termos-servico" className="text-muted-foreground hover:text-primary transition-colors">
                Termos
              </Link>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Shield className="w-3.5 h-3.5" />
                LGPD
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}