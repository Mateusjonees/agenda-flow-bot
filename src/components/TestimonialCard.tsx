import { Star, Scissors, Heart, Dumbbell, Clipboard, Building2, Sparkles, PawPrint } from "lucide-react";

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
  salao: { icon: Scissors, color: "text-pink-500 dark:text-pink-400", label: "Salão de Beleza" },
  barbearia: { icon: Scissors, color: "text-blue-500 dark:text-blue-400", label: "Barbearia" },
  clinica: { icon: Heart, color: "text-green-500 dark:text-green-400", label: "Clínica" },
  spa: { icon: Sparkles, color: "text-purple-500 dark:text-purple-400", label: "Spa" },
  petshop: { icon: PawPrint, color: "text-amber-500 dark:text-amber-400", label: "Pet Shop" },
  academia: { icon: Dumbbell, color: "text-orange-500 dark:text-orange-400", label: "Academia" },
  consultorio: { icon: Clipboard, color: "text-teal-500 dark:text-teal-400", label: "Consultório" },
  outros: { icon: Building2, color: "text-gray-500 dark:text-gray-400", label: "Negócio" },
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
    <div
      className={`relative bg-card rounded-2xl p-6 border transition-all duration-300 h-full flex flex-col shadow-sm hover:-translate-y-1 hover:scale-[1.02] animate-fade-in ${
        isFeatured 
          ? "border-primary/50 shadow-lg shadow-primary/10" 
          : "border-border hover:border-primary/40"
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
        <div className="absolute -top-3 left-4 flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded-full border border-primary/30">
          <Sparkles className="w-3 h-3" />
          Destaque
        </div>
      )}

      {/* Author with Photo - FIRST */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-shrink-0">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/30 to-orange-500/30 flex items-center justify-center text-foreground font-semibold text-lg overflow-hidden border-2 border-border">
            {photoUrl ? (
              <img 
                src={photoUrl} 
                alt={name} 
                width={56}
                height={56}
                className="w-full h-full object-cover" 
                loading="lazy"
              />
            ) : (
              name.charAt(0).toUpperCase()
            )}
          </div>
          {/* Business Type Icon Badge */}
          <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-card border-2 border-border flex items-center justify-center ${config.color}`}>
            <IconComponent className="w-3 h-3" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-foreground font-semibold text-sm truncate">{name}</p>
          <p className="text-muted-foreground text-xs truncate">{businessName}</p>
          <p className={`text-xs ${config.color}`}>{config.label}</p>
        </div>
      </div>

      {/* Rating */}
      <div className="flex items-center gap-0.5 mb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"
            }`}
          />
        ))}
      </div>

      {/* Content */}
      <blockquote className="text-muted-foreground text-sm leading-relaxed flex-grow">
        <span className="text-primary text-2xl leading-none">"</span>
        {content}
        <span className="text-primary text-2xl leading-none">"</span>
      </blockquote>
    </div>
  );
}
