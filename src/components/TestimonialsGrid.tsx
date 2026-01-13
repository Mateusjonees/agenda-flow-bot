import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TestimonialCard } from "./TestimonialCard";
import { Skeleton } from "@/components/ui/skeleton";

// Import photos (woman2 removed - Maria Oliveira was hidden)
import woman1 from "@/assets/testimonials/woman-1.jpg";
import man1 from "@/assets/testimonials/man-1.jpg";
import man2 from "@/assets/testimonials/man-2.jpg";
import woman3 from "@/assets/testimonials/woman-3.jpg";
import man3 from "@/assets/testimonials/man-3.jpg";

interface Testimonial {
  id: string;
  name: string;
  business_name: string;
  business_type: string;
  content: string;
  rating: number;
  photo_url: string | null;
  highlight: string | null;
  is_featured: boolean;
}

// Depoimentos estáticos com fotos reais como fallback (sem Maria Oliveira que foi removida)
const staticTestimonials: Testimonial[] = [
  {
    id: "static-1",
    name: "Ana Silva",
    business_name: "Studio Ana Silva",
    business_type: "salao",
    content: "O Foguete transformou meu salão! Agora consigo acompanhar todos os agendamentos e finanças em um só lugar. Minha produtividade aumentou muito!",
    rating: 5,
    photo_url: woman1,
    highlight: "+40% produtividade",
    is_featured: true,
  },
  {
    id: "static-2",
    name: "Carlos Santos",
    business_name: "Barbearia Premium",
    business_type: "barbearia",
    content: "Ferramenta incrível! Os lembretes automáticos reduziram drasticamente as faltas dos clientes. Super recomendo para qualquer barbearia.",
    rating: 5,
    photo_url: man1,
    highlight: "-60% faltas",
    is_featured: true,
  },
  {
    id: "static-3",
    name: "Pedro Costa",
    business_name: "Academia Força Total",
    business_type: "academia",
    content: "Perfeito para controlar as mensalidades e acompanhar cada aluno. O sistema é muito intuitivo e fácil de usar.",
    rating: 5,
    photo_url: man2,
    highlight: "+50 alunos",
    is_featured: true,
  },
  {
    id: "static-4",
    name: "Juliana Mendes",
    business_name: "Espaço Juliana Nails",
    business_type: "salao",
    content: "Melhor investimento que fiz! O controle de estoque e agendamentos me poupou horas de trabalho toda semana.",
    rating: 5,
    photo_url: woman3,
    highlight: "+25% vendas",
    is_featured: false,
  },
  {
    id: "static-5",
    name: "Roberto Lima",
    business_name: "Consultório Dr. Lima",
    business_type: "consultorio",
    content: "A organização dos agendamentos melhorou 100%. Meus pacientes adoram receber os lembretes automáticos.",
    rating: 5,
    photo_url: man3,
    highlight: "100% organizado",
    is_featured: false,
  },
];

export function TestimonialsGrid() {
  const queryClient = useQueryClient();

  const { data: testimonials, isLoading } = useQuery({
    queryKey: ["public-testimonials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .eq("is_approved", true)
        .eq("is_hidden", false)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao buscar depoimentos:", error);
        return null;
      }

      return data as Testimonial[];
    },
  });

  // Realtime subscription para atualizar instantaneamente
  useEffect(() => {
    const channel = supabase
      .channel("testimonials-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "testimonials",
        },
        (payload) => {
          console.log("Depoimento atualizado em tempo real:", payload);
          // Invalida o cache para recarregar os dados
          queryClient.invalidateQueries({ queryKey: ["public-testimonials"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Mesclar depoimentos do banco com estáticos para ficar mais humano
  // Novos depoimentos (do banco sem foto estática) aparecem primeiro
  // Depois os estáticos que têm fotos reais
  const displayTestimonials = (() => {
    if (!testimonials || testimonials.length === 0) {
      return staticTestimonials;
    }
    
    // IDs dos depoimentos estáticos originais (sem Maria Oliveira que foi removida)
    const staticIds = ['Ana Silva', 'Carlos Santos', 'Pedro Costa', 'Juliana Mendes', 'Roberto Lima'];
    
    // Depoimentos novos (do banco que não são os estáticos)
    const newTestimonials = testimonials.filter(t => !staticIds.includes(t.name));
    
    // Depoimentos estáticos do banco (usar a versão do banco, não a estática local)
    const dbStaticTestimonials = testimonials.filter(t => staticIds.includes(t.name));
    
    // Mesclar: primeiro os novos (mais recentes), depois substituir os estáticos
    // com suas versões do banco (para manter atualizado), e adicionar os que 
    // ainda não estão no banco
    const result: Testimonial[] = [...newTestimonials];
    
    // Adicionar os estáticos que já estão no banco
    dbStaticTestimonials.forEach(dbT => {
      // Encontrar a foto do estático correspondente
      const staticVersion = staticTestimonials.find(s => s.name === dbT.name);
      result.push({
        ...dbT,
        photo_url: dbT.photo_url || staticVersion?.photo_url || null
      });
    });
    
    // Se ainda há menos de 6, completar com estáticos locais que não estão no banco
    if (result.length < 6) {
      const addedNames = result.map(r => r.name);
      const remaining = staticTestimonials.filter(s => !addedNames.includes(s.name));
      result.push(...remaining.slice(0, 6 - result.length));
    }
    
    return result;
  })();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-card rounded-2xl p-6 border border-border shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="w-12 h-12 rounded-full" />
              <div>
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
            <Skeleton className="h-20 w-full mb-4" />
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Skeleton key={s} className="w-4 h-4" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {displayTestimonials.map((testimonial) => (
        <TestimonialCard
          key={testimonial.id}
          name={testimonial.name}
          businessName={testimonial.business_name}
          businessType={testimonial.business_type}
          content={testimonial.content}
          rating={testimonial.rating}
          photoUrl={testimonial.photo_url || undefined}
          highlight={testimonial.highlight || undefined}
          isFeatured={testimonial.is_featured}
        />
      ))}
    </div>
  );
}
