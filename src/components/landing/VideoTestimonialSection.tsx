import { useState } from "react";

const PlayIcon = () => (
  <svg className="w-12 h-12 md:w-16 md:h-16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const VideoTestimonialSection = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const videoId = "N06cYxIykSw";

  return (
    <section className="py-16 md:py-24 bg-background relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-10">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20 mb-4">
            💬 Depoimento Real
          </span>
          <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-3">
            O que nossos clientes dizem
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Veja o depoimento de quem já transformou seu negócio
          </p>
        </div>
        
        <div className="max-w-sm mx-auto">
          {/* Story/Shorts format container - 9:16 aspect ratio */}
          <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-border/50 bg-muted" 
               style={{ aspectRatio: '9/16' }}>
            {!isLoaded ? (
              <button
                onClick={() => setIsLoaded(true)}
                className="absolute inset-0 flex items-center justify-center cursor-pointer group"
                aria-label="Reproduzir depoimento"
              >
                {/* YouTube Shorts thumbnail */}
                <img 
                  src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                  alt="Thumbnail do depoimento"
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    // Fallback to hqdefault if maxresdefault doesn't exist
                    (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                  }}
                />
                
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/10 group-hover:from-black/70 transition-colors" />
                
                {/* Play button */}
                <div className="relative z-10 w-20 h-20 bg-primary/90 rounded-full flex items-center justify-center group-hover:scale-110 group-hover:bg-primary transition-all duration-300 shadow-xl shadow-primary/30">
                  <span className="text-white ml-1"><PlayIcon /></span>
                </div>
                
                {/* Label at bottom */}
                <div className="absolute bottom-6 left-0 right-0 text-center z-10">
                  <p className="text-white font-medium text-lg drop-shadow-lg">
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
          
          {/* Caption below video */}
          <p className="text-center text-sm text-muted-foreground mt-4">
            Depoimento de cliente satisfeito
          </p>
        </div>
      </div>
    </section>
  );
};

export default VideoTestimonialSection;
