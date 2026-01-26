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
const businessTypes = [{
  value: "salao",
  label: "Salão de Beleza"
}, {
  value: "barbearia",
  label: "Barbearia"
}, {
  value: "clinica",
  label: "Clínica"
}, {
  value: "spa",
  label: "Spa"
}, {
  value: "petshop",
  label: "Pet Shop"
}, {
  value: "consultorio",
  label: "Consultório"
}, {
  value: "outros",
  label: "Outros"
}];
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
    highlight: ""
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
    reader.onload = e => {
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
      const {
        error: uploadError
      } = await supabase.storage.from("avatars").upload(fileName, photoFile);
      if (uploadError) {
        console.error("Upload error:", uploadError);
        toast.error("Erro ao fazer upload da foto");
        return null;
      }
      const {
        data: {
          publicUrl
        }
      } = supabase.storage.from("avatars").getPublicUrl(fileName);
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
      const response = await fetch("https://pnwelorcrncqltqiyxwx.supabase.co/functions/v1/submit-testimonial", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: formData.name,
          business_name: formData.businessName,
          business_type: formData.businessType,
          content: formData.content,
          rating,
          highlight: formData.highlight || null,
          photo_url: photoUrl
        })
      });
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
    setFormData({
      name: "",
      businessName: "",
      businessType: "",
      content: "",
      highlight: ""
    });
    setRating(5);
    setPhotoFile(null);
    setPhotoPreview(null);
  };
  if (isSubmitted) {
    return <motion.div initial={{
      opacity: 0,
      scale: 0.95
    }} animate={{
      opacity: 1,
      scale: 1
    }} className="bg-card backdrop-blur-sm rounded-2xl p-8 border border-green-500/30 text-center shadow-sm">
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
      </motion.div>;
  }
  return;
}