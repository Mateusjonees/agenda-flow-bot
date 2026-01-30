import { useState } from "react";

const PlayIcon = () => (
  <svg className="w-12 h-12 md:w-16 md:h-16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const VideoCard = ({ videoId, label }: { videoId: string; label: string }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="w-full max-w-[280px] mx-auto">
      <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-border/50 bg-muted" 
           style={{ aspectRatio: '9/16' }}>
        {!isLoaded ? (
          <button
            onClick={() => setIsLoaded(true)}
            className="absolute inset-0 flex items-center justify-center cursor-pointer group"
            aria-label="Reproduzir depoimento"
          >
            <img 
              src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
              alt="Thumbnail do depoimento"
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
              }}
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/10 group-hover:from-black/70 transition-colors" />
            
            <div className="relative z-10 w-16 h-16 bg-primary/90 rounded-full flex items-center justify-center group-hover:scale-110 group-hover:bg-primary transition-all duration-300 shadow-xl shadow-primary/30">
              <span className="text-white ml-1"><PlayIcon /></span>
            </div>
            
            <div className="absolute bottom-4 left-0 right-0 text-center z-10">
              <p className="text-white font-medium text-sm drop-shadow-lg">
                Toque para assistir
              </p>
            </div>
          </button>
        ) : (
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
            title="Depoimento de cliente"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        )}
      </div>
      
      <p className="text-center text-sm text-muted-foreground mt-3">
        {label}
      </p>
    </div>
  );
};

const VideoTestimonialSection = () => {
  const videos = [
    { id: "N06cYxIykSw", label: "Depoimento de cliente" },
    { id: "TrjmnwMBVUs", label: "Depoimento de cliente" },
  ];

  return (
    <section className="py-16 md:py-24 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-10">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20 mb-4">
            💬 Depoimentos Reais
          </span>
          <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-3">
            O que nossos clientes dizem
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Veja os depoimentos de quem já transformou seu negócio
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8">
          {videos.map((video) => (
            <VideoCard key={video.id} videoId={video.id} label={video.label} />
          ))}
        </div>
        
        {/* WhatsApp CTA */}
        <div className="flex justify-center mt-8">
          <a
            href="https://wa.me/5548988127520"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20BD5A] text-white font-medium py-3 px-6 rounded-full transition-colors shadow-lg"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Fale conosco: (48) 98812-7520
          </a>
        </div>
      </div>
    </section>
  );
};

export default VideoTestimonialSection;
