interface OfflineStateProps {
  message?: string;
  onRetry?: () => void;
}

export const OfflineState = ({ 
  message = "Sistema offline", 
  onRetry 
}: OfflineStateProps) => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8">
    <div className="text-center space-y-6 max-w-md">
      <div className="flex justify-center mb-6">
        <img 
          src="/logo.png" 
          alt="Logo" 
          className="h-32 w-auto opacity-75"
        />
      </div>
      
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-foreground">
          Sistema Offline
        </h1>
        <p className="text-lg text-muted-foreground">
          {message}
        </p>
        <p className="text-sm text-muted-foreground">
          Verifique sua conexão com a internet ou tente novamente em instantes.
        </p>
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-6 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
        >
          Tentar Novamente
        </button>
      )}

      <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
        <span>Aguardando conexão...</span>
      </div>
    </div>
  </div>
);
