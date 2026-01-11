import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const testimonials = [
  {
    name: "Maria Silva",
    role: "Salão Beleza Pura",
    content: "O Foguete transformou completamente a gestão do meu salão. Economizo 10 horas por semana e aumentei em 30% minhas reservas!",
    rating: 5,
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
    highlight: "30% mais reservas",
  },
  {
    name: "João Santos",
    role: "Barbearia Estilo",
    content: "Incrível como é fácil de usar! Meus clientes adoram receber lembretes automáticos e o pós-venda aumentou muito nossa fidelização.",
    rating: 5,
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    highlight: "Fidelização +45%",
  },
  {
    name: "Ana Costa",
    role: "Clínica Vida Saudável",
    content: "O controle financeiro e os relatórios me dão total visibilidade do negócio. Recomendo para qualquer prestador de serviços!",
    rating: 5,
    photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    highlight: "Controle total",
  },
  {
    name: "Pedro Oliveira",
    role: "Academia Forma Fitness",
    content: "Triplicamos o controle sobre as mensalidades e reduzimos inadimplência em 60%. O sistema é perfeito para academias!",
    rating: 5,
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    highlight: "-60% inadimplência",
  },
  {
    name: "Carla Mendes",
    role: "Clínica Estética Beleza",
    content: "Os prontuários digitais e o histórico de clientes facilitaram muito nosso trabalho. Interface linda e muito intuitiva.",
    rating: 5,
    photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
    highlight: "Prontuários digitais",
  },
  {
    name: "Ricardo Lima",
    role: "Consultório Dr. Lima",
    content: "A agenda médica ficou muito mais organizada. Os lembretes automáticos reduziram faltas drasticamente. Excelente!",
    rating: 5,
    photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    highlight: "-70% de faltas",
  },
];

const TestimonialsSection = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Auto-scroll effect
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    let animationId: number;
    let scrollSpeed = 0.5; // pixels per frame

    const autoScroll = () => {
      if (!isPaused && container) {
        container.scrollLeft += scrollSpeed;
        
        // Reset scroll when reaching the end (loop effect)
        if (container.scrollLeft >= container.scrollWidth - container.clientWidth) {
          container.scrollLeft = 0;
        }
      }
      animationId = requestAnimationFrame(autoScroll);
    };

    animationId = requestAnimationFrame(autoScroll);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isPaused]);

  // Update scroll buttons state
  const updateScrollButtons = () => {
    const container = scrollRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(container.scrollLeft < container.scrollWidth - container.clientWidth - 10);
    }
  };

  useEffect(() => {
    const container = scrollRef.current;
    if (container) {
      container.addEventListener('scroll', updateScrollButtons);
      updateScrollButtons();
      return () => container.removeEventListener('scroll', updateScrollButtons);
    }
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollRef.current;
    if (container) {
      const scrollAmount = 400;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section id="testimonials" className="py-24 relative bg-muted/30 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <Badge className="px-4 py-2 mb-6 bg-secondary/10 text-secondary-foreground border-secondary/30">
              <Star className="w-4 h-4 mr-2 fill-current" />
              Depoimentos
            </Badge>
            <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mb-4">
              O que nossos <span className="text-gradient-primary">clientes dizem</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Mais de 5.000 empresas já transformaram sua gestão com o Foguete
            </p>
          </div>

          {/* Carousel Controls - Desktop */}
          <div className="hidden md:flex justify-end gap-2 mb-6">
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className="rounded-full"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className="rounded-full"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Testimonials Carousel */}
          <div
            ref={scrollRef}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
            className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory cursor-grab active:cursor-grabbing"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {/* Duplicate cards for infinite scroll effect */}
            {[...testimonials, ...testimonials].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (index % testimonials.length) * 0.1 }}
                className="bg-card rounded-2xl p-6 border shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col min-w-[340px] md:min-w-[380px] snap-center flex-shrink-0"
              >
                {/* Quote Icon */}
                <Quote className="w-10 h-10 text-primary/20 mb-4" />

                {/* Highlight Badge */}
                <Badge variant="secondary" className="w-fit mb-4 bg-primary/10 text-primary border-primary/30">
                  {testimonial.highlight}
                </Badge>

                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                {/* Content */}
                <p className="text-foreground mb-6 leading-relaxed flex-1">
                  "{testimonial.content}"
                </p>

                {/* Author with Real Photo */}
                <div className="flex items-center gap-4 pt-4 border-t">
                  <img
                    src={testimonial.photo}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover shadow-lg ring-2 ring-primary/20"
                    loading="lazy"
                  />
                  <div>
                    <div className="font-bold text-foreground">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Scroll Indicator Dots */}
          <div className="flex justify-center gap-2 mt-6 md:hidden">
            {testimonials.map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-primary/30 transition-colors"
              />
            ))}
          </div>

          {/* Auto-scroll hint */}
          <p className="text-center text-sm text-muted-foreground mt-4 hidden md:block">
            Passe o mouse para pausar • Use as setas para navegar
          </p>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {[
              { value: "5.000+", label: "Empresas ativas" },
              { value: "98%", label: "Satisfação" },
              { value: "50k+", label: "Agendamentos/dia" },
              { value: "4.9★", label: "Avaliação média" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-4xl font-extrabold text-gradient-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
