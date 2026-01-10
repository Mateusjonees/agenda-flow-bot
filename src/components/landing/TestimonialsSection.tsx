import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const testimonials = [
  {
    name: "Maria Silva",
    role: "Salão Beleza Pura",
    content: "O Foguete transformou completamente a gestão do meu salão. Economizo 10 horas por semana e aumentei em 30% minhas reservas!",
    rating: 5,
    avatar: "MS",
    highlight: "30% mais reservas",
  },
  {
    name: "João Santos",
    role: "Barbearia Estilo",
    content: "Incrível como é fácil de usar! Meus clientes adoram receber lembretes automáticos e o pós-venda aumentou muito nossa fidelização.",
    rating: 5,
    avatar: "JS",
    highlight: "Fidelização +45%",
  },
  {
    name: "Ana Costa",
    role: "Clínica Vida Saudável",
    content: "O controle financeiro e os relatórios me dão total visibilidade do negócio. Recomendo para qualquer prestador de serviços!",
    rating: 5,
    avatar: "AC",
    highlight: "Controle total",
  },
  {
    name: "Pedro Oliveira",
    role: "Academia Forma Fitness",
    content: "Triplicamos o controle sobre as mensalidades e reduzimos inadimplência em 60%. O sistema é perfeito para academias!",
    rating: 5,
    avatar: "PO",
    highlight: "-60% inadimplência",
  },
  {
    name: "Carla Mendes",
    role: "Clínica Estética Beleza",
    content: "Os prontuários digitais e o histórico de clientes facilitaram muito nosso trabalho. Interface linda e muito intuitiva.",
    rating: 5,
    avatar: "CM",
    highlight: "Prontuários digitais",
  },
  {
    name: "Ricardo Lima",
    role: "Consultório Dr. Lima",
    content: "A agenda médica ficou muito mais organizada. Os lembretes automáticos reduziram faltas drasticamente. Excelente!",
    rating: 5,
    avatar: "RL",
    highlight: "-70% de faltas",
  },
];

const TestimonialsSection = () => {
  return (
    <section id="testimonials" className="py-24 relative bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
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

          {/* Testimonials Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-2xl p-6 border shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col"
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

                {/* Author */}
                <div className="flex items-center gap-4 pt-4 border-t">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-bold text-foreground">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

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
