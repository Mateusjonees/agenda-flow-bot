import { memo, useRef, useState, useCallback } from "react";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const testimonials = [
  {
    name: "Maria Silva",
    role: "Salão Beleza Pura",
    content: "O Foguete transformou a gestão do meu salão. Economizo 10 horas por semana!",
    rating: 5,
    highlight: "30% mais reservas"
  },
  {
    name: "João Santos",
    role: "Barbearia Estilo",
    content: "Meus clientes adoram os lembretes automáticos. Fidelização aumentou muito!",
    rating: 5,
    highlight: "Fidelização +45%"
  },
  {
    name: "Ana Costa",
    role: "Clínica Vida Saudável",
    content: "Controle financeiro e relatórios me dão total visibilidade do negócio.",
    rating: 5,
    highlight: "Controle total"
  },
  {
    name: "Pedro Oliveira",
    role: "Academia Forma Fitness",
    content: "Reduzimos inadimplência em 60%. Perfeito para academias!",
    rating: 5,
    highlight: "-60% inadimplência"
  }
];

const stats = [
  { value: "5.000+", label: "Empresas ativas" },
  { value: "98%", label: "Satisfação" },
  { value: "50k+", label: "Agendamentos/dia" },
  { value: "4.9★", label: "Avaliação média" }
];

const TestimonialsSection = memo(() => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollButtons = useCallback(() => {
    const container = scrollRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 10);
      setCanScrollRight(container.scrollLeft < container.scrollWidth - container.clientWidth - 10);
    }
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollRef.current;
    if (container) {
      container.scrollBy({
        left: direction === 'left' ? -320 : 320,
        behavior: 'smooth'
      });
      setTimeout(updateScrollButtons, 300);
    }
  };

  return (
    <section id="testimonials" className="py-16 md:py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Carousel Controls */}
        <div className="hidden md:flex justify-end gap-2 mb-4">
          <Button variant="outline" size="icon" onClick={() => scroll('left')} disabled={!canScrollLeft} className="rounded-full w-8 h-8">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => scroll('right')} disabled={!canScrollRight} className="rounded-full w-8 h-8">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Testimonials Carousel */}
        <div
          ref={scrollRef}
          onScroll={updateScrollButtons}
          className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-card rounded-xl p-5 border flex flex-col min-w-[280px] md:min-w-[320px] snap-center flex-shrink-0"
            >
              <Badge variant="secondary" className="w-fit mb-3 bg-primary/10 text-primary text-xs">
                {testimonial.highlight}
              </Badge>

              <div className="flex gap-0.5 mb-2">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              <p className="text-sm text-foreground/90 mb-4 flex-1 line-clamp-3">
                "{testimonial.content}"
              </p>

              <div className="flex items-center gap-2 pt-3 border-t">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-sm">{testimonial.name}</div>
                  <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-2xl md:text-3xl font-extrabold text-primary">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

TestimonialsSection.displayName = "TestimonialsSection";
export default TestimonialsSection;
