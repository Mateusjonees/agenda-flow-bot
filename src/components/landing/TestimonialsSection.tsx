import { useEffect, useRef, useState, useCallback } from "react";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

const testimonials = [{
  name: "Maria Silva",
  role: "Salão Beleza Pura",
  content: "O Foguete transformou completamente a gestão do meu salão. Economizo 10 horas por semana e aumentei em 30% minhas reservas!",
  rating: 5,
  photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face&q=60",
  highlight: "30% mais reservas"
}, {
  name: "João Santos",
  role: "Barbearia Estilo",
  content: "Incrível como é fácil de usar! Meus clientes adoram receber lembretes automáticos e o pós-venda aumentou muito nossa fidelização.",
  rating: 5,
  photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face&q=60",
  highlight: "Fidelização +45%"
}, {
  name: "Ana Costa",
  role: "Clínica Vida Saudável",
  content: "O controle financeiro e os relatórios me dão total visibilidade do negócio. Recomendo para qualquer prestador de serviços!",
  rating: 5,
  photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face&q=60",
  highlight: "Controle total"
}, {
  name: "Pedro Oliveira",
  role: "Academia Forma Fitness",
  content: "Triplicamos o controle sobre as mensalidades e reduzimos inadimplência em 60%. O sistema é perfeito para academias!",
  rating: 5,
  photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face&q=60",
  highlight: "-60% inadimplência"
}, {
  name: "Carla Mendes",
  role: "Clínica Estética Beleza",
  content: "Os prontuários digitais e o histórico de clientes facilitaram muito nosso trabalho. Interface linda e muito intuitiva.",
  rating: 5,
  photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face&q=60",
  highlight: "Prontuários digitais"
}, {
  name: "Ricardo Lima",
  role: "Consultório Dr. Lima",
  content: "A agenda médica ficou muito mais organizada. Os lembretes automáticos reduziram faltas drasticamente. Excelente!",
  rating: 5,
  photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face&q=60",
  highlight: "-70% de faltas"
}];
const TestimonialsSection = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const isMobile = useIsMobile();

  const updateScrollButtons = useCallback(() => {
    const container = scrollRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 10);
      setCanScrollRight(container.scrollLeft < container.scrollWidth - container.clientWidth - 10);
    }
  }, []);

  useEffect(() => {
    const container = scrollRef.current;
    if (container) {
      container.addEventListener('scroll', updateScrollButtons);
      updateScrollButtons();
      return () => container.removeEventListener('scroll', updateScrollButtons);
    }
  }, [updateScrollButtons]);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollRef.current;
    if (container) {
      const cardWidth = 400;
      container.scrollBy({
        left: direction === 'left' ? -cardWidth : cardWidth,
        behavior: 'smooth'
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const container = scrollRef.current;
    if (!container) return;
    setIsDragging(true);
    setStartX(e.pageX - container.offsetLeft);
    setScrollLeft(container.scrollLeft);
    container.style.cursor = 'grabbing';
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const container = scrollRef.current;
    if (!container) return;
    const x = e.pageX - container.offsetLeft;
    const walk = (x - startX) * 1.5;
    container.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    const container = scrollRef.current;
    if (container) {
      container.style.cursor = 'grab';
    }
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      const container = scrollRef.current;
      if (container) {
        container.style.cursor = 'grab';
      }
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const container = scrollRef.current;
    if (!container) return;
    setIsDragging(true);
    setStartX(e.touches[0].pageX - container.offsetLeft);
    setScrollLeft(container.scrollLeft);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const container = scrollRef.current;
    if (!container) return;
    const x = e.touches[0].pageX - container.offsetLeft;
    const walk = (x - startX) * 1.5;
    container.scrollLeft = scrollLeft - walk;
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };
  const displayedTestimonials = isMobile ? testimonials.slice(0, 4) : testimonials;

  return (
    <section id="testimonials" className="py-24 relative bg-muted/30 overflow-hidden defer-mobile">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          <div className="hidden md:flex justify-end gap-2 mb-6">
            <Button variant="outline" size="icon" onClick={() => scroll('left')} disabled={!canScrollLeft} className="rounded-full hover:bg-primary hover:text-primary-foreground disabled:opacity-40">
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => scroll('right')} disabled={!canScrollRight} className="rounded-full hover:bg-primary hover:text-primary-foreground disabled:opacity-40">
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          <div 
            ref={scrollRef} 
            onMouseDown={handleMouseDown} 
            onMouseMove={handleMouseMove} 
            onMouseUp={handleMouseUp} 
            onMouseLeave={handleMouseLeave} 
            onTouchStart={handleTouchStart} 
            onTouchMove={handleTouchMove} 
            onTouchEnd={handleTouchEnd} 
            className={`flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`} 
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {displayedTestimonials.map((testimonial, index) => (
              <div 
                key={index}
                className="bg-card rounded-xl p-6 border border-border/50 shadow-sm hover:border-primary/20 transition-colors duration-200 flex flex-col min-w-[320px] md:min-w-[380px] snap-center flex-shrink-0 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <Badge variant="secondary" className="w-fit mb-4 bg-primary/10 text-primary border-primary/30">
                  {testimonial.highlight}
                </Badge>

                <div className="flex gap-1 mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                <p className="text-foreground/90 mb-6 leading-relaxed flex-1 text-sm">
                  "{testimonial.content}"
                </p>

                <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                  <img 
                    src={testimonial.photo} 
                    alt={testimonial.name}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover ring-1 ring-border" 
                    loading="lazy" 
                    draggable={false}
                    fetchPriority="low"
                  />
                  <div>
                    <div className="font-semibold text-foreground text-sm">{testimonial.name}</div>
                    <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-4">
            <span className="hidden md:inline">Arraste para navegar • Use as setas para avançar</span>
            <span className="md:hidden">Arraste para ver mais depoimentos</span>
          </p>

          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: "5.000+", label: "Empresas ativas" },
              { value: "98%", label: "Satisfação" },
              { value: "50k+", label: "Agendamentos/dia" },
              { value: "4.9★", label: "Avaliação média" }
            ].map((stat, i) => (
              <div 
                key={i} 
                className="text-center animate-fade-in"
                style={{ animationDelay: `${400 + i * 100}ms` }}
              >
                <div className="text-3xl md:text-4xl font-extrabold text-gradient-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;