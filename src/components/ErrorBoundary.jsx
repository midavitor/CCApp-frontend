/**
 * Error Boundary Component para CCApp
 * Captura errores de JavaScript en cualquier lugar del árbol de componentes
 */

import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    // Actualiza el estado para mostrar la UI de error
    return {
      hasError: true,
      errorId: Date.now().toString()
    };
  }

  componentDidCatch(error, errorInfo) {
    // Captura detalles del error
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Log del error para debugging
    console.error('🚨 Error capturado por ErrorBoundary:', error);
    console.error('📍 Información del error:', errorInfo);

    // Aquí se puede integrar con servicios de monitoreo como Sentry
    this.logErrorToService(error, errorInfo);
  }

  /**
   * Enviar error a servicio de monitoreo
   * @param {Error} error - Error capturado
   * @param {Object} errorInfo - Información adicional del error
   */
  logErrorToService(error, errorInfo) {
    try {
      // Preparar datos del error
      const errorData = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: this.props.userId || 'anonymous',
        errorBoundary: this.props.name || 'Unknown',
        errorId: this.state.errorId
      };

      // En producción, aquí se enviaría a Sentry, LogRocket, etc.
      if (process.env.NODE_ENV === 'production') {
        // Ejemplo con fetch a un endpoint de logging
        fetch('/api/errors', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(errorData)
        }).catch(logError => {
          console.warn('Error enviando log:', logError);
        });
      }

      // Guardar en localStorage para debugging local
      const storedErrors = JSON.parse(localStorage.getItem('ccapp_errors') || '[]');
      storedErrors.push(errorData);
      
      // Mantener solo los últimos 10 errores
      if (storedErrors.length > 10) {
        storedErrors.shift();
      }
      
      localStorage.setItem('ccapp_errors', JSON.stringify(storedErrors));

    } catch (logError) {
      console.error('Error al registrar el error:', logError);
    }
  }

  /**
   * Reintentar renderizado del componente
   */
  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  }

  /**
   * Recargar la página completamente
   */
  handleReload = () => {
    window.location.reload();
  }

  /**
   * Reportar error manualmente
   */
  handleReport = () => {
    const { error, errorInfo } = this.state;
    
    const emailBody = encodeURIComponent(`
Error Report - CCApp
====================

Error ID: ${this.state.errorId}
Timestamp: ${new Date().toISOString()}
URL: ${window.location.href}
User Agent: ${navigator.userAgent}

Error Message: ${error?.message || 'Unknown error'}

Component Stack:
${errorInfo?.componentStack || 'Not available'}

Error Stack:
${error?.stack || 'Not available'}

Reproduction Steps:
[Please describe what you were doing when the error occurred]

Additional Notes:
[Any additional information that might be helpful]
    `);

    window.open(`mailto:support@ccapp.com?subject=Error Report - ${this.state.errorId}&body=${emailBody}`);
  }

  /**
   * Determinar el tipo de error y mostrar UI apropiada
   */
  getErrorType() {
    const { error } = this.state;
    
    if (!error) return 'unknown';
    
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return 'network';
    }
    
    if (errorMessage.includes('permission') || errorMessage.includes('denied')) {
      return 'permission';
    }
    
    if (errorMessage.includes('twilio') || errorMessage.includes('device')) {
      return 'audio';
    }
    
    if (errorMessage.includes('firebase') || errorMessage.includes('firestore')) {
      return 'database';
    }
    
    return 'javascript';
  }

  /**
   * Obtener mensaje de error específico según el tipo
   */
  getErrorMessage() {
    const errorType = this.getErrorType();
    const { level = 'component' } = this.props;
    
    const messages = {
      network: {
        title: '🌐 Error de Conexión',
        description: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
        suggestion: 'Revisa tu conexión y vuelve a intentar.'
      },
      permission: {
        title: '🔒 Error de Permisos',
        description: 'La aplicación necesita permisos adicionales para funcionar.',
        suggestion: 'Permite el acceso al micrófono y recarga la página.'
      },
      audio: {
        title: '🎙️ Error de Audio',
        description: 'Hubo un problema con el sistema de audio o llamadas.',
        suggestion: 'Verifica que tu micrófono esté conectado y funcional.'
      },
      database: {
        title: '💾 Error de Base de Datos',
        description: 'No se pudo acceder a los datos del sistema.',
        suggestion: 'Intenta recargar la página o contacta al soporte.'
      },
      javascript: {
        title: '⚠️ Error de Aplicación',
        description: level === 'app' 
          ? 'Ocurrió un error inesperado en la aplicación.'
          : 'Ocurrió un error en esta sección de la aplicación.',
        suggestion: level === 'app'
          ? 'Recarga la página para reiniciar la aplicación.'
          : 'Intenta la acción nuevamente o recarga la página.'
      },
      unknown: {
        title: '❓ Error Desconocido',
        description: 'Ocurrió un error inesperado.',
        suggestion: 'Intenta recargar la página o contacta al soporte.'
      }
    };
    
    return messages[errorType] || messages.unknown;
  }

  render() {
    if (this.state.hasError) {
      const { level = 'component', fallback } = this.props;
      const errorMessage = this.getErrorMessage();
      
      // Si hay un fallback personalizado, usarlo
      if (fallback) {
        return fallback(this.state.error, this.handleRetry);
      }

      // UI de error para nivel de aplicación
      if (level === 'app') {
        return (
          <div className="error-boundary-app">
            <div className="error-container">
              <div className="error-header">
                <h1>{errorMessage.title}</h1>
                <p className="error-id">Error ID: {this.state.errorId}</p>
              </div>
              
              <div className="error-content">
                <div className="error-icon">💥</div>
                <h2>CCApp ha encontrado un problema</h2>
                <p>{errorMessage.description}</p>
                <p className="error-suggestion">{errorMessage.suggestion}</p>
              </div>
              
              <div className="error-actions">
                <button 
                  onClick={this.handleReload}
                  className="btn btn-primary"
                >
                  🔄 Recargar Aplicación
                </button>
                <button 
                  onClick={this.handleReport}
                  className="btn btn-secondary"
                >
                  📧 Reportar Error
                </button>
              </div>
              
              {process.env.NODE_ENV === 'development' && (
                <div className="error-details">
                  <details>
                    <summary>Detalles Técnicos (Desarrollo)</summary>
                    <pre className="error-stack">
                      {this.state.error && this.state.error.toString()}
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          </div>
        );
      }

      // UI de error para componentes específicos
      return (
        <div className="error-boundary-component">
          <div className="error-card">
            <div className="error-card-header">
              <span className="error-icon">⚠️</span>
              <h3>{errorMessage.title}</h3>
            </div>
            
            <div className="error-card-content">
              <p>{errorMessage.description}</p>
              <p className="error-suggestion">{errorMessage.suggestion}</p>
            </div>
            
            <div className="error-card-actions">
              <button 
                onClick={this.handleRetry}
                className="btn btn-sm btn-primary"
              >
                🔄 Reintentar
              </button>
              <button 
                onClick={this.handleReport}
                className="btn btn-sm btn-outline"
              >
                📧 Reportar
              </button>
            </div>
            
            {process.env.NODE_ENV === 'development' && (
              <div className="error-debug">
                <small>Error ID: {this.state.errorId}</small>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Si no hay error, renderizar los children normalmente
    return this.props.children;
  }
}

export default ErrorBoundary;
