/**
 * Hook personalizado para manejo optimizado de llamadas
 * Mejora: Reduce re-renders y optimiza performance
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export const useCallManager = () => {
  const { agentData } = useAuth();
  const [callState, setCallState] = useState({
    currentCall: null,
    isCallActive: false,
    isLoading: false,
    error: null,
    audioLevel: 0,
    isMuted: false
  });

  // Referencias para evitar re-creación de objetos
  const callManagerRef = useRef(null);
  const audioMonitorRef = useRef(null);

  /**
   * Inicializar call manager con memoización
   */
  const initializeCallManager = useCallback(async () => {
    if (callManagerRef.current) return callManagerRef.current;

    try {
      // Importación dinámica para code splitting
      const { default: DialpadService } = await import('../services/dialpadService');
      callManagerRef.current = DialpadService;
      return DialpadService;
    } catch (error) {
      console.error('Error inicializando call manager:', error);
      throw error;
    }
  }, []);

  /**
   * Realizar llamada con estado optimizado
   */
  const makeCall = useCallback(async (phoneNumber) => {
    if (!agentData) {
      return { success: false, message: 'No hay agente autenticado' };
    }

    setCallState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const callManager = await initializeCallManager();
      const result = await callManager.makeCall(phoneNumber);

      if (result.success) {
        const currentCall = callManager.getCurrentCall();
        setCallState(prev => ({
          ...prev,
          currentCall,
          isCallActive: true,
          isLoading: false
        }));

        // Iniciar monitoreo de audio
        startAudioMonitoring(callManager);
      } else {
        setCallState(prev => ({
          ...prev,
          error: result.message,
          isLoading: false
        }));
      }

      return result;
    } catch (error) {
      setCallState(prev => ({
        ...prev,
        error: error.message,
        isLoading: false
      }));
      return { success: false, message: error.message };
    }
  }, [agentData, initializeCallManager]);

  /**
   * Finalizar llamada
   */
  const endCall = useCallback(async () => {
    setCallState(prev => ({ ...prev, isLoading: true }));

    try {
      const callManager = await initializeCallManager();
      const result = await callManager.endCall();

      // Detener monitoreo de audio
      stopAudioMonitoring();

      setCallState(prev => ({
        ...prev,
        currentCall: null,
        isCallActive: false,
        isLoading: false,
        audioLevel: 0,
        isMuted: false
      }));

      return result;
    } catch (error) {
      setCallState(prev => ({
        ...prev,
        error: error.message,
        isLoading: false
      }));
      return { success: false, message: error.message };
    }
  }, [initializeCallManager]);

  /**
   * Alternar micrófono
   */
  const toggleMute = useCallback(async () => {
    try {
      const callManager = await initializeCallManager();
      const newMuteState = !callState.isMuted;
      
      callManager.muteMicrophone(newMuteState);
      
      setCallState(prev => ({
        ...prev,
        isMuted: newMuteState
      }));

      return { success: true, isMuted: newMuteState };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }, [callState.isMuted, initializeCallManager]);

  /**
   * Monitoreo de audio optimizado
   */
  const startAudioMonitoring = useCallback((callManager) => {
    if (audioMonitorRef.current) return;

    const monitorAudio = async () => {
      if (!callManager.hasActiveCall()) {
        stopAudioMonitoring();
        return;
      }

      try {
        const level = await callManager.getAudioLevel();
        const isMuted = callManager.isMicrophoneMuted();

        setCallState(prev => {
          // Solo actualizar si hay cambios significativos
          if (Math.abs(prev.audioLevel - level) > 5 || prev.isMuted !== isMuted) {
            return {
              ...prev,
              audioLevel: level,
              isMuted: isMuted
            };
          }
          return prev;
        });

        // Continuar monitoreo
        audioMonitorRef.current = setTimeout(monitorAudio, 200);
      } catch (error) {
        console.warn('Error en monitoreo de audio:', error);
        stopAudioMonitoring();
      }
    };

    audioMonitorRef.current = setTimeout(monitorAudio, 200);
  }, []);

  /**
   * Detener monitoreo de audio
   */
  const stopAudioMonitoring = useCallback(() => {
    if (audioMonitorRef.current) {
      clearTimeout(audioMonitorRef.current);
      audioMonitorRef.current = null;
    }
  }, []);

  /**
   * Limpiar al desmontar
   */
  useEffect(() => {
    return () => {
      stopAudioMonitoring();
    };
  }, [stopAudioMonitoring]);

  /**
   * Obtener estadísticas de la llamada
   */
  const getCallStats = useCallback(() => {
    const { currentCall } = callState;
    if (!currentCall) return null;

    const duration = currentCall.startTime 
      ? Math.floor((new Date() - new Date(currentCall.startTime)) / 1000)
      : 0;

    return {
      phoneNumber: currentCall.phoneNumber,
      duration,
      status: currentCall.status,
      audioLevel: callState.audioLevel,
      isMuted: callState.isMuted
    };
  }, [callState]);

  return {
    // Estado
    ...callState,
    
    // Acciones
    makeCall,
    endCall,
    toggleMute,
    
    // Utilidades
    getCallStats,
    hasActiveCall: callState.isCallActive,
    
    // Limpiar error
    clearError: useCallback(() => {
      setCallState(prev => ({ ...prev, error: null }));
    }, [])
  };
};

export default useCallManager;
