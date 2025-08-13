/**
 * Componente de debugging para desarrollo
 * Solo se muestra en modo desarrollo
 */

import React, { useState, useEffect } from 'react';

const DebugPanel = ({ 
  errors = [],
  currentCall = null,
  serviceStatus = null,
  twilioStatus = null 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const collectDebugInfo = () => {
      setDebugInfo({
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        online: navigator.onLine,
        localStorage: {
          errorsStored: JSON.parse(localStorage.getItem('ccapp_errors') || '[]').length,
          lastError: JSON.parse(localStorage.getItem('ccapp_errors') || '[]').pop()
        },
        permissions: {
          microphone: 'unknown'
        },
        memory: performance.memory ? {
          used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + ' MB',
          total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + ' MB'
        } : 'No disponible'
      });
    };

    collectDebugInfo();
    const interval = setInterval(collectDebugInfo, 5000);

    return () => clearInterval(interval);
  }, []);

  // Solo mostrar en desarrollo
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="debug-panel">
      <button 
        className="debug-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        🐛 Debug {isOpen ? '▼' : '▶'}
      </button>
      
      {isOpen && (
        <div className="debug-content">
          <div className="debug-section">
            <h4>📊 Estado General</h4>
            <div className="debug-item">
              <strong>Timestamp:</strong> {debugInfo.timestamp}
            </div>
            <div className="debug-item">
              <strong>Online:</strong> {debugInfo.online ? '✅' : '❌'}
            </div>
            <div className="debug-item">
              <strong>Memoria:</strong> {debugInfo.memory?.used || 'N/A'}
            </div>
          </div>

          {serviceStatus && (
            <div className="debug-section">
              <h4>🌐 Servicio</h4>
              <div className="debug-item">
                <strong>Disponible:</strong> {serviceStatus.available ? '✅' : '❌'}
              </div>
              <div className="debug-item">
                <strong>Mensaje:</strong> {serviceStatus.message}
              </div>
            </div>
          )}

          {twilioStatus && (
            <div className="debug-section">
              <h4>📞 Twilio</h4>
              <div className="debug-item">
                <strong>Estado:</strong> {twilioStatus.state}
              </div>
              <div className="debug-item">
                <strong>Registrado:</strong> {twilioStatus.registered ? '✅' : '❌'}
              </div>
              <div className="debug-item">
                <strong>Conexión Activa:</strong> {twilioStatus.hasActiveConnection ? '✅' : '❌'}
              </div>
            </div>
          )}

          {currentCall && (
            <div className="debug-section">
              <h4>📱 Llamada Actual</h4>
              <div className="debug-item">
                <strong>ID:</strong> {currentCall.id}
              </div>
              <div className="debug-item">
                <strong>Número:</strong> {currentCall.phoneNumber}
              </div>
              <div className="debug-item">
                <strong>Estado:</strong> {currentCall.status}
              </div>
              <div className="debug-item">
                <strong>Audio:</strong> {currentCall.hasAudio ? '✅' : '❌'}
              </div>
            </div>
          )}

          {errors.length > 0 && (
            <div className="debug-section">
              <h4>❌ Errores Recientes</h4>
              {errors.slice(-3).map((error, index) => (
                <div key={index} className="debug-error">
                  <div className="debug-item">
                    <strong>Mensaje:</strong> {error.message}
                  </div>
                  <div className="debug-item">
                    <strong>Tiempo:</strong> {new Date(error.timestamp).toLocaleTimeString()}
                  </div>
                  {error.context && (
                    <div className="debug-item">
                      <strong>Contexto:</strong> {JSON.stringify(error.context)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="debug-actions">
            <button 
              onClick={() => {
                localStorage.removeItem('ccapp_errors');
                console.clear();
              }}
              className="debug-btn"
            >
              🗑️ Limpiar Logs
            </button>
            <button 
              onClick={() => {
                const debugData = {
                  debugInfo,
                  serviceStatus,
                  twilioStatus,
                  currentCall,
                  errors,
                  localStorage: localStorage.getItem('ccapp_errors')
                };
                
                const dataStr = JSON.stringify(debugData, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `ccapp-debug-${Date.now()}.json`;
                link.click();
                URL.revokeObjectURL(url);
              }}
              className="debug-btn"
            >
              💾 Exportar Debug
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebugPanel;
