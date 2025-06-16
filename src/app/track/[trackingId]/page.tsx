'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, ExternalLink, AlertCircle } from 'lucide-react';

export default function TrackingPage() {
  const params = useParams();
  const router = useRouter();
  const trackingId = params.trackingId as string;
  
  const [status, setStatus] = useState<'loading' | 'redirecting' | 'error'>('loading');
  const [error, setError] = useState<string>('');
  const [destinationUrl, setDestinationUrl] = useState<string>('');

  useEffect(() => {
    if (!trackingId) {
      setStatus('error');
      setError('ID de tracking no válido');
      return;
    }

    const recordClick = async () => {
      try {
        const response = await fetch(`/api/track/${trackingId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            referrer: document.referrer || 'direct',
            screenResolution: `${screen.width}x${screen.height}`,
            language: navigator.language
          })
        });

        const result = await response.json();

        if (response.ok && result.success) {
          setDestinationUrl(result.destinationUrl);
          setStatus('redirecting');
          
          // Redirigir después de un breve delay para mostrar el estado
          setTimeout(() => {
            window.location.href = result.destinationUrl;
          }, 2000);
        } else {
          setStatus('error');
          setError(result.error || 'Error al procesar el enlace');
        }
      } catch (error) {
        console.error('Error recording click:', error);
        setStatus('error');
        setError('Error de conexión');
      }
    };

    recordClick();
  }, [trackingId]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Procesando enlace...</h1>
          <p className="text-gray-600">Registrando tu visita y preparando el contenido</p>
        </div>
      </div>
    );
  }

  if (status === 'redirecting') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <ExternalLink className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">¡Perfecto!</h1>
          <p className="text-gray-600 mb-4">
            Tu visita ha sido registrada. Te estamos redirigiendo al contenido...
          </p>
          <div className="bg-white p-3 rounded-lg border border-green-200">
            <p className="text-sm text-gray-500 mb-1">Destino:</p>
            <p className="text-sm font-medium text-gray-900 truncate">{destinationUrl}</p>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            Si no eres redirigido automáticamente, 
            <a 
              href={destinationUrl} 
              className="text-green-600 hover:text-green-700 ml-1"
            >
              haz clic aquí
            </a>
          </p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-100">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Enlace No Válido</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Ir al Inicio
          </button>
        </div>
      </div>
    );
  }

  return null;
}