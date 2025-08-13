/**
 * Hook para manejo de errores en componentes funcionales
 * Complementa Error Boundary para casos específicos
 */

import { useState, useCallback, useEffect } from 'react';

export const useErrorHandler = (options = {}) => {
  const {
    onError = null,
    enableLogging = true,
    maxRetries = 3,
    retryDelay = 1000
  } = options;

  const [error, setError] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  /**
   * Manejar error capturado
   */
  const handleError = useCallback((error, context = {}) => {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      context,
      retryCount
    };

    // Log del error
    if (enableLogging) {
      console.error('🚨 Error capturado por useErrorHandler:', errorInfo);
    }

    // Callback personalizado
    if (onError) {
      try {
        onError(error, errorInfo);
      } catch (callbackError) {
        console.error('Error en callback onError:', callbackError);
      }
    }

    setError(errorInfo);
  }, [onError, enableLogging, retryCount]);

  /**
   * Wrapper para funciones async con manejo de errores
   */
  const executeWithErrorHandling = useCallback(async (fn, context = {}) => {
    try {
      setError(null);
      const result = await fn();
      setRetryCount(0); // Reset retry count en éxito
      return { success: true, data: result };
    } catch (error) {
      handleError(error, context);
      return { success: false, error: error.message };
    }
  }, [handleError]);

  /**
   * Reintentar operación fallida
   */
  const retry = useCallback(async (fn, context = {}) => {
    if (retryCount >= maxRetries) {
      return { success: false, error: 'Máximo número de reintentos alcanzado' };
    }

    setIsRetrying(true);
    setRetryCount(prev => prev + 1);

    try {
      // Delay antes del reintento
      await new Promise(resolve => setTimeout(resolve, retryDelay * retryCount));
      
      const result = await executeWithErrorHandling(fn, {
        ...context,
        isRetry: true,
        retryAttempt: retryCount + 1
      });

      setIsRetrying(false);
      return result;
    } catch (retryError) {
      setIsRetrying(false);
      return { success: false, error: retryError.message };
    }
  }, [retryCount, maxRetries, retryDelay, executeWithErrorHandling]);

  /**
   * Limpiar error
   */
  const clearError = useCallback(() => {
    setError(null);
    setRetryCount(0);
  }, []);

  /**
   * Determinar si se puede reintentar
   */
  const canRetry = retryCount < maxRetries;

  return {
    error,
    isRetrying,
    retryCount,
    canRetry,
    handleError,
    executeWithErrorHandling,
    retry,
    clearError
  };
};

/**
 * Hook para errores de red específicamente
 */
export const useNetworkErrorHandler = () => {
  const [networkError, setNetworkError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setNetworkError(null);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setNetworkError({
        type: 'offline',
        message: 'Sin conexión a internet',
        timestamp: new Date().toISOString()
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleNetworkError = useCallback((error) => {
    const isNetworkError = 
      error.name === 'TypeError' && error.message.includes('fetch') ||
      error.message.toLowerCase().includes('network') ||
      error.message.toLowerCase().includes('connection');

    if (isNetworkError) {
      setNetworkError({
        type: 'network',
        message: isOnline ? 'Error de conexión con el servidor' : 'Sin conexión a internet',
        timestamp: new Date().toISOString(),
        originalError: error.message
      });
      return true;
    }

    return false;
  }, [isOnline]);

  return {
    networkError,
    isOnline,
    handleNetworkError,
    clearNetworkError: () => setNetworkError(null)
  };
};

/**
 * Hook para errores de permisos
 */
export const usePermissionErrorHandler = () => {
  const [permissionError, setPermissionError] = useState(null);

  const handlePermissionError = useCallback((error) => {
    const isPermissionError = 
      error.name === 'NotAllowedError' ||
      error.name === 'SecurityError' ||
      error.message.toLowerCase().includes('permission') ||
      error.message.toLowerCase().includes('denied');

    if (isPermissionError) {
      let message = 'Error de permisos';
      let suggestion = 'Revisa los permisos del navegador';

      if (error.name === 'NotAllowedError') {
        message = 'Permisos denegados';
        suggestion = 'Permite el acceso al micrófono en tu navegador';
      } else if (error.name === 'SecurityError') {
        message = 'Error de seguridad';
        suggestion = 'Asegúrate de usar HTTPS';
      }

      setPermissionError({
        type: 'permission',
        message,
        suggestion,
        timestamp: new Date().toISOString(),
        originalError: error.message
      });
      return true;
    }

    return false;
  }, []);

  const requestPermissions = useCallback(async (type = 'microphone') => {
    try {
      if (type === 'microphone') {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setPermissionError(null);
        return { success: true };
      }
      
      return { success: false, error: 'Tipo de permiso no soportado' };
    } catch (error) {
      handlePermissionError(error);
      return { success: false, error: error.message };
    }
  }, [handlePermissionError]);

  return {
    permissionError,
    handlePermissionError,
    requestPermissions,
    clearPermissionError: () => setPermissionError(null)
  };
};

export default {
  useErrorHandler,
  useNetworkErrorHandler,
  usePermissionErrorHandler
};
