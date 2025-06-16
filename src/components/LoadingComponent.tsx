import React from 'react';
import Image from 'next/image';

// Modelo de datos para el componente Loading
interface LoadingProps {
  /** Mensaje personalizado a mostrar durante la carga */
  message?: string;
  /** Tamaño del logo (small, medium, large) */
  size?: 'small' | 'medium' | 'large';
  /** Mostrar o ocultar el mensaje de carga */
  showMessage?: boolean;
  /** Color de fondo del overlay (opcional) */
  backgroundColor?: string;
}

/**
 * Componente de Loading Animado
 * 
 * CÓMO INTEGRARLO EN TU APP:
 * 
 * 1. INSTALACIÓN BÁSICA:
 *    import LoadingComponent from './components/LoadingComponent';
 * 
 * 2. USO CON ESTADO DE CARGA:
 *    const [isLoading, setIsLoading] = useState(true);
 *    
 *    return (
 *      <>
 *        {isLoading && <LoadingComponent message="Iniciando aplicación..." />}
 *        {!isLoading && <YourMainApp />}
 *      </>
 *    );
 * 
 * 3. USO CON CONTEXT (Recomendado para apps grandes):
 *    // En tu Context Provider
 *    const [appState, setAppState] = useState({ isLoading: true, isInitialized: false });
 *    
 *    // En tu componente raíz
 *    {appState.isLoading && <LoadingComponent />}
 * 
 * 4. USO CON REACT ROUTER (Para carga entre rutas):
 *    <Suspense fallback={<LoadingComponent message="Cargando página..." />}>
 *      <Routes>...</Routes>
 *    </Suspense>
 * 
 * 5. CONTROL PROGRAMÁTICO:
 *    useEffect(() => {
 *      const initializeApp = async () => {
 *        try {
 *          await loadUserData();
 *          await loadConfiguration();
 *          setIsLoading(false);
 *        } catch (error) {
 *          console.error('Error al inicializar:', error);
 *        }
 *      };
 *      
 *      initializeApp();
 *    }, []);
 */
const LoadingComponent: React.FC<LoadingProps> = ({
  message = "Cargando...",
  size = 'medium',
  showMessage = true,
  backgroundColor = 'rgba(0,0,0)' // Color de fondo por defecto
}) => {
  // Configuración de tamaños
  const sizeConfig = {
    small: { logo: 60, container: 'w-20 h-20' },
    medium: { logo: 80, container: 'w-24 h-24' },
    large: { logo: 120, container: 'w-32 h-32' }
  };

  const currentSize = sizeConfig[size];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor }}
    >
      <div className="flex flex-col items-center justify-center space-y-6">
        
        {/* Logo Animado */}
        <div className={`relative ${currentSize.container} flex items-center justify-center`}>
          
          {/* Logo Principal */}
          <div className="relative">
            <Image 
              src="/logo.png" 
              alt="Logo" 
              width={currentSize.logo} 
              height={currentSize.logo}
              className="animate-pulse"
              style={{
                filter: 'drop-shadow(0 8px 32px rgba(255, 107, 53, 0.3))',
                animation: 'logoFloat 2s ease-in-out infinite'
              }}
              priority
            />
          </div>

          {/* Anillo Orbital 1 */}
          <div 
            className="absolute border-2 rounded-full"
            style={{
              width: currentSize.logo * 1.6,
              height: currentSize.logo * 1.6,
              borderColor: '#ff6b35',
              borderStyle: 'solid',
              borderWidth: '2px',
              borderTopColor: 'transparent',
              borderRightColor: 'transparent',
              animation: 'orbit 3s linear infinite',
              opacity: 0.8
            }}
          />

          {/* Anillo Orbital 2 */}
          <div 
            className="absolute border-2 rounded-full"
            style={{
              width: currentSize.logo * 1.9,
              height: currentSize.logo * 1.9,
              borderColor: '#f7931e',
              borderStyle: 'solid',
              borderWidth: '2px',
              borderTopColor: 'transparent',
              borderLeftColor: 'transparent',
              animation: 'orbit 4s linear infinite reverse',
              opacity: 0.6
            }}
          />

          {/* Partículas flotantes */}
          <div 
            className="absolute w-2 h-2 bg-orange-400 rounded-full animate-ping"
            style={{
              top: '10%',
              right: '15%',
              animationDelay: '0s'
            }}
          />
          <div 
            className="absolute w-1.5 h-1.5 bg-red-400 rounded-full animate-ping"
            style={{
              bottom: '20%',
              left: '10%',
              animationDelay: '1s'
            }}
          />
          <div 
            className="absolute w-1 h-1 bg-yellow-400 rounded-full animate-ping"
            style={{
              top: '60%',
              right: '5%',
              animationDelay: '2s'
            }}
          />
        </div>

        {/* Mensaje de Carga */}
        {showMessage && (
          <div className="text-center space-y-2">
            <p 
              className="text-lg font-semibold animate-pulse"
              style={{ color: '#ff6b35' }}
            >
              {message}
            </p>
            
            {/* Barra de progreso animada */}
            <div className="w-48 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full animate-pulse"
                style={{
                  background: 'linear-gradient(90deg, #ff6b35, #f7931e, #ff4757)',
                  animation: 'progressBar 2s ease-in-out infinite'
                }}
              />
            </div>
            
            {/* Puntos de carga */}
            <div className="flex justify-center space-x-1 mt-4">
              {[0, 1, 2].map((index) => (
                <div
                  key={index}
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: '#ff6b35',
                    animation: `bounce 1.4s ease-in-out infinite both`,
                    animationDelay: `${index * 0.16}s`
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Estilos CSS en línea para las animaciones */}
      <style jsx>{`
        @keyframes orbit {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes logoFloat {
          0%, 100% {
            transform: scale(1) translateY(0px);
            filter: drop-shadow(0 8px 32px rgba(255, 107, 53, 0.3));
          }
          50% {
            transform: scale(1.05) translateY(-5px);
            filter: drop-shadow(0 12px 40px rgba(255, 107, 53, 0.5));
          }
        }

        @keyframes progressBar {
          0% {
            width: 0%;
            opacity: 1;
          }
          50% {
            width: 70%;
            opacity: 0.8;
          }
          100% {
            width: 100%;
            opacity: 0.6;
          }
        }

        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0);
          }
          40% {
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingComponent;