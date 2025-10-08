import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import SplashScreen from "@/components/SplashScreen";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings } from "lucide-react";

// flag em memória (só vive enquanto a ABA estiver aberta)
declare global {
  interface Window {
    __splashShown?: boolean;
  }
}

interface LayoutProps {
  children: React.ReactNode;
  title?: string;                 // quando presente, mostra TÍTULO (sem logo)
  breadcrumbs?: string[];
  showBackButton?: boolean;
  onBackClick?: () => void;
  showSettingsButton?: boolean;   // engrenagem só na Home
}

export default function Layout({
  children,
  title = "",
  breadcrumbs,
  showBackButton = false,
  onBackClick,
  showSettingsButton = false,
}: LayoutProps) {
  const [location, navigate] = useLocation();
  // 1) Marca quando a página vai recarregar/fechar
  useEffect(() => {
    const markReload = () => {
      try { sessionStorage.setItem("wasReload", "1"); } catch {}
    };
    window.addEventListener("beforeunload", markReload);
    return () => window.removeEventListener("beforeunload", markReload);
  }, []);

  // 2) Se foi reload e não está na home, volta para "/"
  useEffect(() => {
    let wasReload = false;
    try { wasReload = sessionStorage.getItem("wasReload") === "1"; } catch {}
    if (wasReload) {
      try { sessionStorage.removeItem("wasReload"); } catch {}
      if (location !== "/") {
        navigate("/", { replace: true });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Splash: mostra no primeiro load desta ABA; não reaparece ao trocar de rota
  const [showSplash, setShowSplash] = useState<boolean>(() => !window.__splashShown);

  const handleBackClick = () => {
    if (onBackClick) onBackClick();
    else navigate("/");
  };

  const handleSettingsClick = () => {
    navigate("/config");
  };

  return (
    <div className="min-h-screen bg-church-bg">
      {/* Splash por cima de tudo */}
      {showSplash && (
        <SplashScreen
          holdMs={1200}
          xfadeMs={950}
          logoHoldMs={800}
          onFinish={() => {
            window.__splashShown = true; // marca como mostrado nesta ABA
            setShowSplash(false);
          }}
        />
      )}
      <header
        className="shadow-lg relative flex items-center"
        style={{
          background: "linear-gradient(90deg, #0F2247, #4DB4E7)",
          height: "100px",
        }}
      >
        {/* Marca d'água */}
        <img
          src="/detalhe-header.png"
          alt="Detalhe"
          style={{
            position: "absolute",
            right: 0,
            top: "50%",
            transform: "translateY(-50%)",
            height: "140%",
            opacity: 0.6,
            zIndex: 1,
            mixBlendMode: "overlay",
            pointerEvents: "none",
          }}
        />

        <div
          className="container mx-auto px-4 h-full"
          style={{ position: "relative", zIndex: 2 }}
        >
          <div className="flex items-center justify-between h-full">
            <div className="flex items-center h-full">
              {showBackButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackClick}
                  className="mr-4 text-white hover:text-white hover:bg-white/10 p-4 rounded-lg"
                >
                  <ArrowLeft className="h-6 w-6" />
                </Button>
              )}

              {/* Se tiver title => mostra título; senão mostra logo (Home) */}
              {title ? (
                <h1 className="text-white font-bold ml-5 text-[25px]">{title}</h1>
              ) : (
                <img
                  src="/logo.svg"
                  alt="Belém Play"
                  style={{ maxHeight: "120%", marginLeft: 15, display: "block" }}
                />
              )}
            </div>

            {/* Engrenagem só aparece quando showSettingsButton = true (Home) */}
            {showSettingsButton && (
              <div className="flex items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSettingsClick}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-9 text-white hover:text-white hover:bg-white/10 p-5 rounded-xl border-2 border-white/30 hover:border-white/50 bg-[#3d8ebd] mt-[0px] mb-[0px] pt-[20px] pb-[20px]"
                  style={{ minHeight: "56px", minWidth: "56px" }}
                >
                  <Settings className="h-8 w-8" />
                </Button>
              </div>
            )}
          </div>

          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="mt-2 text-church-light text-sm">
              <span>Início</span>
              {breadcrumbs.map((crumb, index) => (
                <span key={index}>
                  <span className="mx-2">›</span>
                  <span>{crumb}</span>
                </span>
              ))}
            </nav>
          )}
        </div>
      </header>
      {/* Removido: barra de status Online/Sair do Layout para evitar duplicação */}
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
