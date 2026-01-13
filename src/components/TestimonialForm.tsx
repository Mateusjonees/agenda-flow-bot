import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Star, Send, Loader2, CheckCircle, Upload, X, Image } from "lucide-react";
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
  { value: "spa", label: "Spa" },
  { value: "petshop", label: "Pet Shop" },
  { value: "consultorio", label: "Consultório" },
  { value: "outros", label: "Outros" },
];

export function TestimonialForm() {
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
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione apenas imagens (JPG, PNG, etc.)");
      return;
    }

    // Validar tamanho (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 2MB");
      return;
    }

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadPhoto = async (): Promise<string | null> => {
    if (!photoFile) return null;

    setIsUploadingPhoto(true);
    try {
      const fileExt = photoFile.name.split(".").pop();
      const fileName = `testimonials/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, photoFile);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        toast.error("Erro ao fazer upload da foto");
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error("Upload error:", error);
      return null;
    } finally {
      setIsUploadingPhoto(false);
    }
  };

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

    setIsSubmitting(true);

    try {
      // Upload da foto se existir
      let photoUrl: string | null = null;
      if (photoFile) {
        photoUrl = await uploadPhoto();
      }

      // Usar Edge Function para publicação automática com anti-spam
      const response = await fetch(
        "https://pnwelorcrncqltqiyxwx.supabase.co/functions/v1/submit-testimonial",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: formData.name,
            business_name: formData.businessName,
            business_type: formData.businessType,
            content: formData.content,
            rating,
            highlight: formData.highlight || null,
            photo_url: photoUrl,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao enviar depoimento");
      }

      setIsSubmitted(true);
      toast.success(result.message || "Depoimento publicado com sucesso!");
    } catch (error: any) {
      console.error("Erro ao enviar depoimento:", error);
      toast.error(error.message || "Erro ao enviar depoimento. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setIsSubmitted(false);
    setFormData({ name: "", businessName: "", businessType: "", content: "", highlight: "" });
    setRating(5);
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card backdrop-blur-sm rounded-2xl p-8 border border-green-500/30 text-center shadow-sm"
      >
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Obrigado pelo seu depoimento!
        </h3>
        <p className="text-muted-foreground mb-4">
          Seu depoimento foi publicado e já está visível no site!
        </p>
        <Button variant="outline" onClick={resetForm}>
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
      className="bg-card backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-border shadow-sm"
    >
      <div className="text-center mb-6">
        <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2">
          📝 Compartilhe sua Experiência
        </h3>
        <p className="text-muted-foreground text-sm">
          Conte como o Foguete Gestão ajudou seu negócio
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Foto/Logo Upload */}
        <div className="space-y-2">
          <Label className="text-foreground">Sua Foto ou Logo (opcional)</Label>
          <div className="flex items-center gap-4">
            {photoPreview ? (
              <div className="relative">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-16 h-16 rounded-full object-cover border-2 border-primary/30"
                />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-16 h-16 rounded-full border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-all"
              >
                <Image className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                {photoPreview ? "Trocar foto" : "Escolher foto"}
              </Button>
              <p className="text-xs text-muted-foreground mt-1">
                JPG, PNG. Máximo 2MB
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-foreground">
              Seu Nome *
            </Label>
            <Input
              id="name"
              placeholder="Ex: João Silva"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessName" className="text-foreground">
              Nome da Empresa *
            </Label>
            <Input
              id="businessName"
              placeholder="Ex: Barbearia Premium"
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-foreground">Tipo de Negócio *</Label>
            <Select
              value={formData.businessType}
              onValueChange={(value) => setFormData({ ...formData, businessType: value })}
            >
              <SelectTrigger>
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
            <Label htmlFor="highlight" className="text-foreground">
              Destaque (opcional)
            </Label>
            <Input
              id="highlight"
              placeholder="Ex: +30% vendas"
              value={formData.highlight}
              onChange={(e) => setFormData({ ...formData, highlight: e.target.value })}
            />
          </div>
        </div>

        {/* Rating Stars */}
        <div className="space-y-2">
          <Label className="text-foreground">Sua Avaliação *</Label>
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
                      : "text-muted-foreground/30"
                  }`}
                />
              </button>
            ))}
            <span className="ml-2 text-muted-foreground text-sm">
              {rating} de 5 estrelas
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="content" className="text-foreground">
            Seu Depoimento * (mínimo 20 caracteres)
          </Label>
          <Textarea
            id="content"
            placeholder="Conte como o Foguete Gestão ajudou seu negócio..."
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            rows={4}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            {formData.content.length}/20 caracteres mínimos
          </p>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting || isUploadingPhoto}
          className="w-full bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 text-white font-semibold"
        >
          {isSubmitting || isUploadingPhoto ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {isUploadingPhoto ? "Enviando foto..." : "Enviando..."}
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Enviar Depoimento
            </>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Não é necessário criar conta. Seu depoimento será publicado após aprovação.
        </p>
      </form>
    </motion.div>
  );
}
