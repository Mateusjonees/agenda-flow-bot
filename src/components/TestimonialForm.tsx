import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, Send, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const businessTypes = [
  { value: "salao", label: "Salão de Beleza" },
  { value: "barbearia", label: "Barbearia" },
  { value: "clinica", label: "Clínica" },
  { value: "academia", label: "Academia" },
  { value: "consultorio", label: "Consultório" },
  { value: "outros", label: "Outros" },
];

export function TestimonialForm() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    businessName: "",
    businessType: "",
    content: "",
    highlight: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!formData.name || !formData.businessName || !formData.businessType || !formData.content) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (formData.content.length < 20) {
      toast.error("O depoimento deve ter pelo menos 20 caracteres");
      return;
    }

    // Verificar autenticação
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Você precisa estar logado para enviar um depoimento");
      navigate("/auth?mode=login&redirect=/depoimentos");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("testimonials").insert({
        user_id: user.id,
        name: formData.name,
        business_name: formData.businessName,
        business_type: formData.businessType,
        content: formData.content,
        rating,
        highlight: formData.highlight || null,
        is_approved: false,
        is_featured: false,
      });

      if (error) throw error;

      setIsSubmitted(true);
      toast.success("Depoimento enviado com sucesso! Será publicado após revisão.");
    } catch (error: any) {
      console.error("Erro ao enviar depoimento:", error);
      toast.error("Erro ao enviar depoimento. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900/80 backdrop-blur-sm rounded-2xl p-8 border border-green-500/30 text-center"
      >
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">
          Obrigado pelo seu depoimento!
        </h3>
        <p className="text-slate-400 mb-4">
          Seu depoimento foi enviado e será publicado após nossa revisão.
        </p>
        <Button
          variant="outline"
          onClick={() => {
            setIsSubmitted(false);
            setFormData({ name: "", businessName: "", businessType: "", content: "", highlight: "" });
            setRating(5);
          }}
        >
          Enviar outro depoimento
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-slate-900/80 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-slate-700/50"
    >
      <div className="text-center mb-6">
        <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
          📝 Compartilhe sua Experiência
        </h3>
        <p className="text-slate-400 text-sm">
          Conte como o Foguete Gestão ajudou seu negócio
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-white">
              Seu Nome *
            </Label>
            <Input
              id="name"
              placeholder="Ex: João Silva"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessName" className="text-white">
              Nome da Empresa *
            </Label>
            <Input
              id="businessName"
              placeholder="Ex: Barbearia Premium"
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-white">Tipo de Negócio *</Label>
            <Select
              value={formData.businessType}
              onValueChange={(value) => setFormData({ ...formData, businessType: value })}
            >
              <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {businessTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="highlight" className="text-white">
              Destaque (opcional)
            </Label>
            <Input
              id="highlight"
              placeholder="Ex: +30% vendas"
              value={formData.highlight}
              onChange={(e) => setFormData({ ...formData, highlight: e.target.value })}
              className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* Rating Stars */}
        <div className="space-y-2">
          <Label className="text-white">Sua Avaliação *</Label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= (hoveredRating || rating)
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-slate-600"
                  }`}
                />
              </button>
            ))}
            <span className="ml-2 text-slate-400 text-sm">
              {rating} de 5 estrelas
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="content" className="text-white">
            Seu Depoimento * (mínimo 20 caracteres)
          </Label>
          <Textarea
            id="content"
            placeholder="Conte como o Foguete Gestão ajudou seu negócio..."
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            rows={4}
            className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 resize-none"
          />
          <p className="text-xs text-slate-500">
            {formData.content.length}/20 caracteres mínimos
          </p>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 text-white font-semibold"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Enviar Depoimento
            </>
          )}
        </Button>
      </form>
    </motion.div>
  );
}
