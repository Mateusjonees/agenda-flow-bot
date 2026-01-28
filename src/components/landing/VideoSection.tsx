import { useState } from "react";

// Inline SVG to avoid lucide-react bundle cost
const PlayIcon = () => (
  <svg className="w-7 h-7 md:w-8 md:h-8 ml-1" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const VideoSection = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const videoId = "bMXz7kbfghg";

  return (
    <section className="py-12 md:py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Veja como funciona
            </h2>
            <p className="text-muted-foreground">
              Assista uma demonstração rápida do sistema
            </p>
          </div>
          
          <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl border bg-muted">
            {!isLoaded ? (
              <button
                onClick={() => setIsLoaded(true)}
                className="absolute inset-0 flex items-center justify-center cursor-pointer group"
                aria-label="Reproduzir vídeo"
              >
                {/* YouTube Thumbnail - Lazy loaded */}
                <img 
                  src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                  alt="Thumbnail do vídeo de demonstração"
                  width={480}
                  height={360}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                  fetchPriority="low"
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
                
                {/* Play Button */}
                <div className="relative z-10 w-16 h-16 md:w-20 md:h-20 bg-primary/90 rounded-full flex items-center justify-center group-hover:scale-110 group-hover:bg-primary transition-all duration-300 shadow-xl">
                  <span className="text-white"><PlayIcon /></span>
                </div>
              </button>
            ) : (
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
                title="Vídeo de demonstração do Foguete Gestão"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default VideoSection;
