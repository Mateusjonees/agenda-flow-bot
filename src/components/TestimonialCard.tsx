import { Star, Scissors, Heart, Dumbbell, Clipboard, Building2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface TestimonialCardProps {
  name: string;
  businessName: string;
  businessType: string;
  content: string;
  rating: number;
  photoUrl?: string;
  highlight?: string;
  isFeatured?: boolean;
}

const businessTypeConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  salao: { icon: Scissors, color: "text-pink-400", label: "Salão de Beleza" },
  barbearia: { icon: Scissors, color: "text-blue-400", label: "Barbearia" },
  clinica: { icon: Heart, color: "text-green-400", label: "Clínica" },
  academia: { icon: Dumbbell, color: "text-orange-400", label: "Academia" },
  consultorio: { icon: Clipboard, color: "text-purple-400", label: "Consultório" },
  outros: { icon: Building2, color: "text-gray-400", label: "Negócio" },
};

export function TestimonialCard({
  name,
  businessName,
  businessType,
  content,
  rating,
  photoUrl,
  highlight,
  isFeatured,
}: TestimonialCardProps) {
  const config = businessTypeConfig[businessType] || businessTypeConfig.outros;
  const IconComponent = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className={`relative bg-slate-900/80 backdrop-blur-sm rounded-2xl p-6 border transition-all duration-300 h-full flex flex-col ${
        isFeatured 
          ? "border-primary/50 shadow-lg shadow-primary/20" 
          : "border-slate-700/50 hover:border-primary/40"
      }`}
    >
      {/* Highlight Badge */}
      {highlight && (
        <div className="absolute -top-3 -right-3 bg-gradient-to-r from-primary to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
          {highlight}
        </div>
      )}

      {/* Featured Badge */}
      {isFeatured && (
        <div className="absolute -top-3 left-4 flex items-center gap-1 bg-primary/20 text-primary text-xs font-medium px-2 py-1 rounded-full border border-primary/30">
          <Sparkles className="w-3 h-3" />
          Destaque
        </div>
      )}

      {/* Icon & Rating */}
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center ${config.color}`}>
          <IconComponent className="w-6 h-6" />
        </div>
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${
                i < rating ? "text-yellow-400 fill-yellow-400" : "text-slate-600"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <blockquote className="text-slate-300 text-sm leading-relaxed mb-4 flex-grow">
        <span className="text-primary text-2xl leading-none">"</span>
        {content}
        <span className="text-primary text-2xl leading-none">"</span>
      </blockquote>

      {/* Author */}
      <div className="flex items-center gap-3 pt-4 border-t border-slate-700/50">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-orange-500/30 flex items-center justify-center text-white font-semibold text-sm overflow-hidden">
          {photoUrl ? (
            <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
          ) : (
            name.charAt(0).toUpperCase()
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium text-sm truncate">{name}</p>
          <p className="text-slate-400 text-xs truncate">{businessName}</p>
        </div>
      </div>
    </motion.div>
  );
}
