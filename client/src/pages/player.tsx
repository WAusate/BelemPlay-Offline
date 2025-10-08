  import { useState } from "react";
  import { useLocation } from "wouter";
  import Layout from "@/components/layout";
  import AudioPlayer from "@/components/audio-player";
  import CorsErrorMessage from "@/components/cors-error-message";
  import { organs } from "@/lib/organs";
  import { useHymnByIndex } from "@/hooks/use-hymns";
  import { useProgramacao } from "@/contexts/ProgramacaoContext";

  interface PlayerProps {
    organKey: string;
    hymnIndex: string;
  }

  export default function Player({ organKey, hymnIndex }: PlayerProps) {
    const [, navigate] = useLocation();
    const [audioError, setAudioError] = useState<string | null>(null);
    const [showCorsError, setShowCorsError] = useState(false);
    const organ = organs.find((o) => o.key === organKey);
    const hymnIndexNum = parseInt(hymnIndex, 10);
    const { hymn, isLoading, error, isOnline } = useHymnByIndex(organKey, hymnIndexNum);
    const { removeItem } = useProgramacao();

    const handleBack = () => {
      navigate(`/organ/${organKey}`);
    };

    const handleAudioError = (errorMessage: string) => {
      console.error("Audio player error:", errorMessage);
      setAudioError(errorMessage);
      setShowCorsError(false);
    };

    const handleRetryAudio = () => {
      setAudioError(null);
      setShowCorsError(false);
    };

    if (!organ) {
      return (
        <Layout 
          title="Órgão não encontrado" 
          showBackButton={true}
          onBackClick={() => navigate("/")}
        >
          <div className="text-center">
            <p className="text-church-text">Órgão não encontrado.</p>
          </div>
        </Layout>
      );
    }

    if (isLoading) {
      return (
        <Layout 
          title="Carregando..."
          breadcrumbs={[organ.name, "Carregando..."]}
          showBackButton={true}
          onBackClick={handleBack}
        >
          <div className="max-w-2xl mx-auto text-center py-8">
            <div className="h-8 w-8 mx-auto mb-4 border-2 border-church-primary border-r-transparent rounded-full animate-spin"></div>
            <p className="text-church-text">Carregando hino...</p>
          </div>
        </Layout>
      );
    }

    if (error) {
      return (
        <Layout
          title="Erro"
          breadcrumbs={[organ.name, "Erro"]}
          showBackButton={true}
          onBackClick={handleBack}
        >
          <div className="max-w-2xl mx-auto text-center py-8">
            <p className="text-church-text text-red-600">
              Erro ao carregar hino local. Verifique se o arquivo está disponível no dispositivo.
            </p>
          </div>
        </Layout>
      );
    }

    if (!hymn) {
      return (
        <Layout 
          title="Hino não encontrado"
          breadcrumbs={[organ.name, "Hino não encontrado"]}
          showBackButton={true}
          onBackClick={handleBack}
        >
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-church-text">Hino não encontrado.</p>
          </div>
        </Layout>
      );
    }

    return (
      <Layout 
        title={hymn.titulo}
        breadcrumbs={[organ.name, hymn.titulo]}
        showBackButton={true}
        onBackClick={handleBack}
      >
        <div className="max-w-2xl mx-auto">        
          {showCorsError ? (
            <CorsErrorMessage onRetry={handleRetryAudio} />
          ) : (
            <AudioPlayer 
              hymn={hymn} 
              onError={handleAudioError} 
              onPlay={() => removeItem(organKey, hymnIndexNum)} 
            />
          )}

          {audioError && !showCorsError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center mt-4">
              <p className="text-red-800 text-sm">{audioError}</p>
            </div>
          )}
          {!isOnline && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                ℹ️ Reproduzindo em modo offline
              </p>
            </div>
          )}
        </div>
      </Layout>
    );
  }
